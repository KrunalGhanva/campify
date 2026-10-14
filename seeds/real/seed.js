/**
 * Seeds real campgrounds, sample campers and their reviews.
 *
 *   node seeds/real/seed.js --dry-run   # check the data, write nothing
 *   node seeds/real/seed.js             # upload photos and write to the database
 *   node seeds/real/seed.js --reupload  # also replace photos already on Cloudinary
 *
 * Writes to DB_URL from .env. To use another database for one run:
 *   DB_URL=mongodb://127.0.0.1:27017/campify node seeds/real/seed.js
 *
 * Safe to run more than once. It only removes data it created before: users whose
 * email ends in @campers.example, their campgrounds, their reviews, and any reviews
 * on those campgrounds. Everyone else's accounts and campgrounds are left alone.
 *
 * Photos come from images.json (see fetch-images.js) and are copied to Cloudinary
 * under Campify/seed/, so thumbnails and deletes work like any uploaded photo.
 */

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const { cloudinary } = require('../../cloudinary');
const User = require('../../models/user');
const Campground = require('../../models/campground');
const Review = require('../../models/review');

const places = require('./places');
const activity = require('./reviews');
const imageManifest = require('./images.json');
const { SEED_EMAIL_DOMAIN, users } = require('./people');

const DRY_RUN = process.argv.includes('--dry-run');
const REUPLOAD = process.argv.includes('--reupload');
const PASSWORD = process.env.SEED_PASSWORD || 'Campify@2026';
const CLOUD_FOLDER = 'Campify/seed';
const UA = 'CampifySeeder/1.0 (https://github.com/KrunalGhanva; seed script)';
const DAY = 24 * 60 * 60 * 1000;

const slug = (text) => text.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const seedEmail = new RegExp(`@${SEED_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i');

/* ── Checks ─────────────────────────────────────────────────── */
function validate() {
    const problems = [];
    const known = new Set(users.map(u => u.username));
    const titles = new Set(places.map(p => p.title));

    for (const place of places) {
        if (!activity[place.title]) problems.push(`No reviews.js entry for "${place.title}"`);
        if (!imageManifest[place.title]?.length) problems.push(`No photos in images.json for "${place.title}" — run fetch-images.js`);
        const [lng, lat] = place.coordinates;
        if (Math.abs(lng) > 180 || Math.abs(lat) > 90) problems.push(`Bad coordinates for "${place.title}"`);
    }
    for (const [title, entry] of Object.entries(activity)) {
        if (!titles.has(title)) problems.push(`reviews.js has "${title}", which is not in places.js`);
        if (!known.has(entry.addedBy)) problems.push(`Unknown user "${entry.addedBy}" added "${title}"`);
        const reviewers = new Set();
        for (const r of entry.reviews) {
            if (!known.has(r.by)) problems.push(`Unknown reviewer "${r.by}" on "${title}"`);
            if (r.by === entry.addedBy) problems.push(`"${r.by}" reviews their own campground "${title}"`);
            if (reviewers.has(r.by)) problems.push(`"${r.by}" reviews "${title}" twice`);
            if (!(r.rating >= 1 && r.rating <= 5)) problems.push(`Rating out of range on "${title}"`);
            reviewers.add(r.by);
        }
    }
    return problems;
}

/* ── Cloudinary ─────────────────────────────────────────────── */
async function existingUpload(publicId) {
    try {
        return await cloudinary.api.resource(publicId);
    } catch (err) {
        const code = err.http_code || err.error?.http_code;
        if (code === 404) return null;
        throw new Error(err.message || err.error?.message || 'Cloudinary lookup failed');
    }
}

// Downloads and uploads occasionally drop on slow connections, so try a few times.
async function withRetry(task, attempts = 3) {
    for (let i = 1; ; i++) {
        try {
            return await task();
        } catch (err) {
            if (i >= attempts) throw err;
            console.log(`    retrying after error: ${err.message || err.error?.message}`);
            await new Promise(r => setTimeout(r, 2000 * i));
        }
    }
}

async function uploadPhoto(image, publicId) {
    return withRetry(() => uploadPhotoOnce(image, publicId));
}

async function uploadPhotoOnce(image, publicId) {
    if (!REUPLOAD) {
        const found = await existingUpload(publicId);
        if (found) return { url: found.secure_url, filename: found.public_id, reused: true };
    }
    const res = await fetch(image.source, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`Download failed (${res.status}) for ${image.file}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const uploaded = await new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ public_id: publicId, overwrite: true, resource_type: 'image' }, (err, out) => (err ? reject(err) : resolve(out)))
            .end(buffer);
    });
    return { url: uploaded.secure_url, filename: uploaded.public_id, reused: false };
}

// Remove photos in the seed folder that the current images.json no longer uses.
async function removeUnusedPhotos(used) {
    const unused = [];
    let cursor;
    do {
        const page = await cloudinary.api.resources({ type: 'upload', prefix: `${CLOUD_FOLDER}/`, max_results: 500, next_cursor: cursor });
        unused.push(...page.resources.map(r => r.public_id).filter(id => !used.has(id)));
        cursor = page.next_cursor;
    } while (cursor);
    for (let i = 0; i < unused.length; i += 100) await cloudinary.api.delete_resources(unused.slice(i, i + 100));
    return unused.length;
}

