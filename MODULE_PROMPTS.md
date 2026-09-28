# MODULE_PROMPTS.md — Per-Module Briefing Prompts for Campify

Each section below covers one functional module of Campify. Every section has the same shape:

- **Purpose** — what the module does, in one or two sentences.
- **Files** — every file that belongs to the module, with a one-line description.
- **Depends on / talks to** — the other modules it touches, so an agent knows what *not* to break.
- **Conventions & gotchas** — real quirks in this codebase, specific to that module.
- **Agent prompt** — a ready-to-paste briefing. Copy the fenced block, replace the `[TASK]` line at the bottom with what you actually want done, and hand it to an agent. It contains everything the agent needs to work safely inside that module without loading the whole repository.

Read `AGENTS.md` first for the project-wide picture — these prompts assume that context and don't repeat it.

---

## Server modules

### S1. Server Bootstrap & Security Config

**Purpose:** Wires up the Express app itself — DB connection, sessions, Passport, CORS, Helmet CSP, body parsing, route mounting, and the global error handler.

**Files:**
- `app.js` — the entire bootstrap sequence lives in this one file.

**Depends on / talks to:** `models/user.js` (Passport strategy), `routes/*` (mounted here), `utills/ExpressError.js` (error shape).

**Conventions & gotchas:**
- CSP allowlists (`scriptSrcUrls`, `styleSrcUrls`, `connectSrcUrls`, `imgSrc`) are explicit arrays — any new external host (CDN, API, image domain) must be added here or the browser silently blocks it.
- `trust proxy` is only set in production, which is required for secure cookies behind a reverse proxy (Heroku/Render/etc.).
- Session cookie `sameSite` is `'none'` in production (needed for a cross-origin client) and `'lax'` in dev.
- The catch-all `app.all('*', ...)` 404 handler and the final error-handling middleware must stay as the *last* two `app.use`/`app.all` calls — Express error handlers only work if they're registered after everything else.
- The server never serves `client/dist` — there's no static fallback for the SPA build.

```
You are working on the Server Bootstrap & Security Config module of Campify,
a full-stack campground app (Express + MongoDB API in the repo root, React/Vite
client in client/). This module is entirely app.js: DB connection, express-session
+ connect-mongo, Passport local-strategy wiring, Helmet CSP allowlists, CORS
(credentials: true, origin = CLIENT_ORIGIN), body parsing, mounting of
routes/users.js, routes/campgrounds.js, routes/reviews.js under /api, and the
final 404 + JSON error-handling middleware (which must stay last).

Conventions to preserve:
- CSP allowlist arrays (scriptSrcUrls/styleSrcUrls/connectSrcUrls/imgSrc) must be
  updated whenever a new external host is introduced anywhere in the app.
- Sessions are cookie-based (not JWT); CORS credentials and CLIENT_ORIGIN must stay
  consistent with client/src/api/axiosClient.js's withCredentials: true.
- The 404 handler and error middleware must remain the last two registrations.
- Read DB_URL, SECRET, MAPBOX_TOKEN, CLOUDINARY_*, CLIENT_ORIGIN, PORT from
  process.env with the existing fallback defaults; don't hardcode secrets.

Now do this: [TASK]
```

---

### S2. Authentication & Users

**Purpose:** Registration, login, logout, and "who am I" — backed by Passport's local strategy and session cookies.

**Files:**
- `routes/users.js` — `/api/register`, `/api/login`, `/api/logout`, `/api/me`
- `controllers/users.js` — handlers; returns a trimmed `publicUser` (`_id`, `username`, `email` only — never the hash/salt)
- `models/user.js` — `email` field + `passport-local-mongoose` plugin (adds hash/salt/username handling)
- `schemas.js` → `userSchema` — Joi rules: email format, username 3–30 chars, password 6–128 chars
- `middleware.js` → `validateUser`, `isLoggedIn`

**Depends on / talks to:** `app.js` (Passport init/serialize), consumed by client's `context/AuthContext.jsx` and `api/auth.js`.

