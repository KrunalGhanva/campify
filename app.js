// env file is a convenient way to store environment-specific variables, such as API keys and database passwords, in a simple text file. This enables you to manage sensitive information consistently while maintaining its security.
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// console.log(process.env.SECRET);
// console.log(process.env.API_KEY);
// console.log(process.env.MAPBOX_TOKEN);

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const cors = require('cors');
const ExpressError = require('./utills/ExpressError');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
const MongoDBStore = require('connect-mongo');
// const MongoDBStore = require('connect-mongo').default;

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';
// const dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';
// console.log(dbUrl);
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    // useCreateIndex: true,        //--> it throwing an error so it's commented -> refer it in future
    useUnifiedTopology: true,
    // useFindAndModify: false      //--> it throwing an error so it's commented -> refer it in future
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Database Connected");
});

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: clientOrigin,
    credentials: true
}));
app.use(mongoSanitize({
    replaceWith: '_'
}))

// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
// const secret = 'thisshouldbeabettersecret!';

const store = MongoDBStore.create({
// const store = new MongoDBStore({
    mongoUrl: dbUrl,
    // mongooseConnection: db,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

if (isProduction) {
    app.set('trust proxy', 1);
}

const sessionConfig = {
    store,
    name: 'session',
    // secret: 'thisshouldbeabettersecret!',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

// app.use(session(sessionConfig));
app.use(session(sessionConfig));

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com",
    "https://api.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com",
];

const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://stackpath.bootstrapcdn.com",
    "https://api.mapbox.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://cdn.jsdelivr.net",
];

const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://a.tiles.mapbox.com",
    "https://b.tiles.mapbox.com",
    "https://events.mapbox.com",
];

const fontSrcUrls = [];

app.use(    
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [],
                connectSrc: ["'self'", ...connectSrcUrls],
                scriptSrc: ["'self'","'unsafe-inline'", ...scriptSrcUrls],
                styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
                workerSrc: ["'self'", "blob:"],
                objectSrc: [],
                imgSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "blob:",
                    "data:",
                    "https://res.cloudinary.com/drvz6utna/",
                    "https://images.unsplash.com/",
                ],
                fontSrc: ["'self'", ...fontSrcUrls],
            },
        },
    })
);


// Initialize Passport.js for authentication in the Express.js app
app.use(passport.initialize());

// Use Passport's session management middleware
app.use(passport.session());

// Configure Passport to use the LocalStrategy for authentication
passport.use(new LocalStrategy(User.authenticate()));

// Serialize the user's information to be stored in the session
passport.serializeUser(User.serializeUser());

// Deserialize the user's information from the session
passport.deserializeUser(User.deserializeUser());


app.use('/api', userRoutes);
app.use('/api/campgrounds', campgroundRoutes);
app.use('/api/campgrounds/:id/reviews', reviewRoutes);

// app.get('/makecampground', async (req, res) => {
//     const camp = new Campground({ title: 'My Backyard', description: 'cheap camping!' });
//     await camp.save();
//     res.send(camp);
// })

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message } = err;

    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Resource not found';
    }

    if (!message) message = 'Oh no, something went wrong!';
    res.status(statusCode).json({ error: message, statusCode });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
    // console.log("Listening On Port 3000");
})
