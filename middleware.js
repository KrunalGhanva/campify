const { campgroundSchema, reviewSchema, updateReviewSchema, userSchema, updateProfileSchema, updatePasswordSchema } = require('./schemas.js');
const ExpressError = require('./utills/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'You must be signed in' });
    }
    // Reject every request from a suspended account
    if (req.user && req.user.suspended) {
        // Destroy the session so they are fully logged out on next page load
        req.logout((err) => { if (err) console.error('Session destroy error:', err); });
        return res.status(403).json({
            code: 'ACCOUNT_SUSPENDED',
            error: 'Your account has been suspended. Please contact support.'
        });
    }
    next();
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to access the admin area.' });
    }
    next();
}

// Standalone check — used inside the login route BEFORE the session is created
module.exports.checkNotSuspended = (user, res) => {
    if (user && user.suspended) {
        res.status(403).json({
            code: 'ACCOUNT_SUSPENDED',
            error: 'Your account has been suspended. Please contact support.'
        });
        return true; // caller should stop processing
    }
    return false;
}

module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    // console.log(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        return next(new ExpressError('Cannot find that campground!', 404));
    }
    if (!campground.author || !campground.author.equals(req.user._id)) {
        return res.status(403).json({ error: 'You do not have permission to do that!' });
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const [campground, review] = await Promise.all([
        Campground.findById(id),
        Review.findById(reviewId)
    ]);
    if (!campground || !review || !campground.reviews.some((reviewObjectId) => reviewObjectId.equals(review._id))) {
        return next(new ExpressError('Cannot find that review for this campground!', 404));
    }
    if (!review.author || !review.author.equals(req.user._id)) {
        return res.status(403).json({ error: 'You do not have permission to do that!' });
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateUpdateReview = (req, res, next) => {
    const { error } = updateReviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        return next(new ExpressError(msg, 400));
    }
    next();
}

module.exports.validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');
        return next(new ExpressError(message, 400));
    }
    next();
}

module.exports.validateProfileUpdate = (req, res, next) => {
    const { error } = updateProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');
        return next(new ExpressError(message, 400));
    }
    next();
}

module.exports.validatePasswordUpdate = (req, res, next) => {
    const { error } = updatePasswordSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');
        return next(new ExpressError(message, 400));
    }
    next();
}
