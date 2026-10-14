/**
 * seeds/verify-crud.js
 * ──────────────────────────────────────────────────────────────────
 * Automated CRUD verification for Campify.
 *
 * Tests CREATE, READ, UPDATE, DELETE on User, Campground, and Review
 * directly via Mongoose (no HTTP stack needed — isolates DB layer).
 *
 * Usage:
 *   cd campify
 *   node seeds/verify-crud.js
 * ──────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const User       = require('../models/user');
const Campground = require('../models/campground');
const Review     = require('../models/review');

const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/campify';

// ── Helpers ───────────────────────────────────────────────────────
const results = [];

function pass(label) {
    results.push({ label, status: 'PASS' });
    console.log(`  ✅  PASS  ${label}`);
}

function fail(label, err) {
    results.push({ label, status: 'FAIL', error: err?.message || String(err) });
    console.error(`  ❌  FAIL  ${label}  →  ${err?.message || err}`);
}

// ── Test IDs (kept in module scope for cleanup) ───────────────────
let testUserId, testCampId, testReviewId;

// ── User CRUD ─────────────────────────────────────────────────────
async function testUserCRUD() {
    console.log('\n▶  USER CRUD');

    // CREATE
    try {
        const u = new User({ username: 'crud_test_user', email: 'crudtest@campify.com', role: 'user' });
        const registered = await User.register(u, 'TestPass@123');
        testUserId = registered._id;
        pass('User CREATE  (POST /api/register equivalent)');
    } catch (e) { fail('User CREATE', e); }

    // READ
    try {
        const found = await User.findById(testUserId).select('username email role');
        if (!found || found.username !== 'crud_test_user') throw new Error('User not found or field mismatch');
        pass('User READ    (GET /api/me equivalent)');
    } catch (e) { fail('User READ', e); }

    // UPDATE (profile)
    try {
        const updated = await User.findByIdAndUpdate(
            testUserId,
            { email: 'crudtest_updated@campify.com' },
            { new: true }
        );
        if (!updated || updated.email !== 'crudtest_updated@campify.com') throw new Error('Email update failed');
        pass('User UPDATE  (PUT /api/me/profile equivalent)');
    } catch (e) { fail('User UPDATE', e); }

    // DELETE (soft-check — will fully delete during cleanup)
    try {
        const exists = await User.findById(testUserId);
        if (!exists) throw new Error('User disappeared before delete test');
        pass('User DELETE  (pre-check OK — deleted in cleanup)');
    } catch (e) { fail('User DELETE pre-check', e); }
}

// ── Campground CRUD ───────────────────────────────────────────────
async function testCampgroundCRUD() {
    console.log('\n▶  CAMPGROUND CRUD');

    // CREATE
    try {
        const camp = new Campground({
            title:       'CRUD Test Campground',
            location:    'Test City, Test State',
            price:       29,
            description: 'Automated CRUD verification campground. Safe to delete.',
            geometry:    { type: 'Point', coordinates: [-104.9903, 39.7392] },
            images: [
                { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg', filename: 'YelpCamp/tent3_bpcgws' }
            ],
            author: testUserId,
        });
        await camp.save();
        testCampId = camp._id;
        pass('Campground CREATE  (POST /api/campgrounds equivalent)');
    } catch (e) { fail('Campground CREATE', e); }

    // READ
    try {
        const found = await Campground.findById(testCampId).populate('author');
        if (!found || found.title !== 'CRUD Test Campground') throw new Error('Campground not found or title mismatch');
        if (!found.geometry || !Array.isArray(found.geometry.coordinates)) throw new Error('geometry missing');
        if (!found.author || !found.author.username) throw new Error('author not populated');
        pass('Campground READ    (GET /api/campgrounds/:id equivalent)');
    } catch (e) { fail('Campground READ', e); }

    // READ all (index)
    try {
        const all = await Campground.find({});
        if (!Array.isArray(all) || all.length === 0) throw new Error('Index returned empty result');
        pass(`Campground READ all (GET /api/campgrounds) — found ${all.length} docs`);
    } catch (e) { fail('Campground READ all', e); }

    // UPDATE
    try {
        const camp = await Campground.findById(testCampId);
        camp.title = 'CRUD Test Campground (Updated)';
        camp.price = 39;
        await camp.save();
        const reloaded = await Campground.findById(testCampId);
        if (reloaded.title !== 'CRUD Test Campground (Updated)') throw new Error('Title not updated');
        if (reloaded.price !== 39) throw new Error('Price not updated');
        pass('Campground UPDATE  (PUT /api/campgrounds/:id equivalent)');
    } catch (e) { fail('Campground UPDATE', e); }
}

// ── Review CRUD ───────────────────────────────────────────────────
async function testReviewCRUD() {
    console.log('\n▶  REVIEW CRUD');

    // CREATE
    try {
        const review = new Review({
            body:   'Automated CRUD verification review. Excellent test campground!',
            rating: 4,
            author: testUserId,
            images: [],
        });
        await review.save();
        testReviewId = review._id;

        // Link to campground
        await Campground.findByIdAndUpdate(testCampId, { $push: { reviews: review._id } });
        pass('Review CREATE  (POST /api/campgrounds/:id/reviews equivalent)');
    } catch (e) { fail('Review CREATE', e); }

    // READ (via campground populate)
    try {
        const camp = await Campground.findById(testCampId).populate({ path: 'reviews', populate: { path: 'author', select: 'username' } });
        const found = camp.reviews.find(r => r._id.equals(testReviewId));
        if (!found) throw new Error('Review not found in campground.reviews');
        if (found.rating !== 4) throw new Error(`Rating mismatch: expected 4, got ${found.rating}`);
        if (!found.author?.username) throw new Error('Author not populated on review');
        pass('Review READ    (GET /api/campgrounds/:id populates reviews)');
    } catch (e) { fail('Review READ', e); }

    // UPDATE
    try {
        const review = await Review.findById(testReviewId);
        review.body   = 'Updated CRUD test review body — all systems go!';
        review.rating = 5;
        await review.save();
        const reloaded = await Review.findById(testReviewId);
        if (reloaded.rating !== 5) throw new Error('Rating not updated');
        pass('Review UPDATE  (PUT /api/campgrounds/:id/reviews/:reviewId equivalent)');
    } catch (e) { fail('Review UPDATE', e); }

    // DELETE
    try {
        await Campground.findByIdAndUpdate(testCampId, { $pull: { reviews: testReviewId } });
        await Review.findByIdAndDelete(testReviewId);
        const gone = await Review.findById(testReviewId);
        if (gone) throw new Error('Review still exists after delete');
        const camp = await Campground.findById(testCampId);
        if (camp.reviews.some(r => r.equals(testReviewId))) throw new Error('Review ref not pulled from campground');
        pass('Review DELETE  (DELETE /api/campgrounds/:id/reviews/:reviewId equivalent)');
    } catch (e) { fail('Review DELETE', e); }
}

// ── Campground DELETE (incl cascade) ─────────────────────────────
async function testCampgroundDelete() {
    console.log('\n▶  CAMPGROUND DELETE (cascade)');
    try {
        // Add a new review so cascade can be verified
        const rv = new Review({ body: 'Pre-cascade review', rating: 3, author: testUserId, images: [] });
        await rv.save();
        await Campground.findByIdAndUpdate(testCampId, { $push: { reviews: rv._id } });

        // Delete via findOneAndDelete (triggers Mongoose post middleware → cascade)
        const deleted = await Campground.findByIdAndDelete(testCampId);
        if (!deleted) throw new Error('Campground not found for delete');

        const gone    = await Campground.findById(testCampId);
        const rvGone  = await Review.findById(rv._id);
        if (gone) throw new Error('Campground still exists after delete');
        if (rvGone) throw new Error('Cascade: review not deleted with campground');

        pass('Campground DELETE + cascade review wipe (DELETE /api/campgrounds/:id)');
    } catch (e) { fail('Campground DELETE cascade', e); }
}

// ── User DELETE cleanup ───────────────────────────────────────────
async function cleanupUser() {
    try {
        await User.findByIdAndDelete(testUserId);
        const gone = await User.findById(testUserId);
        if (gone) throw new Error('User still exists after delete');
        pass('User DELETE   (DELETE /api/admin/users/:id equivalent — cleanup)');
    } catch (e) { fail('User DELETE cleanup', e); }
}

// ── Summary table ─────────────────────────────────────────────────
function printSummary() {
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  CRUD VERIFICATION SUMMARY');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`  ${'Operation'.padEnd(55)} ${'Status'}`);
    console.log('  ' + '─'.repeat(65));
    for (const r of results) {
        const icon = r.status === 'PASS' ? '✅' : '❌';
        console.log(`  ${icon} ${r.label.padEnd(53)} ${r.status}`);
        if (r.error) console.log(`       Error: ${r.error}`);
    }
    console.log('  ' + '─'.repeat(65));
    console.log(`  Total: ${results.length}  |  PASS: ${passed}  |  FAIL: ${failed}`);
    console.log('══════════════════════════════════════════════════════════════\n');

    return failed;
}

// ── Count seeded data ─────────────────────────────────────────────
async function printSeededCounts() {
    const [users, campgrounds, reviews] = await Promise.all([
        User.countDocuments(),
        Campground.countDocuments(),
        Review.countDocuments(),
    ]);
    console.log('\n📊  SEEDED COLLECTION COUNTS');
    console.log('──────────────────────────────────────────────────');
    console.log(`  Users       : ${users}`);
    console.log(`  Campgrounds : ${campgrounds}`);
    console.log(`  Reviews     : ${reviews}`);
    console.log('──────────────────────────────────────────────────');
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
    console.log('\n🔍  Campify CRUD Verification\n');
    await printSeededCounts();
    await testUserCRUD();
    await testCampgroundCRUD();
    await testReviewCRUD();
    await testCampgroundDelete();
    await cleanupUser();
    const failed = printSummary();
    process.exit(failed > 0 ? 1 : 0);
}

mongoose
    .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log(`🔌  Connected → ${DB_URL}`);
        return main();
    })
    .catch(err => {
        console.error('❌  Connection error:', err.message);
        process.exit(1);
    })
    .finally(() => mongoose.connection.close());
