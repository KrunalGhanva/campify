// const Joi = require('joi');
// const { number } = require('joi');

const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().trim().min(1).max(100).required().escapeHTML(),
        price: Joi.number().required().min(0),
        // image: Joi.string().required(),
        location: Joi.string().trim().min(1).max(200).required().escapeHTML(),
        description: Joi.string().trim().min(1).max(2000).required().escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required(),
        body: Joi.string().trim().min(1).max(1000).required().escapeHTML()
    }).required()
})

module.exports.userSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    username: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string().min(6).max(128).required()
});
