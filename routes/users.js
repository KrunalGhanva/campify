const express = require('express');
const router = express.Router();
const catchAsync = require('../utills/catchAsync');
const users = require('../controllers/users');
const { validateUser, isLoggedIn, validateProfileUpdate, validatePasswordUpdate, checkNotSuspended } = require('../middleware');
const User = require('../models/user');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.post('/register', validateUser, catchAsync(users.register));

router.post('/login', async (req, res, next) => {
    const { loginIdentifier, password } = req.body;
    try {
        const user = await User.findOne({
            $or: [
                { username: loginIdentifier },
                { email: loginIdentifier },
                { mobile: loginIdentifier }
            ]
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Block suspended accounts before a session is ever created
        if (checkNotSuspended(user, res)) return;
        
        user.authenticate(password, (err, authUser, passwordError) => {
            if (err) return next(err);
            if (!authUser) return res.status(401).json({ error: 'Invalid credentials' });
            
            req.logIn(authUser, (loginError) => {
                if (loginError) return next(loginError);
                return users.login(req, res);
            });
        });
    } catch (e) {
        next(e);
    }
});

router.post('/logout', users.logout);

router.get('/me', (req, res) => {
    users.currentUser(req, res);
});

router.put('/me/profile', isLoggedIn, upload.single('avatar'), validateProfileUpdate, catchAsync(users.updateProfile));
router.put('/me/password', isLoggedIn, validatePasswordUpdate, catchAsync(users.updatePassword));

module.exports = router;