**Conventions & gotchas:**
- Duplicate email → `409` with `code: 'EMAIL_IN_USE'`; duplicate username → `409` with `code: 'USERNAME_IN_USE'` (via `passport-local-mongoose`'s `UserExistsError`). The client reads these `code` values to highlight the right field — keep them stable if you touch this.
- `register` logs the user in immediately (`req.login`) after creating the account — registration and login are combined in one round trip from the client's perspective.
- Never add password/hash fields to `publicUser` or any JSON response.
- `isLoggedIn` returns `401` JSON (not a redirect) — this is an API, there's no server-rendered login page to redirect to.

```
You are working on the Authentication & Users module of Campify, a full-stack
campground app (Express + MongoDB API in the repo root, React/Vite client in
client/). This module covers registration, login, logout, and session lookup.

Files: routes/users.js, controllers/users.js, models/user.js, schemas.js
(userSchema only), middleware.js (validateUser, isLoggedIn).

Conventions to preserve:
- Auth is passport-local + passport-local-mongoose; sessions are cookie-based,
  not tokens.
- API responses only ever include a "publicUser" shape ({_id, username, email}) —
  never return the password hash/salt fields passport-local-mongoose manages.
- Duplicate email/username must keep returning 409 with code EMAIL_IN_USE /
  USERNAME_IN_USE respectively — the client (pages/Register.jsx) matches on
  these exact code strings to show field-specific errors.
- register() logs the new user in immediately via req.login; don't split that
  into two round trips without updating the client to match.
- isLoggedIn responds with 401 JSON, never a redirect.
- Joi validation for user input lives in schemas.js (userSchema); mirror any
  rule change in client/src/utils/validation.js (validateLogin/validateRegistration).

Now do this: [TASK]
```

---

### S3. Campgrounds — CRUD, Geocoding & Ownership

**Purpose:** Create/read/update/delete campgrounds, including geocoding the free-text `location` into GeoJSON coordinates via Mapbox, and enforcing that only the owning user can edit/delete.

**Files:**
- `routes/campgrounds.js` — routes + Multer wiring (`upload.array('image')`) + middleware chain
- `controllers/campgrounds.js` — handlers, plus `findGeometry()` (Mapbox forward geocoding)
- `models/campground.js` — schema, `images[]` subdocs with a `thumbnail` virtual, GeoJSON `geometry`, cascading review deletion on `findOneAndDelete`
- `schemas.js` → `campgroundSchema` — title/price/location/description limits + HTML stripping (`.escapeHTML()`)
- `middleware.js` → `isAuthor`, `validateCampground`

**Depends on / talks to:** S5 (Cloudinary/Multer for image storage), S2 (`isLoggedIn`), client's `pages/CampgroundList.jsx`, `CampgroundShow.jsx`, `CampgroundNew.jsx`, `CampgroundEdit.jsx`, `api/campgrounds.js`.

**Conventions & gotchas:**
- Geocoding runs on **create**, and on **update only if `location` actually changed** (compares old vs. new before calling Mapbox) — don't make every update re-geocode.
- A failed/empty geocode result throws a `400 ExpressError`, not a silent fallback — there's no "campground with no coordinates" state by design.
- Request body for create/update is `multipart/form-data` with fields nested as `campground[title]`, `campground[price]`, etc. (bracket notation), because the same Joi schema (`campgroundSchema`) expects `{ campground: {...} }`.
- Update supports partial image management: new files are **appended** to `images[]`; `deleteImages` (array of Cloudinary `filename`s) removes specific existing images and calls `cloudinary.uploader.destroy` for each.
- Deleting a campground deletes its Cloudinary images *and* triggers the model-level Mongoose hook that deletes its reviews — don't duplicate that review-cleanup logic in the controller.
- `isAuthor` middleware (in `middleware.js`, not here) is what enforces ownership — reuse it for any new mutating route rather than re-checking `campground.author` inline.

```
You are working on the Campgrounds module of Campify, a full-stack campground
app (Express + MongoDB API in the repo root, React/Vite client in client/).
This module handles campground CRUD, image attachment, and Mapbox geocoding.

Files: routes/campgrounds.js, controllers/campgrounds.js, models/campground.js,
schemas.js (campgroundSchema only), middleware.js (isAuthor, validateCampground).

Conventions to preserve:
- Geocoding (findGeometry, using @mapbox/mapbox-sdk) runs on create always, and
  on update only when campground.location actually changed — don't geocode on
  every update.
- A failed geocode throws a 400 ExpressError; there is no "no coordinates"
  fallback state for a campground.
- Create/update requests are multipart/form-data with campground[title],
  campground[price], campground[location], campground[description] (bracket
  notation) plus repeated "image" file fields and an optional deleteImages
  array of Cloudinary filenames to remove.
- Update appends new images to the existing images[] array and only removes
  images explicitly listed in deleteImages.
- Deleting a campground must also destroy its Cloudinary images (controller)
  and relies on a post('findOneAndDelete') Mongoose hook in models/campground.js
  to cascade-delete its reviews — don't duplicate that cleanup in the controller.
- Ownership enforcement goes through the isAuthor middleware in middleware.js,
  not ad hoc checks in the controller.
- Joi validation lives in schemas.js (campgroundSchema, with .escapeHTML() to
  strip HTML); mirror any rule change in client/src/utils/validation.js
  (validateCampground).

Now do this: [TASK]
```

---

### S4. Reviews

**Purpose:** Add and remove 1–5 star reviews on a campground, scoped to the review's own author.

**Files:**
- `routes/reviews.js` — `POST /` and `DELETE /:reviewId`, mounted at `/api/campgrounds/:id/reviews` with `mergeParams: true`
- `controllers/reviews.js` — create pushes the new review's `_id` onto the campground's `reviews[]`; delete pulls it back out and deletes the `Review` doc
- `models/review.js` — `body`, `rating`, `author`
- `schemas.js` → `reviewSchema` — `rating` integer 1–5, `body` 1–1000 chars, HTML-stripped
- `middleware.js` → `isReviewAuthor`, `validateReview`

**Depends on / talks to:** S2 (`isLoggedIn`), S3 (`Campground` model, since a review only exists attached to a campground), client's `components/ReviewForm.jsx`, `ReviewList.jsx`, `StarRating.jsx`, `api/reviews.js`.

**Conventions & gotchas:**
- Creating and deleting both touch **two collections** (`Campground.reviews[]` and the standalone `Review` document) — always keep them in sync; a review's `_id` should never be left dangling in a campground's array after the `Review` doc is deleted, or vice versa.
- `isReviewAuthor` checks *both* that the campground actually contains that review reference *and* that the requesting user is the review's author (`404` if the review isn't linked to that campground, `403` if it's someone else's).
- `router.route` here uses `{ mergeParams: true }` so `req.params.id` (the campground id from the parent route) is available inside this router.

