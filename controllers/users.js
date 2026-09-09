const User = require('../models/user')

const publicUser = (user) => ({
    _id: user._id,
    username: user.username,
    email: user.email
});

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
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
