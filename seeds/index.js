/**
 * seeds/index.js
 * ──────────────────────────────────────────────────────────────────
 * Comprehensive Campify database seeder.
 *
 * Populates:
 *   • 8 Users  (including 1 admin)
 *   • 8 Campgrounds  (distinct US locations, real Cloudinary images,
 *                     valid GeoJSON coordinates, all schema fields)
 *   • 2–3 Reviews per campground = 20 total
 *
 * Usage:
 *   cd campify
 *   node seeds/index.js
 * ──────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const User       = require('../models/user');
const Campground = require('../models/campground');
const Review     = require('../models/review');

// ── DB Connection ─────────────────────────────────────────────────
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/campify';

// ── Curated Cloudinary image sets (publicly readable) ─────────────
const CAMP_IMAGE_SETS = [
    [
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',  filename: 'YelpCamp/river3_q0r5vb' },
    ],
    [
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',  filename: 'YelpCamp/river3_q0r5vb' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
        { url: 'https://res.cloudinary.com/dabukov15/image/upload/v1729859541/YelpCamp/gm5lhimgkh4wqxp5dxef.jpg', filename: 'YelpCamp/gm5lhimgkh4wqxp5dxef' },
    ],
    [
        { url: 'https://res.cloudinary.com/dabukov15/image/upload/v1729859541/YelpCamp/gm5lhimgkh4wqxp5dxef.jpg', filename: 'YelpCamp/gm5lhimgkh4wqxp5dxef' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
    ],
    [
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',  filename: 'YelpCamp/river3_q0r5vb' },
        { url: 'https://res.cloudinary.com/dabukov15/image/upload/v1729859541/YelpCamp/gm5lhimgkh4wqxp5dxef.jpg', filename: 'YelpCamp/gm5lhimgkh4wqxp5dxef' },
    ],
    [
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
        { url: 'https://res.cloudinary.com/dabukov15/image/upload/v1729859541/YelpCamp/gm5lhimgkh4wqxp5dxef.jpg', filename: 'YelpCamp/gm5lhimgkh4wqxp5dxef' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',  filename: 'YelpCamp/river3_q0r5vb' },
    ],
    [
        { url: 'https://res.cloudinary.com/dabukov15/image/upload/v1729859541/YelpCamp/gm5lhimgkh4wqxp5dxef.jpg', filename: 'YelpCamp/gm5lhimgkh4wqxp5dxef' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
    ],
    [
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',  filename: 'YelpCamp/river3_q0r5vb' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
        { url: 'https://res.cloudinary.com/dabukov15/image/upload/v1729859541/YelpCamp/gm5lhimgkh4wqxp5dxef.jpg', filename: 'YelpCamp/gm5lhimgkh4wqxp5dxef' },
    ],
    [
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',   filename: 'YelpCamp/tent3_bpcgws' },
        { url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',  filename: 'YelpCamp/river3_q0r5vb' },
    ],
];

// ── Campground seed data ──────────────────────────────────────────
const CAMPGROUNDS_DATA = [
    {
        title: 'Blue Ridge Summit Retreat',
        location: 'Asheville, North Carolina',
        price: 35,
        description: 'Perched at 4,200 ft in the Great Smoky foothills, Blue Ridge Summit Retreat offers breathtaking panoramic views and crisp mountain air year-round. Each site has a stone fire ring, bear box, and access to 12 miles of groomed hiking trails. Stargazing here is legendary — the Milky Way arches overhead on clear nights.',
        geometry: { type: 'Point', coordinates: [-82.5515, 35.5951] },
        images: CAMP_IMAGE_SETS[0],
    },
    {
        title: 'Cascade Creek Wilderness Camp',
        location: 'Bend, Oregon',
        price: 42,
        description: 'Nestled inside the Deschutes National Forest, Cascade Creek runs ice-cold past every campsite. The camp sits at 3,600 ft and is ideal for fly-fishing, paddleboarding on nearby Elk Lake, and multi-day trail runs. Expect towering ponderosa pines and an occasional visit from resident mule deer at dusk.',
        geometry: { type: 'Point', coordinates: [-121.3153, 44.0582] },
        images: CAMP_IMAGE_SETS[1],
    },
    {
        title: 'Desert Painted Sky Camp',
        location: 'Moab, Utah',
        price: 28,
        description: 'Wake up surrounded by towering sandstone fins and ochre mesas at Desert Painted Sky Camp. Just 6 miles from Arches National Park, this dry-country retreat is perfect for mountain bikers, climbers, and stargazers. A communal ramada with shade tarps keeps the midday heat manageable, and the crimson sunsets are unforgettable.',
        geometry: { type: 'Point', coordinates: [-109.5498, 38.5733] },
        images: CAMP_IMAGE_SETS[2],
    },
    {
        title: 'Pacific Pines Coastal Camp',
        location: 'Big Sur, California',
        price: 55,
        description: 'Perched on sea-bluffs above the Pacific, Pacific Pines Coastal Camp blends old-growth redwood forest with dramatic ocean vistas. Fall asleep to crashing waves and wake to morning fog rolling through the trees. This pet-friendly site includes outdoor showers, an amphitheater for evening programs, and a shuttle to Pfeiffer Beach.',
        geometry: { type: 'Point', coordinates: [-121.8120, 36.2704] },
        images: CAMP_IMAGE_SETS[3],
    },
    {
        title: 'Maple Hollow Family Camp',
        location: 'Lake Placid, New York',
        price: 22,
        description: 'A true four-season campground in the heart of the Adirondacks, Maple Hollow is beloved by families. Flat, shaded sites ring a quiet spring-fed pond perfect for swimming and canoeing. The camp store rents kayaks and tubes, and the on-site counselors run junior ranger programs every afternoon at 3 PM.',
        geometry: { type: 'Point', coordinates: [-73.9799, 44.2795] },
        images: CAMP_IMAGE_SETS[4],
    },
    {
        title: 'Grizzly Peak Alpine Base Camp',
        location: 'Jackson Hole, Wyoming',
        price: 48,
        description: 'At the base of the Teton Range, Grizzly Peak Alpine Base Camp is a staging ground for serious adventurers. The camp sits at 6,800 ft, an hour from Grand Teton National Park\'s best trailheads. Electric hook-ups, a gear-drying room, and a communal kitchen make it comfortable after long days on technical terrain.',
        geometry: { type: 'Point', coordinates: [-110.7624, 43.4799] },
        images: CAMP_IMAGE_SETS[5],
    },
    {
        title: 'Misty Pines Lakeside Retreat',
        location: 'Boundary Waters, Minnesota',
        price: 18,
        description: 'Accessible only by canoe or kayak, Misty Pines Lakeside Retreat is a genuine wilderness escape along the BWCA canoe corridor. No roads, no generators — just loons calling across glassy water and a sky full of northern lights in autumn. Primitive sites have composting toilets and a food hang system; leave-no-trace strictly enforced.',
        geometry: { type: 'Point', coordinates: [-92.1152, 47.9654] },
        images: CAMP_IMAGE_SETS[6],
    },
    {
        title: 'Redwood Giants Grove Camp',
        location: 'Crescent City, California',
        price: 30,
        description: 'Stand beneath 300-ft coastal redwoods at Redwood Giants Grove Camp inside Jedediah Smith Redwoods State Park. The Smith River runs crystal-clear through the property — rainbow trout abound. In spring, wild azaleas carpet the undergrowth in pink. Campers get free entry to ranger-led "Cathedral of Trees" walks on Saturdays.',
        geometry: { type: 'Point', coordinates: [-124.1997, 41.7882] },
        images: CAMP_IMAGE_SETS[7],
    },
];

// ── Reviews per campground ────────────────────────────────────────
const REVIEWS_DATA = [
    // 0 – Blue Ridge Summit Retreat
    [
        { rating: 5, body: 'Absolutely spectacular views from every site. The hiking trails start right at camp and the stargazing was unlike anything I\'ve experienced. We saw the Milky Way clearly both nights. Will 100% be back!' },
        { rating: 4, body: 'Beautiful location and well-maintained facilities. The stone fire rings are great and the bear boxes are conveniently sized. Knocked one star because the road in gets rough in the last mile — bring a high-clearance vehicle.' },
        { rating: 5, body: 'We celebrated our anniversary here and it could not have been more perfect. The campground host was incredibly welcoming and gave us a private site overlooking the valley. Highly recommend the ridge trail at sunset.' },
    ],
    // 1 – Cascade Creek Wilderness Camp
    [
        { rating: 5, body: 'Fly-fishing heaven! Pulled a 14-inch rainbow right outside my tent on day one. The creek is ice cold and crystal clear. Sites are well-spaced so you genuinely feel alone in the wilderness. Phenomenal value.' },
        { rating: 4, body: 'Gorgeous ponderosa forest setting. Elk Lake is a short 2-mile ride by bike and worth every pedal stroke. The only downside was some noise from a neighboring group on night two, but the camp staff addressed it quickly.' },
    ],
    // 2 – Desert Painted Sky Camp
    [
        { rating: 5, body: 'This is the most dramatic landscape I have ever slept in. The morning light on the fins is otherworldly. Arches National Park is a quick drive — great value location.' },
        { rating: 3, body: 'The location is stunning but summer heat is no joke — temps hit 104 degrees by noon. Bring extra shade, plenty of water, and plan activities for early morning and evening only. Would return in shoulder season.' },
        { rating: 5, body: 'Stars! Oh my goodness the stars. Zero light pollution and the Milky Way was so bright it cast shadows. Set your alarm for 2 AM and sit outside — you will thank me. Great mountain biking right from camp too.' },
    ],
    // 3 – Pacific Pines Coastal Camp
    [
        { rating: 5, body: 'The sound of waves crashing below the bluffs lulled me to sleep every night. The redwoods dripping with morning fog are breathtaking. Pfeiffer Beach shuttle was reliable and the outdoor showers were surprisingly warm.' },
        { rating: 4, body: 'Incredible spot. Saw sea otters from the bluff on day two! Sites are a little tight but the trees provide great privacy. The amphitheater program on Friday night was excellent.' },
        { rating: 5, body: 'Best campground on the California coast, full stop. The host goes above and beyond — they left a bundle of firewood and a smores kit at our site when we arrived. We extended our stay by two nights.' },
    ],
    // 4 – Maple Hollow Family Camp
    [
        { rating: 4, body: 'Our kids aged 6 and 9 absolutely loved the pond. They took a junior ranger class and came home knowing how to identify 8 types of trees. The kayak rentals are reasonably priced. A perfect family memory.' },
        { rating: 5, body: 'The spring-fed pond water is crystal clear and stays cool even in August. No motorized boats means true quiet. We watched loons with our 10-year-old every morning at dawn. A magical Adirondacks experience.' },
    ],
    // 5 – Grizzly Peak Alpine Base Camp
    [
        { rating: 5, body: 'Woke up to a moose wandering through camp on morning two! The gear-drying room after our river crossing was a lifesaver. Electric hook-ups for charging GPS and camera batteries is a huge practical plus at this elevation.' },
        { rating: 4, body: 'Fantastic base for Teton day hikes. We bagged Cascade Canyon and Death Canyon in back-to-back days and crashed hard each night. The communal kitchen makes post-hike cooking a social delight. Highly recommend.' },
        { rating: 5, body: 'The Tetons loom over you constantly — it is humbling and inspiring at the same time. Check-in was smooth, site was level, and the host gave us a laminated map with the best summit routes. 10 out of 10.' },
    ],
    // 6 – Misty Pines Lakeside Retreat
    [
        { rating: 5, body: 'Paddled 4 hours in and it was 100% worth every stroke. Complete silence except for loons. We caught walleye for dinner on night one and saw the aurora borealis on night two. A true wilderness immersion.' },
        { rating: 4, body: 'Exactly what primitive camping should feel like. Pack light, practice your bear hang, and bring a water filter. We survived five nights with zero issues. The composting toilets are well-maintained for a remote site.' },
    ],
    // 7 – Redwood Giants Grove Camp
    [
        { rating: 5, body: 'Walking among 300-foot trees is a religious experience. The Smith River swimming holes are the clearest water I have ever seen. The Saturday cathedral walk with the ranger was one of the best interpretive programs I have attended.' },
        { rating: 5, body: 'The azaleas in May are jaw-dropping. We combined the trip with a day at the beach and fresh Dungeness crab at a Crescent City dock restaurant. Everything about this area is spectacular.' },
        { rating: 4, body: 'Beautiful park and well-run campground. The sites under the redwoods stay cool even in summer, which is a huge bonus. Only suggestion: add more recycling bins near the fire circles.' },
    ],
];

// ── Seed users ────────────────────────────────────────────────────
const USERS_DATA = [
    { username: 'campifyadmin', email: 'campifyadmin@campify.com', password: 'Campify@123',   role: 'admin' },
    { username: 'alex_trails',  email: 'alex@trails.com',          password: 'Trails@2024',   role: 'user'  },
    { username: 'sam_outdoors', email: 'sam@outdoors.com',         password: 'Outdoors@2024', role: 'user'  },
    { username: 'jordan_peaks', email: 'jordan@peaks.com',         password: 'Peaks@2024',    role: 'user'  },
    { username: 'riley_rivers', email: 'riley@rivers.com',         password: 'Rivers@2024',   role: 'user'  },
    { username: 'casey_summit', email: 'casey@summit.com',         password: 'Summit@2024',   role: 'user'  },
    { username: 'morgan_woods', email: 'morgan@woods.com',         password: 'Woods@2024',    role: 'user'  },
    { username: 'taylor_camp',  email: 'taylor@campify.com',       password: 'Camp@2024!',    role: 'user'  },
];

// ── Main seed function ────────────────────────────────────────────
async function seedDb() {
    console.log('\n🌱  Starting Campify database seed…\n');

    console.log('🗑   Clearing existing data…');
    await Review.deleteMany({});
    await Campground.deleteMany({});
    await User.deleteMany({});
    console.log('    Done.\n');

    console.log('👤  Creating users…');
    const createdUsers = [];
    for (const ud of USERS_DATA) {
        const u          = new User({ username: ud.username, email: ud.email, role: ud.role });
        const registered = await User.register(u, ud.password);
        createdUsers.push(registered);
        console.log(`    ✅  ${ud.role === 'admin' ? '(admin) ' : ''}${ud.username}`);
    }
    console.log(`\n    ${createdUsers.length} users created.\n`);

    const regularUsers = createdUsers.slice(1);

    console.log('🏕   Creating campgrounds & reviews…');
    let totalReviews = 0;
    const createdCampgrounds = [];

    for (let ci = 0; ci < CAMPGROUNDS_DATA.length; ci++) {
        const cd          = CAMPGROUNDS_DATA[ci];
        const authorIndex = ci % regularUsers.length;
        const author      = regularUsers[authorIndex];

        const reviewDefs   = REVIEWS_DATA[ci];
        const savedReviews = [];

        for (let ri = 0; ri < reviewDefs.length; ri++) {
            const rd           = reviewDefs[ri];
            const reviewerPool = regularUsers.filter((_, i) => i !== authorIndex);
            const reviewer     = reviewerPool[ri % reviewerPool.length];

            const review = new Review({
                body:   rd.body,
                rating: rd.rating,
                author: reviewer._id,
                images: [],
            });
            await review.save();
            savedReviews.push(review);
            totalReviews++;
        }

        const camp = new Campground({
            title:       cd.title,
            location:    cd.location,
            price:       cd.price,
            description: cd.description,
            geometry:    cd.geometry,
            images:      cd.images,
            author:      author._id,
            reviews:     savedReviews.map(r => r._id),
        });
        await camp.save();
        createdCampgrounds.push(camp);

        console.log(`    ✅  [${ci + 1}/8] "${cd.title}" — ${savedReviews.length} reviews`);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  🎉  SEED COMPLETE');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Users       : ${createdUsers.length}  (1 admin + ${regularUsers.length} regular)`);
    console.log(`  Campgrounds : ${createdCampgrounds.length}`);
    console.log(`  Reviews     : ${totalReviews}`);
    console.log('──────────────────────────────────────────────────');
    console.log('  Admin credentials');
    console.log('    Username : campifyadmin');
    console.log('    Email    : campifyadmin@campify.com');
    console.log('    Password : Campify@123');
    console.log('══════════════════════════════════════════════════\n');

    console.log('📸  Image URLs per campground:');
    for (const c of createdCampgrounds) {
        console.log(`\n  "${c.title}"`);
        for (const img of c.images) {
            console.log(`    ${img.url}`);
        }
    }
    console.log('');
}

mongoose
    .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log(`🔌  Connected → ${DB_URL}`);
        await seedDb();
    })
    .catch(err => {
        console.error('❌  Error:', err.message);
        process.exit(1);
    })
    .finally(() => mongoose.connection.close());