```
You are working on the Reviews module of Campify, a full-stack campground app
(Express + MongoDB API in the repo root, React/Vite client in client/). This
module handles creating and deleting star reviews on a campground.

Files: routes/reviews.js, controllers/reviews.js, models/review.js, schemas.js
(reviewSchema only), middleware.js (isReviewAuthor, validateReview).

Conventions to preserve:
- A review lives in two places: as its own Review document, and as an ObjectId
  reference inside the parent Campground's reviews[] array. Create must push
  onto both; delete must pull from both ($pull on the campground plus
  findByIdAndDelete on the review) — never let them get out of sync.
- routes/reviews.js is mounted with { mergeParams: true } so it can read the
  campground id (req.params.id) from the parent route
  (/api/campgrounds/:id/reviews) — preserve that if you change the mount point.
- isReviewAuthor must keep checking both that the review belongs to that
  specific campground (404 if not) and that req.user owns the review (403 if
  not) — don't collapse these into a single check.
- rating is an integer 1–5 and body is 1–1000 chars, validated via Joi
  (schemas.js -> reviewSchema, HTML-stripped with .escapeHTML()). Mirror any
  rule change in client/src/utils/validation.js (validateReview).

Now do this: [TASK]
```

---

### S5. Image Upload (Cloudinary + Multer)

**Purpose:** Stores campground photos in Cloudinary via a Multer storage engine, and provides thumbnail-friendly URLs.

**Files:**
- `cloudinary/index.js` — Cloudinary SDK config + `CloudinaryStorage` (folder `YelpCamp`, allowed formats `jpeg/png/jpg`)
- Consumed in `routes/campgrounds.js` (`multer({ storage })`, `upload.array('image')`)
- The `thumbnail` virtual on `ImageSchema` in `models/campground.js` derives a `w_200` Cloudinary transform URL from the stored `url`

**Depends on / talks to:** S3 (campground create/update routes and controller call into this), client renders `images[i].url` (full size) and `images[i].thumbnail` (edit-page previews).

**Conventions & gotchas:**
- Cloudinary credentials fall back to obviously-fake defaults (`dummy_cloud_name`, etc.) if env vars are missing — this lets the server boot without crashing in a misconfigured environment, but uploads will fail. Don't remove the fallback without adding an explicit startup check instead.
- Each stored image has both a `url` (full asset) and a `filename` (the Cloudinary public ID) — deletion (`cloudinary.uploader.destroy`) always uses `filename`, never `url`.
- Allowed formats are enforced at the storage-engine level (`allowedFormats: ['jpeg', 'png', 'jpg']`); there's no separate server-side MIME check beyond that.

```
You are working on the Image Upload (Cloudinary) module of Campify, a
full-stack campground app (Express + MongoDB API in the repo root, React/Vite
client in client/). This module configures Cloudinary storage for campground
photos.

Files: cloudinary/index.js (primary), plus its usage point in
routes/campgrounds.js (multer({ storage }), upload.array('image')) and the
`thumbnail` virtual on ImageSchema in models/campground.js.

Conventions to preserve:
- Every stored image subdocument has both `url` (full Cloudinary asset URL) and
  `filename` (Cloudinary public ID). Deletion always uses `filename` via
  cloudinary.uploader.destroy — never derive a filename from the url string.
  Thumbnails are produced by string-replacing '/upload' with '/upload/w_200' in
  the url, not by a second Cloudinary call.
- Cloudinary config reads CLOUDINARY_CLOUD_NAME / CLOUDINARY_KEY /
  CLOUDINARY_SECRET from process.env with placeholder fallbacks so the server
  can still boot when they're unset (uploads will simply fail in that case).
- Allowed upload formats are jpeg/png/jpg only, enforced in the storage engine
  config (allowedFormats), and the multer field name for files is "image".
- Uploads are wired into routes/campgrounds.js as upload.array('image') ahead
  of validateCampground in the middleware chain — order matters, since Joi
  validation runs on req.body which multer populates from the multipart form.

Now do this: [TASK]
```

---

### S6. Shared Utilities & Error Handling

**Purpose:** The small cross-cutting helpers every controller uses: a custom error class carrying an HTTP status code, and an async-route wrapper so rejected promises reach Express's error handler.

**Files:**
- `utills/ExpressError.js` — `class ExpressError extends Error { constructor(message, statusCode) }`
- `utills/catchAsync.js` — `func => (req, res, next) => func(req,res,next).catch(next)`
- The terminal error-handling middleware and 404 handler in `app.js`

**Depends on / talks to:** Used by literally every controller and by `middleware.js`.

**Conventions & gotchas:**
- **The folder is `utills`, not `utils`.** This is a real, load-bearing spelling across the whole server codebase — do not "correct" it without updating every `require('../utills/...')` call and being certain that's what's wanted.
- Every async controller/middleware that can reject should be wrapped in `catchAsync(...)` at the route level (see any `routes/*.js` file) — throwing inside an unwrapped async function will crash the request instead of producing a clean JSON error.
- The final error handler in `app.js` always responds with `{ error: message, statusCode }` as JSON — any new error path should throw an `ExpressError(message, statusCode)` (or let a Mongoose `CastError` occur, which the handler maps to a `404`) rather than calling `res.status().send()` directly, to keep error shapes consistent for the client.

```
You are working on the Shared Utilities & Error Handling module of Campify, a
full-stack campground app (Express + MongoDB API in the repo root, React/Vite
client in client/). This module is the small cross-cutting error-handling
infrastructure used by every route.

Files: utills/ExpressError.js, utills/catchAsync.js, and the terminal
app.all('*', ...) 404 handler + error-handling middleware in app.js.

Conventions to preserve:
- The directory is spelled "utills" (not "utils") and every server file
  requires it with that exact spelling — do not rename the folder.
- catchAsync(fn) is how every async route handler in routes/*.js gets wrapped
  so rejected promises reach Express's error middleware instead of crashing
  the process; any new async route should follow the same pattern.
- Errors should be raised as `new ExpressError(message, statusCode)` and either
  thrown (inside a catchAsync-wrapped handler) or passed to next(); the global
  handler in app.js turns any error into JSON `{ error, statusCode }`, with a
  special case that maps Mongoose CastError to a 404. Don't introduce a second,
  differently-shaped error response format.

Now do this: [TASK]
```

