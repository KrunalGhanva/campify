const express = require('express');
const router = express.Router();
const catchAsync = require('../utills/catchAsync');
const passport = require('passport');
const users = require('../controllers/users');
const { validateUser } = require('../middleware');

router.post('/register', validateUser, catchAsync(users.register));

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info?.message || 'Invalid username or password' });
        req.logIn(user, (loginError) => {
            if (loginError) return next(loginError);
            return users.login(req, res);
        });
    })(req, res, next);
});

router.post('/logout', users.logout);

router.get('/me', (req, res) => {
    users.currentUser(req, res);
});

module.exports = router;
