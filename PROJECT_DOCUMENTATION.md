# Campify — Project Documentation

Campify is a full-stack campground discovery application. Visitors can browse campgrounds and maps; authenticated users can create, edit, and delete their own campgrounds, upload images, and write or remove their own reviews.

The repository contains two applications:

| Application | Location | Purpose |
| --- | --- | --- |
| API server | repository root | Express REST API, session authentication, MongoDB persistence, image upload, and geocoding |
| Web client | `client/` | React single-page application built with Vite |

## Features

- Browse all campgrounds and view individual campground details.
- Display campground locations with Mapbox maps, including clustered markers on the list page.
- Register, log in, log out, and restore the current session.
- Create, update, and delete campgrounds when signed in.
- Upload JPEG and PNG campground images to Cloudinary; remove uploaded images during editing.
- Add one-to-five-star reviews and delete reviews owned by the signed-in user.
- Protect campground and review mutations with authentication and ownership checks.
- Validate input with Joi, sanitize HTML input, sanitize MongoDB operators, and apply Helmet security headers.

## Technology

### Server

- Node.js and Express 4
- MongoDB with Mongoose 7
- Passport Local and `passport-local-mongoose` for username/password sessions
- `express-session` with MongoDB-backed sessions via `connect-mongo`
- Cloudinary and Multer for image storage and multipart uploads
- Mapbox Geocoding SDK for converting locations into GeoJSON coordinates
- Joi and `sanitize-html` for request validation and HTML prevention

### Client

- React 19
- Vite 8
- React Router 7
- Axios
- Bootstrap 5
- Mapbox GL JS

## Repository Layout

```text
.
├── app.js                    # Express application entry point
├── middleware.js              # Auth, authorization, and validation middleware
├── schemas.js                 # Joi validation schemas
├── controllers/               # API route handlers
├── routes/                    # Express route definitions
├── models/                    # Mongoose models
├── cloudinary/                # Cloudinary/Multer configuration
├── seeds/                     # Optional sample-data seeder
├── public/                    # Legacy/static styles and scripts
├── utills/                    # Async wrapper and custom error class
├── client/                    # React/Vite application
│   ├── src/api/               # Axios client and API helper functions
│   ├── src/components/        # Shared UI components
│   ├── src/context/           # Authentication and flash-message state
│   ├── src/pages/             # Route-level React pages
│   └── vite.config.js         # Development proxy configuration
├── .env.example               # Server environment variable template
└── package.json               # Server scripts and dependencies
```

> Note: the directory is named `utills` in this repository; imports use that spelling.

## Prerequisites

- Node.js 18 or newer
- npm
- A running MongoDB instance, local or hosted
- A Mapbox access token
- A Cloudinary account and API credentials for image uploads

## Installation and Local Development

1. Install server packages from the repository root:

   ```bash
   npm install
   ```

2. Install client packages:

   ```bash
   cd client
   npm install
   ```

3. Copy `.env.example` to `.env` in the repository root and set real values:

   ```env
   DB_URL=mongodb://127.0.0.1:27017/yelp-camp
   SECRET=use-a-long-random-session-secret
   MAPBOX_TOKEN=server-mapbox-token
   CLOUDINARY_CLOUD_NAME=cloud-name
   CLOUDINARY_KEY=cloudinary-key
   CLOUDINARY_SECRET=cloudinary-secret
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. Create `client/.env` for browser-only settings:

   ```env
   VITE_MAPBOX_TOKEN=public-mapbox-token
   VITE_API_PROXY_TARGET=http://localhost:3000
   ```

   `VITE_MAPBOX_TOKEN` is intentionally visible to the browser. Restrict that token in Mapbox to the app’s permitted URLs. Do not put the Cloudinary secret, session secret, or database connection credentials in this file.

5. Start the API server from the repository root:

   ```bash
   npm start
   ```

   The API listens on `http://localhost:3000` unless `PORT` is set.

6. In a second terminal, start the Vite client:

   ```bash
   cd client
   npm run dev
   ```

   Vite serves the app at `http://localhost:5173` by default and proxies `/api` requests to the API server.

## Client Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/campgrounds` | Campground list and clustered map | Public |
| `/campgrounds/new` | New campground form | Signed in |
| `/campgrounds/:id` | Campground details, map, and reviews | Public |
| `/campgrounds/:id/edit` | Edit campground form | Signed in; server also checks ownership |
| `/login` | Sign-in form | Public |
| `/register` | Registration form | Public |

## API Reference

All API routes are prefixed with `/api`. Authentication uses a server-side session cookie, so browser requests must include credentials. The React Axios client already sets `withCredentials: true`.

### Authentication