---

### S7. Seed Data & Legacy Static Assets

**Purpose:** Two unrelated pieces of "supporting" code bundled together because neither is part of the live application flow: a dev-only database seeder, and pre-React static assets still served by Express but unused by the current client.

**Files:**
- `seeds/index.js`, `seeds/cities.js`, `seeds/seedHelpers.js` — connects directly to a hard-coded local MongoDB URL and inserts 300 sample campgrounds under a hard-coded `author` ObjectId
- `public/stylesheets/*.css`, `public/javascripts/*.js` — legacy assets from an earlier server-rendered (EJS) version of the app; still served via `express.static` in `app.js` but not linked from anywhere in `client/`

**Depends on / talks to:** `seeds/index.js` depends on `models/campground.js`. The `public/` assets have no live dependents — they're superseded by `client/src/styles/*.css` and the map/rating logic in `client/src/pages` and `client/src/components`.

**Conventions & gotchas:**
- The seeder ignores `.env` (`DB_URL`) and connects straight to `mongodb://127.0.0.1:27017/yelp-camp` — running it against a different environment requires editing the file, not just setting an env var.
- The hard-coded `author` id must exist as a real user in that database or every seeded campground will have a dangling author reference.
- Treat `public/` as read-only reference material unless a task specifically asks you to revive server-rendered views or clean up dead code — it duplicates client-side styling and logic that the React app now owns.

```
You are working on the Seed Data & Legacy Static Assets module of Campify, a
full-stack campground app (Express + MongoDB API in the repo root, React/Vite
client in client/). This module covers two unrelated, non-production-critical
pieces: the sample-data seeder, and legacy static assets from a pre-React
version of the app.

Files: seeds/index.js, seeds/cities.js, seeds/seedHelpers.js,
public/stylesheets/*.css, public/javascripts/*.js.

Conventions to preserve:
- seeds/index.js connects to a hard-coded local Mongo URL
  (mongodb://127.0.0.1:27017/yelp-camp), ignoring DB_URL from .env, and uses a
  hard-coded author ObjectId that must correspond to a real user in that
  database. Treat it as a dev convenience script, not production code, unless
  told to generalize it.
- public/ contains legacy CSS and vanilla-JS (map clustering, show-page map,
  form validation) from an earlier server-rendered version of this app.
  client/src/styles/*.css and the equivalent React components/pages are the
  live versions the app actually uses today — don't assume editing public/
  affects what a user sees, and don't treat it as a source of truth for
  current behavior.

Now do this: [TASK]
```

---

## Client modules

### C1. App Shell, Routing & Layout

**Purpose:** Boots the React app, defines every client-side route, and provides the persistent chrome (navbar, footer, flash-message slot) wrapped around most pages.

**Files:**
- `src/main.jsx` — `createBrowserRouter` route table (source of truth for all routes) + provider nesting (`AuthProvider` → `FlashProvider` → `RouterProvider`)
- `src/App.jsx`, `src/App.css` — **unused** leftover Vite starter template; not imported by `main.jsx`
- `src/components/Layout.jsx` — wraps `Navbar` + `<Outlet />` + `Footer` + `FlashMessage` for every nested route
- `src/components/Navbar.jsx` — top nav, shows Login/Register vs. username + Logout depending on `AuthContext`
- `src/components/Footer.jsx` — static footer
- `src/components/ProtectedRoute.jsx` — redirects to `/login` (preserving the intended destination in router state) when `currentUser` is null
- `src/pages/ErrorPage.jsx` — React Router `errorElement` shown for route errors / unmatched paths

**Depends on / talks to:** `context/AuthContext.jsx`, `context/FlashContext.jsx`; every page renders inside this shell except `Home`, which is a standalone top-level route (not nested under `Layout`).

**Conventions & gotchas:**
- `Home` (`/`) is registered as its own top-level route, *not* a child of the `Layout` route — it has its own full-bleed hero design and doesn't get the shared navbar/footer. Don't assume every page is wrapped in `Layout`.
- New routes are added to the array literal in `main.jsx`; there's no file-based routing.
- `ProtectedRoute` wraps `children` (not a route element factory) and reads `location.state.from` conventions that `Login.jsx` relies on for post-login redirect — keep that contract if you touch either file.
- `App.jsx`/`App.css` are dead code from `create-vite`; don't spend time "fixing" them assuming they're live, and feel free to delete them if asked to clean up the repo.

```
You are working on the App Shell, Routing & Layout module of Campify's React
client (client/ inside a full-stack repo with an Express/MongoDB API at the
repo root). This module is the router configuration and persistent page chrome.

Files: client/src/main.jsx, client/src/components/Layout.jsx, Navbar.jsx,
Footer.jsx, ProtectedRoute.jsx, client/src/pages/ErrorPage.jsx.
Note: client/src/App.jsx and App.css exist but are NOT part of the app — main.jsx
defines its own router and never imports App. Don't treat them as live code.

Conventions to preserve:
- All routes are declared as a plain array literal passed to
  createBrowserRouter in main.jsx — there is no file-based routing. Add new
  routes there.
- The "/" (Home) route is a top-level route, separate from the Layout route
  that wraps /campgrounds, /login, /register, etc. Home intentionally does NOT
  get the shared Navbar/Footer — it has its own full-page hero design.
- ProtectedRoute takes a `children` prop (not react-router's element-factory
  pattern) and redirects to /login with `state={{ from: location }}`; Login.jsx
  reads `location.state?.from?.pathname` to redirect back after a successful
  sign-in. Keep both sides in sync if you change this.
- Provider order in main.jsx is AuthProvider > FlashProvider > RouterProvider —
  AuthContext blocks rendering behind a full-page LoadingSpinner until the
  initial /api/me check resolves, so anything relying on auth state can assume
  it's already resolved by the time routes render.

Now do this: [TASK]
```

