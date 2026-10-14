/**
 * Sample campers. These are invented people, not real accounts. Every seed email
 * uses the reserved .example domain so seed.js can find and replace its own users
 * without touching anyone who signed up for real.
 */
const SEED_EMAIL_DOMAIN = 'campers.example';

const usernames = [
    'aanya_treks',
    'rohan.kulkarni',
    'meera_iyer',
    'kabir_rides',
    'devansh.patel',
    'tenzin_dolma',
    'ishita_walks',
    'arjun.nair',
    'sneha_joshi',
    'vikram_rawat',
    'zoya.khan',
    'lena_fischer',
    'tom_whitaker',
    'maria.santos',
];

const users = usernames.map(username => ({
    username,
    email: `${username.replace('.', '_')}@${SEED_EMAIL_DOMAIN}`,
}));

module.exports = { SEED_EMAIL_DOMAIN, users };
