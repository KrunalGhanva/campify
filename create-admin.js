/**
 * create-admin.js
 * Run once from the repo root:  node create-admin.js
 *
 * Deletes any existing 'admin' user and creates a fresh one with correct credentials.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

// ── Admin credentials — change freely ──────────────────────────
const ADMIN_USERNAME = 'campifyadmin';
const ADMIN_EMAIL    = 'campifyadmin@gmail.com';
const ADMIN_PASSWORD = 'Campify@123';
// ───────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🔌 Connecting to MongoDB…');
    await mongoose.connect(process.env.DB_URL);
    console.log('✅ Connected to:', process.env.DB_URL);

    // 1. Remove any stale admin accounts (old username or email)
    const removed = await User.deleteMany({
        $or: [
            { username: 'admin' },
            { username: ADMIN_USERNAME },
            { email: 'admin@campify.com' },
            { email: ADMIN_EMAIL }
        ]
    });
    if (removed.deletedCount > 0) {
        console.log(`🗑  Removed ${removed.deletedCount} stale admin account(s).`);
    }

    // 2. Create fresh admin using passport-local-mongoose (handles password hashing)
    const user = new User({
        username: ADMIN_USERNAME,
        email:    ADMIN_EMAIL,
        role:     'admin'
    });

    await User.register(user, ADMIN_PASSWORD);
    console.log(`✅ Admin account created successfully!\n`);

    console.log('═══════════════════════════════════════════');
    console.log('  🔑  ADMIN LOGIN CREDENTIALS');
    console.log('───────────────────────────────────────────');
    console.log(`  URL      : http://localhost:5173/login`);
    console.log(`  Username : ${ADMIN_USERNAME}`);
    console.log(`  Email    : ${ADMIN_EMAIL}`);
    console.log(`  Password : ${ADMIN_PASSWORD}`);
    console.log('───────────────────────────────────────────');
    console.log('  Dashboard: http://localhost:5173/admin/dashboard');
    console.log('═══════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected. Script complete.');
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
