const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewImageSchema = new Schema({
    url: String,
    filename: String
});

ReviewImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const reviewSchema = new Schema({
    body: String,
    rating: Number,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    images: [ReviewImageSchema]
}, { timestamps: true, toJSON: { virtuals: true } });

module.exports = mongoose.model('Review', reviewSchema);
