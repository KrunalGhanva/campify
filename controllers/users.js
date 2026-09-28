const User = require('../models/user');
const { cloudinary } = require('../cloudinary');

const publicUser = (user) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    avatar: user.avatar,
    role: user.role
});

module.exports.register = async (req, res, next) => {
    try {
        const { email, mobile, username, password } = req.body;
        const user = new User({ username });
        if (email) user.email = email;
        if (mobile) user.mobile = mobile;
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.status(201).json({ message: 'Welcome to Campify!', user: publicUser(registeredUser) });
        })
    } catch (e) {
        if (e.code === 11000 && e.keyPattern?.email) {
            return res.status(409).json({
                code: 'EMAIL_IN_USE',
                error: 'An account with this email address already exists. Please log in or use a different email.'
            });
        }
        if (e.code === 11000 && e.keyPattern?.mobile) {
            return res.status(409).json({
                code: 'MOBILE_IN_USE',
                error: 'An account with this mobile number already exists.'
            });
        }

        if (e.name === 'UserExistsError') {
            return res.status(409).json({
                code: 'USERNAME_IN_USE',
                error: 'That username is already taken. Please choose another one.'
            });
        }

        res.status(400).json({ error: e.message });
    }
}

module.exports.login = (req, res) => {
    res.json({ message: 'Welcome back!', user: publicUser(req.user) });
}

module.exports.logout = function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.json({ message: 'Good Bye!' });
    });
}

module.exports.currentUser = (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null });
}

module.exports.updateProfile = async (req, res, next) => {
    try {
        const { email, mobile, username } = req.body;
        const user = await User.findById(req.user._id);

        let orConditions = [{ username }];
        if (email) orConditions.push({ email });
        if (mobile) orConditions.push({ mobile });

        if (user.email !== email || user.username !== username || user.mobile !== mobile) {
            const existingUser = await User.findOne({ 
                $or: orConditions, 
                _id: { $ne: user._id } 
            });
            if (existingUser) {
                if (email && existingUser.email === email) {
                    return res.status(409).json({ code: 'EMAIL_IN_USE', error: 'Email already in use' });
                }
                if (mobile && existingUser.mobile === mobile) {
                    return res.status(409).json({ code: 'MOBILE_IN_USE', error: 'Mobile number already in use' });
                }
                if (username && existingUser.username === username) {
                    return res.status(409).json({ code: 'USERNAME_IN_USE', error: 'Username already taken' });
                }
            }
        }

        user.email = email ? email : undefined;
        user.mobile = mobile ? mobile : undefined;
        user.username = username;

        if (req.file) {
            if (user.avatar && user.avatar.filename) {
                await cloudinary.uploader.destroy(user.avatar.filename);
            }
            user.avatar = { url: req.file.path, filename: req.file.filename };
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user: publicUser(user) });
    } catch (e) {
        next(e);
    }
}

module.exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        
        user.authenticate(currentPassword, async (err, authUser, passwordError) => {
            if (err) return next(err);
            if (!authUser) {
                return res.status(400).json({ error: 'Incorrect current password' });
            }
            
            await user.setPassword(newPassword);
            await user.save();
            res.json({ message: 'Password updated successfully' });
        });
    } catch (e) {
        next(e);
    }
}
