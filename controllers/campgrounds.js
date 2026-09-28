const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");
const ExpressError = require('../utills/ExpressError');

const findGeometry = async (location) => {
    if (!process.env.MAPBOX_TOKEN) {
        throw new ExpressError('Mapbox is not configured on the server.', 500);
    }

    const geoData = await geocoder.forwardGeocode({ query: location, limit: 1 }).send();
    const feature = geoData.body.features[0];
    if (!feature) {
        throw new ExpressError('Could not find that location. Please enter a more specific location.', 400);
    }
    return feature.geometry;
};

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.json({ campgrounds });
}

module.exports.createCampground = async (req, res) => {
    const campground = new Campground(req.body.campground);
    campground.geometry = await findGeometry(req.body.campground.location);
    campground.images = (req.files || []).map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    res.status(201).json({ message: 'Successfully made a new campground!', campground });
}

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author',
            select: 'username avatar'
        }
    }).populate('author');
    if (!campground) {
        return res.status(404).json({ error: 'Cannot find that campground!' });
    }
    res.json({ campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) throw new ExpressError('Cannot find that campground!', 404);

    const locationChanged = campground.location !== req.body.campground.location;
    Object.assign(campground, req.body.campground);
    if (locationChanged) {
        campground.geometry = await findGeometry(req.body.campground.location);
    }
    const imgs = (req.files || []).map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    const imagesToDelete = req.body.deleteImages
        ? (Array.isArray(req.body.deleteImages) ? req.body.deleteImages : [req.body.deleteImages])
        : [];
    if (imagesToDelete.length) {
        for (let filename of imagesToDelete) {
            await cloudinary.uploader.destroy(filename);
        }
        campground.images = campground.images.filter((image) => !imagesToDelete.includes(image.filename));
    }
    await campground.save();
    res.json({ message: 'Successfully updated campground!', campground });
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndDelete(id);
    if (!campground) throw new ExpressError('Cannot find that campground!', 404);
    await Promise.all(campground.images.map((image) => cloudinary.uploader.destroy(image.filename)));
    res.json({ message: 'Successfully deleted campground' });
}