---

### C2. Auth & Flash Global State (Context Layer)

**Purpose:** The app's only two pieces of global client state: who's signed in (and the login/register/logout actions), and a single transient flash/toast message.

**Files:**
- `src/context/AuthContext.jsx` — `currentUser`, `login`, `register`, `logout`; on mount, calls `GET /api/me` once and blocks rendering behind `LoadingSpinner` until that resolves
- `src/context/FlashContext.jsx` — `flash` (`{type, message}` or `null`), `showFlash(type, message)` (auto-clears after 5s), `clearFlash()`
- `src/components/FlashMessage.jsx` — renders the current flash as a dismissible Bootstrap alert

**Depends on / talks to:** `src/api/auth.js` (Axios calls), consumed via `useContext(AuthContext)` / `useContext(FlashContext)` throughout `pages/` and `components/`.

**Conventions & gotchas:**
- There's no `useAuth()`/`useFlash()` custom hook — every consumer does `useContext(AuthContext)` / `useContext(FlashContext)` directly. Follow that existing pattern rather than introducing a hook abstraction mid-codebase unless asked to refactor.
- `AuthProvider` renders a full-page `LoadingSpinner` (not its `children`) while the initial session check is in flight — anything mounted under it can assume `currentUser` already reflects the real session state on first paint.
- `showFlash` replaces any existing flash and resets its own 5-second timer; it does not queue multiple messages.
- `flash.type` values map directly to Bootstrap alert classes (`success`, `danger` are the two currently used) via `` `alert-${flash.type}` `` — pick from Bootstrap's alert contextual names if adding new types.

```
You are working on the Auth & Flash Global State module of Campify's React
client (client/ inside a full-stack repo with an Express/MongoDB API at the
repo root). This module is the two React Context providers that hold all
client-side global state.

Files: client/src/context/AuthContext.jsx, client/src/context/FlashContext.jsx,
client/src/components/FlashMessage.jsx, and client/src/api/auth.js (the Axios
functions AuthContext calls).

Conventions to preserve:
- No custom hooks exist for these contexts — consumers call
  useContext(AuthContext) / useContext(FlashContext) directly throughout
  client/src/pages and client/src/components. Match that pattern unless
  explicitly asked to refactor to hooks.
- AuthProvider calls GET /api/me once on mount and renders a full-page
  LoadingSpinner instead of `children` until that resolves — don't remove this
  gate, since pages assume currentUser is already settled by the time they render.
- login/register/logout in AuthContext call client/src/api/auth.js and then
  update currentUser directly from the response — they don't re-fetch /api/me
  afterward.
- FlashContext's showFlash(type, message) replaces any current flash and resets
  a single 5-second auto-clear timeout; it's not a queue. flash.type values
  (currently 'success' and 'danger') map straight to Bootstrap's
  `alert-${type}` classes in FlashMessage.jsx.

Now do this: [TASK]
```

---

### C3. API Client Layer

**Purpose:** The only place the client talks HTTP — a configured Axios instance plus one thin wrapper module per server resource.

**Files:**
- `src/api/axiosClient.js` — Axios instance: `baseURL` from `VITE_API_URL` or `/api`, `withCredentials: true`
- `src/api/auth.js` — `login`, `register`, `logout`, `getCurrentUser`
- `src/api/campgrounds.js` — `getAllCampgrounds`, `getCampground`, `createCampground`, `updateCampground`, `deleteCampground`
- `src/api/reviews.js` — `createReview`, `deleteReview`

**Depends on / talks to:** Every context and page that needs server data goes through this layer; mirrors the server's routes in S2/S3/S4 one-to-one.

**Conventions & gotchas:**
- Every function returns `response.data` directly (already unwrapped) — callers never touch `response` itself.
- `withCredentials: true` is set once on the shared instance; any new API module must import and reuse `axiosClient`, not create a separate `axios.create(...)`, or session cookies won't be sent.
- Campground create/update deliberately pass a `FormData` object with `Content-Type: multipart/form-data` — don't switch these to JSON without also changing the server's Multer/body-parsing expectations in `routes/campgrounds.js`.
- No response/error interceptors exist yet — error handling (`err.response?.data?.error`) happens per call-site in the pages, not centrally. Keep that in mind if you're asked to add global error handling; it'd be a deliberate architecture change, not a bug fix.
- In dev, `VITE_API_URL` is normally unset so calls go to relative `/api`, which Vite's dev server proxies to `VITE_API_PROXY_TARGET` (see `client/vite.config.js`). Setting `VITE_API_URL` is only for a separately-deployed API.