/* ── Database ───────────────────────────────────────────────── */
async function removePreviousSeed() {
    const oldUsers = await User.find({ email: seedEmail }, '_id');
    const userIds = oldUsers.map(u => u._id);
    const oldCamps = await Campground.find({ author: { $in: userIds } }, 'reviews');
    const campReviewIds = oldCamps.flatMap(c => c.reviews);
    const authoredReviews = await Review.find({ author: { $in: userIds } }, '_id');
    const reviewIds = [...campReviewIds, ...authoredReviews.map(r => r._id)];

    await Campground.updateMany({ reviews: { $in: reviewIds } }, { $pull: { reviews: { $in: reviewIds } } });
    const reviews = await Review.deleteMany({ _id: { $in: reviewIds } });
    const camps = await Campground.deleteMany({ _id: { $in: oldCamps.map(c => c._id) } });
    const removed = await User.deleteMany({ _id: { $in: userIds } });
    return { users: removed.deletedCount, campgrounds: camps.deletedCount, reviews: reviews.deletedCount };
}

async function createUsers() {
    // Each camper "joined" a few weeks before their earliest activity.
    const earliest = {};
    for (const entry of Object.values(activity)) {
        for (const r of entry.reviews) earliest[r.by] = Math.max(earliest[r.by] || 0, r.daysAgo);
        earliest[entry.addedBy] = Math.max(earliest[entry.addedBy] || 0, 60);
    }

    const byName = {};
    for (const [i, u] of users.entries()) {
        const user = await User.register(new User({ username: u.username, email: u.email, role: 'user' }), PASSWORD);
        const joined = daysAgo((earliest[u.username] || 30) + 20 + i * 3);
        // createdAt is immutable in Mongoose, so set it with the raw driver.
        await User.collection.updateOne({ _id: user._id }, { $set: { createdAt: joined, updatedAt: joined } });
        byName[u.username] = user;
    }
    return byName;
}

/* ── Main ───────────────────────────────────────────────────── */
async function main() {
    const problems = validate();
    if (problems.length) {
        console.error('Fix these before seeding:\n' + problems.map(p => `  - ${p}`).join('\n'));
        process.exit(1);
    }

    const reviewCount = Object.values(activity).reduce((n, e) => n + e.reviews.length, 0);
    const photoCount = places.reduce((n, p) => n + imageManifest[p.title].length, 0);
    console.log(`Data OK: ${users.length} users, ${places.length} campgrounds, ${reviewCount} reviews, ${photoCount} photos.`);
    if (DRY_RUN) {
        console.log('Dry run — nothing written.');
        return;
    }
    if (!process.env.DB_URL) throw new Error('DB_URL is not set in .env');
    if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary keys are not set in .env');

    await mongoose.connect(process.env.DB_URL);
    const { host, name } = mongoose.connection;
    console.log(`Connected to ${host}/${name}\n`);

    const removed = await removePreviousSeed();
    console.log(`Removed previous seed data: ${removed.users} users, ${removed.campgrounds} campgrounds, ${removed.reviews} reviews.`);

    const people = await createUsers();
    console.log(`Created ${Object.keys(people).length} users.\n`);

    const usedPhotos = new Set();
    for (const [i, place] of places.entries()) {
        const entry = activity[place.title];

        const images = [];
        for (const image of imageManifest[place.title]) {
            // Name uploads after the source file, so swapping a photo in images.json uploads the new one.
            const fileId = crypto.createHash('sha1').update(image.file).digest('hex').slice(0, 8);
            const photo = await uploadPhoto(image, `${CLOUD_FOLDER}/${slug(place.title)}-${fileId}`);
            images.push({ url: photo.url, filename: photo.filename });
            usedPhotos.add(photo.filename);
        }

        // Oldest first, the same order the app stores reviews in as they are posted.
        const reviewIds = [];
        for (const r of [...entry.reviews].sort((a, b) => b.daysAgo - a.daysAgo)) {
            const date = daysAgo(r.daysAgo);
            const review = new Review({ body: r.body, rating: r.rating, author: people[r.by]._id, images: [], createdAt: date, updatedAt: date });
            await review.save({ timestamps: false });
            reviewIds.push(review._id);
        }

        await new Campground({
            title: place.title,
            location: place.location,
            price: place.price,
            description: place.description,
            geometry: { type: 'Point', coordinates: place.coordinates },
            images,
            author: people[entry.addedBy]._id,
            reviews: reviewIds,
        }).save();

        console.log(`  [${String(i + 1).padStart(2)}/${places.length}] ${place.title} — ${images.length} photos, ${reviewIds.length} reviews`);
    }

    const cleaned = await removeUnusedPhotos(usedPhotos);
    if (cleaned) console.log(`\nDeleted ${cleaned} unused photos from Cloudinary.`);

    console.log(`\nDone. Sample users sign in with password "${PASSWORD}", e.g. username "${users[0].username}".`);
}

main()
    .catch(err => {
        console.error('\nSeed failed:', err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
