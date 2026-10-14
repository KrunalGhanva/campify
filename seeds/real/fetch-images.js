/**
 * Finds real, freely licensed photos of each place on Wikimedia Commons
 * and writes them to images.json together with author and licence.
 *
 *   node seeds/real/fetch-images.js            # fill in places missing from images.json
 *   node seeds/real/fetch-images.js --refresh  # search again for every place
 *
 * images.json is meant to be reviewed by hand: delete or reorder entries, or
 * replace one with another Commons file. seed.js uploads whatever is listed there.
 */

const fs = require('fs');
const path = require('path');
const places = require('./places');

const OUT = path.join(__dirname, 'images.json');
const PER_PLACE = 3;
const UA = 'CampifySeeder/1.0 (https://github.com/KrunalGhanva; seed script)';

// Licences that allow reuse on a public website (with attribution where required).
const ALLOWED_LICENCE = /^(CC0|Public domain|CC BY(-SA)? [0-9.]+)/i;
// Titles that are usually maps, signs or close-ups rather than a view of the place.
const SKIP_TITLE = /\b(map|logo|diagram|sign|board|plaque|ticket|container|canister|menu|poster|stamp|coin)\b/i;

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// Some authors put a whole licence note in the Artist field; keep just the name.
const cleanAuthor = (raw) => {
    const text = strip(raw)
        .replace(/^this photo was taken by /i, '')
        .replace(/\s*\((talk|uploads|contribs)\)/gi, '')
        .split(/(?<!\b[A-Z])\. (?=[A-Z])/)[0];
    return (text.length > 80 ? text.slice(0, 77) + '…' : text) || 'Unknown';
};

async function search(query) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: `${query} filetype:bitmap`,
        gsrnamespace: '6',
        gsrlimit: '30',
        prop: 'imageinfo',
        iiprop: 'url|size|mime|extmetadata',
        iiurlwidth: '1600',
    });
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`Commons search failed (${res.status}) for "${query}"`);
    const data = await res.json();
    return Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
}

function pick(pages, chosen, skip) {
    for (const page of pages) {
        if (chosen.length === PER_PLACE) break;
        if (skip.includes(page.title) || chosen.some(c => c.file === page.title)) continue;
        const info = page.imageinfo?.[0];
        if (!info) continue;
        const meta = info.extmetadata || {};
        const licence = strip(meta.LicenseShortName?.value);
        const landscape = info.width >= info.height * 1.2;

        if (info.mime !== 'image/jpeg') continue;
        if (info.width < 1200 || !landscape) continue;
        if (SKIP_TITLE.test(page.title)) continue;
        if (!ALLOWED_LICENCE.test(licence)) continue;

        chosen.push({
            file: page.title,
            source: info.thumburl || info.url,
            page: info.descriptionurl,
            author: cleanAuthor(meta.Artist?.value),
            licence,
            licenceUrl: meta.LicenseUrl?.value || null,
        });
    }
    return chosen;
}

async function main() {
    const refresh = process.argv.includes('--refresh');
    const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
    const result = {};

    for (const place of places) {
        if (!refresh && existing[place.title]?.length) {
            result[place.title] = existing[place.title];
            console.log(`  kept    ${place.title} (${existing[place.title].length})`);
            continue;
        }
        const queries = [].concat(place.imageQuery);
        const images = [];
        for (const query of queries) {
            if (images.length === PER_PLACE) break;
            pick(await search(query), images, place.skipImages || []);
        }
        if (!images.length && existing[place.title]?.length) {
            // Commons search is occasionally flaky; don't throw away photos we already had.
            result[place.title] = existing[place.title];
            console.log(`  kept    ${place.title} (search returned nothing this time)`);
            continue;
        }
        result[place.title] = images;
        const flag = images.length ? 'found  ' : 'NONE   ';
        console.log(`  ${flag} ${place.title} (${images.length}) — ${queries.map(q => `"${q}"`).join(', ')}`);
        images.forEach(img => console.log(`            ${img.file}  [${img.licence}, ${img.author}]`));
    }

    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n');
    writeCredits(result);
    console.log(`\nWrote ${path.relative(process.cwd(), OUT)} and IMAGE_CREDITS.md. Review them before running seed.js.`);
}

// CC BY and CC BY-SA photos must be credited wherever they are shown.
function writeCredits(manifest) {
    const lines = ['# Image credits', '', 'Campground photos from Wikimedia Commons, used under the licences below.', ''];
    for (const [title, images] of Object.entries(manifest)) {
        lines.push(`## ${title}`, '');
        for (const img of images) {
            const licence = img.licenceUrl ? `[${img.licence}](${img.licenceUrl})` : img.licence;
            lines.push(`- [${img.file.replace(/^File:/, '')}](${img.page}) by ${img.author}, ${licence}`);
        }
        lines.push('');
    }
    fs.writeFileSync(path.join(__dirname, 'IMAGE_CREDITS.md'), lines.join('\n'));
}

main().catch(err => {
    console.error(err.message);
    process.exit(1);
});
