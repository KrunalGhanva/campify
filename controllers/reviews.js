const Campground = require('../models/campground');
const Review = require('../models/review');
const ExpressError = require('../utills/ExpressError');
const { cloudinary } = require('../cloudinary');

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) throw new ExpressError('Cannot find that campground!', 404);

    const review = new Review(req.body.review);
    review.author = req.user._id;

    // Attach uploaded images if any
    if (req.files && req.files.length > 0) {
        review.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    }

    campground.reviews.push(review);
    await review.save();
    await campground.save();

    // Populate author before returning
    await review.populate('author', 'username avatar');
    res.status(201).json({ message: 'Created new review!', review });
};

module.exports.updateReview = async (req, res) => {
    const { id, reviewId } = req.params;

    // isReviewAuthor middleware already verified ownership
    const review = await Review.findById(reviewId);
    if (!review) throw new ExpressError('Cannot find that review!', 404);

    // Update scalar fields
    const { rating, body } = req.body.review || {};
    if (rating !== undefined) review.rating = rating;
    if (body !== undefined) review.body = body;

    // Append new uploaded images
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
        review.images.push(...newImages);
    }

    // Delete images by filename
    const deleteImages = req.body.deleteImages;
    if (deleteImages && deleteImages.length) {
        // Remove from Cloudinary
        for (const filename of deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        // Remove from images array
        review.images = review.images.filter(img => !deleteImages.includes(img.filename));
    }

    await review.save();
    await review.populate('author', 'username avatar');
    res.json({ message: 'Updated review!', review });
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    // Delete associated Cloudinary images
    const review = await Review.findById(reviewId);
    if (review && review.images && review.images.length) {
        for (const img of review.images) {
            await cloudinary.uploader.destroy(img.filename);
        }
    }

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.json({ message: 'Successfully deleted review' });
};