| Method | Endpoint | Request body | Result |
| --- | --- | --- | --- |
| `POST` | `/api/register` | `{ email, username, password }` | Creates and signs in a user |
| `POST` | `/api/login` | `{ username, password }` | Starts a session |
| `POST` | `/api/logout` | None | Ends the current session |
| `GET` | `/api/me` | None | Returns the signed-in user or `null` |

Registration rules: email must be valid; username is 3–30 characters; password is 6–128 characters. Existing emails and usernames return `409 Conflict`.

### Campgrounds

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/api/campgrounds` | No | Lists all campgrounds |
| `POST` | `/api/campgrounds` | Yes | Creates a campground and accepts image files |
| `GET` | `/api/campgrounds/:id` | No | Returns a campground with its author and populated reviews |
| `PUT` | `/api/campgrounds/:id` | Owner only | Updates a campground and manages images |
| `DELETE` | `/api/campgrounds/:id` | Owner only | Deletes the campground, its Cloudinary images, and associated reviews |

Create and update use `multipart/form-data`. Text fields must be nested under `campground`, such as `campground[title]`; image files use the field name `image`. Campground validation requires:

- `title`: 1–100 characters
- `price`: number greater than or equal to zero
- `location`: 1–200 characters
- `description`: 1–2,000 characters

On creation—or when the location changes—the server geocodes the location with Mapbox and saves a GeoJSON `Point`.

### Reviews

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/api/campgrounds/:id/reviews` | Yes | Creates a review |
| `DELETE` | `/api/campgrounds/:id/reviews/:reviewId` | Review owner only | Deletes a review |

Review payload example:

```json
{
  "review": {
    "rating": 5,
    "body": "A quiet, well-kept site with a beautiful view."
  }
}
```

`rating` must be an integer from 1 through 5 and `body` must be 1–1,000 characters.

### Status and Error Responses

- `201 Created` for successful user, campground, and review creation.
- `400 Bad Request` for invalid request data or an unresolvable location.
- `401 Unauthorized` for an unauthenticated protected request.
- `403 Forbidden` when a signed-in user does not own the requested resource.
- `404 Not Found` for unknown routes or missing resources.
- `409 Conflict` for duplicate email addresses or usernames.
- Other server errors return JSON in the form `{ "error": "…", "statusCode": 500 }`.

## Data Model

### User

- `username` — managed by `passport-local-mongoose`
- `email` — required and unique
- Password hash and salt — managed by `passport-local-mongoose`; plaintext passwords are not stored

### Campground

- `title`, `price`, `description`, `location`
- `images[]` — Cloudinary `url` and `filename`
- `geometry` — GeoJSON Point with `[longitude, latitude]`
- `author` — reference to `User`
- `reviews[]` — references to `Review`

Deleting a campground triggers cleanup of its review documents. The controller also removes the campground’s Cloudinary assets.

### Review

- `body`
- `rating`
- `author` — reference to `User`

## Security and Deployment Notes

- Helmet sets a Content Security Policy and limits external content to the configured Mapbox, Cloudinary, Bootstrap, and related origins.
- `express-mongo-sanitize` replaces MongoDB operator characters in incoming request data.
- Joi validation and `sanitize-html` reject user-provided HTML in campground and review text.
- Production sessions use `Secure`, `HttpOnly`, and `SameSite=None` cookies. Deploy the API over HTTPS and set `CLIENT_ORIGIN` to the exact deployed client URL.
- The API enables `trust proxy` in production, which supports secure cookies behind a reverse proxy.
- Keep `.env` and `client/.env` out of version control. They are already ignored by `.gitignore`.

## Optional Sample Data

`seeds/index.js` clears the configured local `yelp-camp` collection and creates 300 sample campgrounds. It contains a hard-coded author ID, so create a matching user or update the ID before running it.

Run it from the repository root only when you are comfortable replacing local campground data:

```bash
node seeds/index.js
```

## Available Commands

| Directory | Command | Purpose |
| --- | --- | --- |
| Root | `npm start` | Run the Express API |
| Root | `npm test` | Currently exits with “no test specified” |
| `client/` | `npm run dev` | Start Vite development server |
| `client/` | `npm run build` | Create a production client build |
| `client/` | `npm run preview` | Preview the built client |
| `client/` | `npm run lint` | Run Oxlint |

## Current Project State

The React application is wired from `client/src/main.jsx`, which defines the active browser routes. `client/src/App.jsx` remains the default Vite starter component and is not the application entry route; it can be removed or repurposed when convenient. The root server currently exposes only the API and does not serve the client’s production `dist/` output, so deploy the client separately or add static-client serving as part of a production deployment plan.
