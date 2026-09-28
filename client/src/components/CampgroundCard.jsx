import { Link } from 'react-router-dom';

const CampgroundCard = ({ campground }) => {
    const avgRating = campground.reviews?.length
        ? campground.reviews.reduce((s, r) => s + (r.rating || 0), 0) / campground.reviews.length
        : null;

    const stars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

    return (
        <article
            className="campground-card"
            style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: '1rem',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '280px 1fr',
                transition: 'box-shadow 0.22s, transform 0.22s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.transform = '';
            }}
        >
            {/* Image */}
            <div style={{ position: 'relative', overflow: 'hidden', background: '#e2e8f0' }}>
                {campground.images?.length ? (
                    <img
                        src={campground.images[0].url.replace('/upload', '/upload/w_560,h_360,c_fill')}
                        alt={`View of ${campground.title}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                        className="campground-card-image"
                    />
                ) : (
                    <div style={{ height: '100%', minHeight: 180, display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: '2.5rem' }}>
                        🏕️
                    </div>
                )}
                {/* Price badge */}
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(27,40,56,0.88)', color: '#fff',
                    borderRadius: '999px', padding: '0.25rem 0.75rem',
                    fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(4px)',
                }}>
                    ${campground.price}<span style={{ opacity: 0.65, fontWeight: 400 }}>/night</span>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800,
                    color: 'var(--c-slate)', marginBottom: '0.35rem', letterSpacing: '-0.02em',
                }}>
                    {campground.title}
                </h2>

                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    📍 {campground.location}
                </p>

                {avgRating !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#f59e0b', fontSize: '0.88rem', letterSpacing: '0.05em' }}>{stars(avgRating)}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {avgRating.toFixed(1)} ({campground.reviews.length} review{campground.reviews.length !== 1 ? 's' : ''})
                        </span>
                    </div>
                )}

                <p style={{
                    fontSize: '0.87rem', color: 'var(--color-text-muted)', lineHeight: 1.65,
                    flex: 1, marginBottom: '1.25rem',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {campground.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {campground.author?.username && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            by <strong style={{ color: 'var(--c-slate)' }}>{campground.author.username}</strong>
                        </span>
                    )}
                    <Link
                        to={`/campgrounds/${campground._id}`}
                        style={{
                            background: 'var(--c-alpine-green)', color: '#fff',
                            borderRadius: '999px', padding: '0.5rem 1.2rem',
                            fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none',
                            transition: 'background 0.2s',
                            marginLeft: 'auto',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--c-alpine-light)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--c-alpine-green)'}
                    >
                        View Details →
                    </Link>
                </div>
            </div>
        </article>
    );
};

export default CampgroundCard;
