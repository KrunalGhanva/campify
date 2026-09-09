const express = require('express');
const router = express.Router();
const catchAsync = require('../utills/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgrounds');

// Multer is a node. js middleware for handling multipart/form-data , which is primarily used for uploading files.
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))
    // .post(isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground)) // For handling error when user enter string in price when user will submit form via POST method
    // .post(upload.array('image'), (req, res) => {
    //     console.log(req.body, req.files);
    //     res.send('IT WORKED!');
    // })

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, catchAsync(isAuthor), upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, catchAsync(isAuthor), catchAsync(campgrounds.deleteCampground))

module.exports = router;