```
You are working on the API Client Layer module of Campify's React client
(client/ inside a full-stack repo with an Express/MongoDB API at the repo
root). This module is the only place the client makes HTTP calls.

Files: client/src/api/axiosClient.js, client/src/api/auth.js,
client/src/api/campgrounds.js, client/src/api/reviews.js.

Conventions to preserve:
- Every exported function returns `response.data` already unwrapped — don't
  return the raw Axios response.
- All modules import the single shared `axiosClient` instance (baseURL
  VITE_API_URL || '/api', withCredentials: true) rather than creating their own
  axios instance — session cookies depend on withCredentials being set exactly
  once, consistently.
- Campground create/update send FormData with
  Content-Type: multipart/form-data (fields nested as campground[title] etc.,
  files as repeated "image" fields, removals as deleteImages[]) to match what
  routes/campgrounds.js and Multer expect on the server. Don't convert these to
  plain JSON without a matching server-side change.
- There are no axios interceptors; each call site in client/src/pages handles
  its own errors via err.response?.data?.error. Keep new API functions
  consistent with that (throw/let the promise reject; don't swallow errors here).
- In dev, requests go to relative "/api" and are proxied by Vite
  (client/vite.config.js, VITE_API_PROXY_TARGET) to the Express server —
  VITE_API_URL is only for pointing at a separately deployed API.

Now do this: [TASK]
```

---

### C4. Campground Browsing — List & Map

**Purpose:** The `/campgrounds` page: fetches every campground, renders them as cards, and plots them on a clustered Mapbox GL map.

**Files:**
- `src/pages/CampgroundList.jsx` — data fetch, Mapbox GL clustering setup (source, cluster/count/point layers, click-to-zoom, click-to-popup), card list rendering
- `src/components/CampgroundCard.jsx` — one campground's summary card (image or placeholder, title, description, location, "View" link)

**Depends on / talks to:** `api/campgrounds.js` (`getAllCampgrounds`), `VITE_MAPBOX_TOKEN` env var (map is skipped with a warning banner if unset).

**Conventions & gotchas:**
- The Mapbox map is initialized in a `useEffect` guarded by `!mapRef.current` so it only ever runs once per mount, and it's torn down (`map.remove()`) in the effect's cleanup — if you restructure this component, preserve that init-once/cleanup-on-unmount pattern or you'll get duplicate maps or memory leaks.
- Map features are filtered to only campgrounds with a valid `geometry.type === 'Point'` and a 2-element `coordinates` array before being handed to Mapbox — don't remove that guard, since a campground can theoretically lack geometry.
- If `VITE_MAPBOX_TOKEN` is missing, the component renders a warning alert **instead of** the map container, but still renders the card list — the map is treated as optional/degradable, not a hard dependency for the page to function.
- Popup content for unclustered points is built with `document.createElement` (not JSX/`dangerouslySetInnerHTML`) specifically to avoid injecting raw HTML from campground data into the DOM — keep that pattern if you touch the popup logic.

```
You are working on the Campground Browsing (List & Map) module of Campify's
React client (client/ inside a full-stack repo with an Express/MongoDB API at
the repo root). This module is the /campgrounds page: fetching all
campgrounds, showing them as cards, and a clustered Mapbox GL map.

Files: client/src/pages/CampgroundList.jsx, client/src/components/CampgroundCard.jsx.

Conventions to preserve:
- The Mapbox GL map is created once inside a useEffect guarded by
  `!mapRef.current`, and removed via `mapRef.current.remove()` in that effect's
  cleanup function. Preserve this init-once/cleanup-on-unmount shape to avoid
  duplicate map instances or leaks if you restructure the component.
- Only campgrounds with geometry.type === 'Point' and a 2-element coordinates
  array are turned into map features — keep that filter, since geometry isn't
  guaranteed present on every campground.
- If import.meta.env.VITE_MAPBOX_TOKEN is unset, the page shows a warning alert
  in place of the map but still renders the campground card list — the map is
  a degradable enhancement, not a hard requirement to view the page.
- The unclustered-point popup builds its content with document.createElement
  calls, not raw HTML strings, specifically to avoid injecting untrusted
  campground text into innerHTML. Keep that approach for any popup content you
  add or change.
- Data comes from getAllCampgrounds() in client/src/api/campgrounds.js — don't
  fetch directly with axios/fetch here.

Now do this: [TASK]
```

---

### C5. Campground Detail, Reviews & Ratings

**Purpose:** The `/campgrounds/:id` page — full campground detail, an image carousel, a single-marker map, the review list, and (if signed in) the review submission form; also owner-only edit/delete actions.

**Files:**
- `src/pages/CampgroundShow.jsx` — fetch-by-id, Bootstrap carousel, single-marker Mapbox map, owner-only edit/delete buttons, composes `ReviewForm` + `ReviewList`
- `src/components/ReviewForm.jsx` — new-review form (rating + body), client-side validation, posts via `api/reviews.js`
- `src/components/ReviewList.jsx` — renders existing reviews, shows a Delete button only on the current user's own reviews
- `src/components/StarRating.jsx` — dual-purpose: interactive radio-button star picker (`readOnly={false}`) or a read-only label (`readOnly={true}`)

**Depends on / talks to:** `api/campgrounds.js` (`getCampground`, `deleteCampground`), `api/reviews.js`, `context/AuthContext.jsx` (ownership checks), `context/FlashContext.jsx`.

