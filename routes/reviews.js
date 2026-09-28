const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const { validateReview, validateUpdateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
const catchAsync = require('../utills/catchAsync');
const reviews = require('../controllers/reviews');

// POST /api/campgrounds/:id/reviews  — create with optional photo uploads
router.post(
    '/',
    isLoggedIn,
    upload.array('image', 6),
    validateReview,
    catchAsync(reviews.createReview)
);

// PUT /api/campgrounds/:id/reviews/:reviewId  — edit (owner only)
router.put(
    '/:reviewId',
    isLoggedIn,
    catchAsync(isReviewAuthor),
    upload.array('image', 6),
    validateUpdateReview,
    catchAsync(reviews.updateReview)
);

// DELETE /api/campgrounds/:id/reviews/:reviewId
router.delete(
    '/:reviewId',
    isLoggedIn,
    catchAsync(isReviewAuthor),
    catchAsync(reviews.deleteReview)
);

module.exports = router;
