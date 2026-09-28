const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Campground = require('../models/campground');
const Review = require('../models/review');
const { isLoggedIn, isAdmin } = require('../middleware');
const catchAsync = require('../utills/catchAsync');
const ExpressError = require('../utills/ExpressError');
const { cloudinary } = require('../cloudinary');

// Session store injected from app.js after it is initialized (avoids circular require)
let _sessionStore = null;
const setSessionStore = (store) => { _sessionStore = store; };

// ─── Shared guard ────────────────────────────────────────────────
const guard = [isLoggedIn, isAdmin];

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────────
router.get('/stats', ...guard, catchAsync(async (req, res) => {
    const [userCount, campgroundCount, reviewCount] = await Promise.all([
        User.countDocuments(),
        Campground.countDocuments(),
        Review.countDocuments()
    ]);

    const adminCount = await User.countDocuments({ role: 'admin' });

    // Recent 5 campgrounds
    const recentCampgrounds = await Campground
        .find({})
        .sort({ _id: -1 })
        .limit(5)
        .populate('author', 'username avatar');

    // Recent 5 registrations
    const recentUsers = await User
        .find({})
        .sort({ _id: -1 })
        .limit(5)
        .select('username email role avatar createdAt');

    // Recent 5 reviews
    const recentReviews = await Review
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'username avatar');

    res.json({
        stats: {
            users: userCount,
            admins: adminCount,
            campgrounds: campgroundCount,
            reviews: reviewCount
        },
        recentCampgrounds,
        recentUsers,
        recentReviews
    });
}));

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/users  — paginated, searchable, filterable
// Query params: page, limit, search, role
// ─────────────────────────────────────────────────────────────────
router.get('/users', ...guard, catchAsync(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.role && ['user', 'admin'].includes(req.query.role)) {
        filter.role = req.query.role;
    }
    if (req.query.search) {
        const re = new RegExp(req.query.search.trim(), 'i');
        filter.$or = [{ username: re }, { email: re }];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('username email mobile role avatar suspended createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(filter)
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
}));

// ─────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/role  — toggle admin / user role
// ─────────────────────────────────────────────────────────────────
router.put('/users/:id/role', ...guard, catchAsync(async (req, res) => {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    res.json({ message: `Role updated to "${user.role}".`, role: user.role });
}));

// ─────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/suspend  — toggle suspended flag
// ─────────────────────────────────────────────────────────────────
router.put('/users/:id/suspend', ...guard, catchAsync(async (req, res) => {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot suspend yourself.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.suspended = !user.suspended;
    await user.save();

    // If suspending (not reactivating), delete all active sessions for this user
    // so they are immediately kicked out without needing to make another request
    if (user.suspended && _sessionStore) {
        try {
            const db = _sessionStore.db || _sessionStore.client?.db();
            if (db) {
                await db.collection('sessions').deleteMany({
                    'session': { $regex: `"${id}"` }
                });
            }
        } catch (sessionErr) {
            console.error('Failed to clear sessions for suspended user:', sessionErr.message);
        }
    }

    res.json({ message: user.suspended ? 'User suspended.' : 'User reactivated.', suspended: user.suspended });
}));

// ─────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id  — delete user + their campgrounds + reviews
// ─────────────────────────────────────────────────────────────────
router.delete('/users/:id', ...guard, catchAsync(async (req, res) => {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot delete your own account from the admin panel.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Delete Cloudinary avatar
    if (user.avatar && user.avatar.filename) {
        await cloudinary.uploader.destroy(user.avatar.filename);
    }

    // Delete campgrounds authored by this user (images + cascade reviews handled by model hook)
    const campgrounds = await Campground.find({ author: id });
    for (const cg of campgrounds) {
        for (const img of (cg.images || [])) {
            if (img.filename) await cloudinary.uploader.destroy(img.filename);
        }
        await Campground.findByIdAndDelete(cg._id); // triggers review cascade hook
    }

    // Delete reviews authored by this user that remain (on other campgrounds)
    const reviews = await Review.find({ author: id });
    for (const rv of reviews) {
        await Campground.findOneAndUpdate(
            { reviews: rv._id },
            { $pull: { reviews: rv._id } }
        );
        for (const img of (rv.images || [])) {
            if (img.filename) await cloudinary.uploader.destroy(img.filename);
        }
        await Review.findByIdAndDelete(rv._id);
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User and associated data deleted.' });
}));

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/campgrounds  — paginated
// ─────────────────────────────────────────────────────────────────
router.get('/campgrounds', ...guard, catchAsync(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
        const re = new RegExp(req.query.search.trim(), 'i');
        filter.$or = [{ title: re }, { location: re }];
    }

    const [campgrounds, total] = await Promise.all([
        Campground.find(filter)
            .select('title location price images author createdAt')
            .populate('author', 'username')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit),
        Campground.countDocuments(filter)
    ]);

    res.json({ campgrounds, total, page, pages: Math.ceil(total / limit) });
}));

// ─────────────────────────────────────────────────────────────────
// DELETE /api/admin/campgrounds/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/campgrounds/:id', ...guard, catchAsync(async (req, res) => {
    const cg = await Campground.findById(req.params.id);
    if (!cg) return res.status(404).json({ error: 'Campground not found.' });

    for (const img of (cg.images || [])) {
        if (img.filename) await cloudinary.uploader.destroy(img.filename);
    }
    await Campground.findByIdAndDelete(req.params.id); // triggers review cascade hook
    res.json({ message: 'Campground deleted.' });
}));

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/reviews  — paginated
// ─────────────────────────────────────────────────────────────────
router.get('/reviews', ...guard, catchAsync(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        Review.find({})
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Review.countDocuments()
    ]);

    res.json({ reviews, total, page, pages: Math.ceil(total / limit) });
}));

// ─────────────────────────────────────────────────────────────────
// DELETE /api/admin/reviews/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/reviews/:id', ...guard, catchAsync(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });

    for (const img of (review.images || [])) {
        if (img.filename) await cloudinary.uploader.destroy(img.filename);
    }
    await Campground.findOneAndUpdate(
        { reviews: review._id },
        { $pull: { reviews: review._id } }
    );
    await Review.findByIdAndDelete(review._id);
    res.json({ message: 'Review deleted.' });
}));

module.exports = { router, setSessionStore };