**Conventions & gotchas:**
- After a review is added or deleted, the parent (`CampgroundShow`) **re-fetches the whole campground** (`fetchCampground`, passed down as `onReviewAdded`/`onReviewDeleted`) rather than patching local state — it's simple and correct but means every review action does a full refetch. Keep this pattern unless a task specifically asks for optimistic/local updates.
- Ownership comparisons use `campground.author._id === currentUser._id` / `review.author._id === currentUser._id` — both sides must be populated (the server's `showCampground` controller populates `author` on both the campground and its reviews) for these checks to work at all.
- `StarRating` generates unique input `id`s via `useId()` specifically so multiple star-rating instances (e.g., one per review, plus the form) don't collide in the DOM — keep using `useId()` rather than a hardcoded id if you touch this component.
- The map here (single marker, non-clustered) is a separate `useEffect`/`mapRef` from the one in `CampgroundList.jsx` — they don't share code today; that's worth knowing if asked to "fix the map" so you edit the right file.

```
You are working on the Campground Detail, Reviews & Ratings module of
Campify's React client (client/ inside a full-stack repo with an Express/MongoDB
API at the repo root). This module is the /campgrounds/:id page: campground
detail, image carousel, single-marker map, and the review list/form.

Files: client/src/pages/CampgroundShow.jsx, client/src/components/ReviewForm.jsx,
client/src/components/ReviewList.jsx, client/src/components/StarRating.jsx.

Conventions to preserve:
- After creating or deleting a review, the flow re-fetches the entire
  campground via CampgroundShow's fetchCampground (passed to ReviewForm as
  onReviewAdded and to ReviewList as onReviewDeleted) rather than patching
  local state in place. Keep this full-refetch pattern unless the task
  specifically asks for optimistic UI updates.
- Ownership checks (show edit/delete on the campground, show delete on a
  review) compare `.author._id` against `currentUser._id` from AuthContext, and
  depend on the server populating `author` on both the campground and each
  review (controllers/campgrounds.js showCampground does this) — don't remove
  that populate() or these checks silently break.
- StarRating uses React's useId() to generate unique radio input ids so
  multiple instances (per-review read-only stars, plus the interactive form)
  don't collide in the DOM. Keep useId() rather than a fixed id string.
- The Mapbox map here is single-marker and initialized independently of the
  clustered map in pages/CampgroundList.jsx — they are two separate
  implementations, not shared code.
- Data/actions go through client/src/api/campgrounds.js (getCampground,
  deleteCampground) and client/src/api/reviews.js (createReview, deleteReview)
  — don't call axios directly from these components.

Now do this: [TASK]
```

---

### C6. Campground Create/Edit Forms

**Purpose:** The `/campgrounds/new` and `/campgrounds/:id/edit` pages — multi-field forms with client-side validation, image upload, and (on edit) per-image deletion checkboxes.

**Files:**
- `src/pages/CampgroundNew.jsx` — blank form → builds `FormData` → `createCampground` → navigates to the new campground's detail page
- `src/pages/CampgroundEdit.jsx` — pre-fills from `getCampground`, redirects non-owners away before rendering, supports adding new images and checking existing ones for deletion (`deleteImages[]`)
- `src/utils/validation.js` → `validateCampground` — client-side mirror of the server's `campgroundSchema` limits (title ≤100, location ≤200, description ≤2000, price ≥ 0)

**Depends on / talks to:** `api/campgrounds.js` (`createCampground`, `updateCampground`, `getCampground`), `context/FlashContext.jsx`.

**Conventions & gotchas:**
- Both forms validate on every keystroke (`onChange` calls `validateCampground` immediately) **and** again on submit — don't remove the submit-time re-validation even though it looks redundant with the live validation, since it's the last line of defense against a stale `errors` state.
- `CampgroundEdit` performs its own client-side ownership check right after fetching (`data.campground.author._id !== currentUser?._id`) and redirects to the detail page with a flash message — this is a UX nicety only; the server's `isAuthor` middleware is the real enforcement, so don't treat the client check as sufficient security if extending this flow.
- Field names sent to the server are bracket-notation (`campground[title]`, etc.) and must match exactly what `schemas.js`'s `campgroundSchema` and `controllers/campgrounds.js` expect.
- Existing image deletion on the edit page uses a checkbox per image whose `value` is the image's `filename` (not `_id`) — that's the same identifier the server uses to call `cloudinary.uploader.destroy`.

```
You are working on the Campground Create/Edit Forms module of Campify's React
client (client/ inside a full-stack repo with an Express/MongoDB API at the
repo root). This module is the /campgrounds/new and /campgrounds/:id/edit pages.

Files: client/src/pages/CampgroundNew.jsx, client/src/pages/CampgroundEdit.jsx,
client/src/utils/validation.js (validateCampground only).

Conventions to preserve:
- Forms validate live on every onChange AND again on submit before building the
  request — keep both; the submit-time check is a deliberate final guard, not
  redundant leftover code.
- validateCampground in client/src/utils/validation.js mirrors the server's
  Joi campgroundSchema limits (title ≤100 chars, location ≤200, description
  ≤2000, price ≥ 0). If you change a limit, change it in both places
  (this file and server-side schemas.js).
- Submitted FormData uses bracket-notation field names — campground[title],
  campground[location], campground[price], campground[description] — plus
  repeated "image" fields for new files and deleteImages[] entries (by image
  filename, not _id) for removals on the edit page. These must match what
  controllers/campgrounds.js expects.
- CampgroundEdit does its own client-side owner check after fetching the
  campground and redirects non-owners with a flash message — this is a UX
  convenience only. The real enforcement is server-side (isAuthor middleware),
  so don't rely on the client check alone if you're changing access rules.
- Both pages navigate to the campground's detail page
  (/campgrounds/:id) after a successful create/update.

Now do this: [TASK]
```

---

### C7. Auth Pages (Login / Register)

**Purpose:** The `/login` and `/register` forms — thin pages built on a shared `AuthForm` shell, with client-side validation and server-error-to-field mapping.

**Files:**
- `src/pages/Login.jsx` — username/password, redirects back to `location.state.from` (or `/campgrounds`) after success
- `src/pages/Register.jsx` — email/username/password, maps server `409` `code` values (`EMAIL_IN_USE`, `USERNAME_IN_USE`) onto specific field errors
- `src/components/AuthForm.jsx` — shared card/image/title/submit-button shell used by both pages (`children` is the field markup)

**Depends on / talks to:** `context/AuthContext.jsx` (`login`, `register`), `context/FlashContext.jsx`, `utils/validation.js` (`validateLogin`, `validateRegistration`).

**Conventions & gotchas:**
- `Register.jsx`'s error handling depends on the exact `code` strings the server returns (`EMAIL_IN_USE` / `USERNAME_IN_USE`, from `controllers/users.js`) — if you rename or add server error codes, update this mapping.
- `AuthForm` is intentionally generic (title, `onSubmit`, `linkTo`/`linkText`, `submitting`, and `children` for fields) — new auth-adjacent pages (e.g., a future "forgot password") should reuse it rather than duplicating the card/layout markup.
- Both pages re-run their validator on every field's `onChange` using the *next* value merged with current state (not just the changed field) so cross-field errors stay accurate as the user types.

```
You are working on the Auth Pages (Login/Register) module of Campify's React
client (client/ inside a full-stack repo with an Express/MongoDB API at the
repo root). This module is the /login and /register pages.

Files: client/src/pages/Login.jsx, client/src/pages/Register.jsx,
client/src/components/AuthForm.jsx.

Conventions to preserve:
- Register.jsx matches on the server's exact error `code` values (EMAIL_IN_USE,
  USERNAME_IN_USE — set in controllers/users.js) to attach an error to the
  right field, in addition to showing a flash message. If server error codes
  change, this mapping must be updated to match.
- Login.jsx reads `location.state?.from?.pathname` (set by ProtectedRoute) to
  redirect back to the page the user was trying to reach, falling back to
  /campgrounds.
- AuthForm is a shared, intentionally generic shell (title, onSubmit,
  linkTo/linkText, submitting, children-as-fields) used by both pages — reuse
  it for any new auth-style page rather than writing a new card layout.
- Field-level validation (validateLogin, validateRegistration in
  client/src/utils/validation.js) re-runs on every onChange using the merged
  next-state values (not just the field that changed), so cross-field checks
  (e.g., matching rules) stay correct as the user types. Both pages also
  re-validate on submit before calling the API.
- Auth actions (login/register) go through AuthContext, not api/auth.js
  directly, so currentUser stays in sync app-wide.

Now do this: [TASK]
```

---

### C8. Styling & Theming

**Purpose:** All CSS the live React app actually loads.

**Files:**
- `src/index.css` — base/global styles, imported once in `main.jsx`
- `src/styles/app.css`, `src/styles/home.css`, `src/styles/stars.css` — feature-specific styles imported by `main.jsx` (app/home) and `CampgroundShow.jsx` (stars, for the `starability-*` classes `StarRating` renders)
- Bootstrap 5 CSS + bundled JS are imported globally in `main.jsx` (`bootstrap/dist/css/bootstrap.min.css`, `bootstrap/dist/js/bootstrap.bundle.min.js`) — Bootstrap's JS bundle is what powers the navbar collapse and carousel without any React wrapper library

**Depends on / talks to:** Nothing dynamic — pure CSS consumed by the components/pages listed elsewhere in this doc.

**Conventions & gotchas:**
- **This is a separate, duplicate copy** of `public/stylesheets/app.css`/`home.css`/`stars.css` at the repo root (see S7). They started identical but only `client/src/styles/*` is actually loaded by the running app — always edit here, not in `public/`, for any visual change to take effect.
- Interactive Bootstrap components (navbar collapse toggle, carousel controls) work via Bootstrap's own vanilla-JS bundle and `data-bs-*` attributes (see `Navbar.jsx`, `CampgroundShow.jsx`'s carousel) rather than a React-Bootstrap component library — don't introduce `react-bootstrap` expecting it to compose with this markup.
- `stars.css` supplies the `starability-basic` / `starability-result` classes that `StarRating.jsx` relies on by class name — renaming those classes in one place without the other breaks the star widget's appearance silently (no runtime error).

