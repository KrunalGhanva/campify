const express = require('express');
const router = express.Router({ mergeParams: true });
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
const catchAsync = require('../utills/catchAsync');
const ExpressError = require('../utills/ExpressError');
const reviews = require('../controllers/reviews');

router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, catchAsync(isReviewAuthor), catchAsync(reviews.deleteReview))

module.exports = router;
