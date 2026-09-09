const Campground = require('../models/campground');
const Review = require('../models/review');
const ExpressError = require('../utills/ExpressError');

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) throw new ExpressError('Cannot find that campground!', 404);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.status(201).json({ message: 'Created new review!', review });
}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.json({ message: 'Successfully deleted review' });
}