```
You are working on the Styling & Theming module of Campify's React client
(client/ inside a full-stack repo with an Express/MongoDB API at the repo
root). This module is the CSS the running app actually loads.

Files: client/src/index.css, client/src/styles/app.css,
client/src/styles/home.css, client/src/styles/stars.css. Bootstrap 5's CSS and
JS bundle are imported globally in client/src/main.jsx.

Conventions to preserve:
- There is a separate, near-duplicate copy of these three stylesheets at
  public/stylesheets/ (repo root) from a legacy pre-React version of the app —
  that copy is NOT loaded by the React client. Always make visual changes in
  client/src/styles/, not public/stylesheets/, or they won't appear.
- Interactive Bootstrap behavior (navbar collapse, the campground image
  carousel) comes from Bootstrap's vanilla-JS bundle plus data-bs-* attributes
  in the JSX (see components/Navbar.jsx, pages/CampgroundShow.jsx) — there is
  no react-bootstrap or similar component library in use. Keep new Bootstrap
  UI consistent with that markup-driven approach.
- stars.css defines the starability-basic / starability-result class names
  that client/src/components/StarRating.jsx renders directly. If you rename or
  restructure these classes, update StarRating.jsx in the same change — a
  mismatch fails silently (no error, just broken-looking stars).

Now do this: [TASK]
```

---

## Adding a new module later

If the project grows a genuinely new module (e.g., favorites, messaging, an admin panel), give it the same five-part treatment above and append it here: **Purpose**, **Files**, **Depends on / talks to**, **Conventions & gotchas**, **Agent prompt**. Keep each prompt block self-contained enough that an agent could be handed *only* that block (plus `AGENTS.md`) and still work safely — that's the whole point of this file.
