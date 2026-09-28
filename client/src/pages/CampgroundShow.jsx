import { useCallback, useEffect, useState, useRef, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getCampground, deleteCampground } from '../api/campgrounds';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import LoadingSpinner from '../components/LoadingSpinner';

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

const CampgroundShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campground, setCampground]   = useState(null);
    const [loading, setLoading]         = useState(true);
    const [deleting, setDeleting]       = useState(false);
    const [activeImg, setActiveImg]     = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const mapContainerRef = useRef(null);
    const mapRef          = useRef(null);

    const { currentUser } = useContext(AuthContext);
    const { showFlash }   = useContext(FlashContext);
    const mapToken        = import.meta.env.VITE_MAPBOX_TOKEN;

    const fetchCampground = useCallback(async () => {
        try {
            const data = await getCampground(id);
            setCampground(data.campground);
        } catch {
            showFlash('danger', 'Cannot find that campground!');
            navigate('/campgrounds');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, showFlash]);

    useEffect(() => { fetchCampground(); }, [fetchCampground]);

    useEffect(() => {
        if (!loading && mapToken && campground?.geometry && mapContainerRef.current && !mapRef.current) {
            mapboxgl.accessToken = mapToken;
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/outdoors-v12',
                center: campground.geometry.coordinates,
                zoom: 10
            });
            map.addControl(new mapboxgl.NavigationControl());
            new mapboxgl.Marker({ color: '#e85d04' })
                .setLngLat(campground.geometry.coordinates)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
                    `<strong style="font-family:Inter,sans-serif">${campground.title}</strong>
                     <p style="font-size:0.78rem;color:#6b7280;margin:4px 0 0">${campground.location}</p>`
                ))
                .addTo(map);
            mapRef.current = map;
        }
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [loading, campground, mapToken]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteCampground(id);
            showFlash('success', 'Campground deleted.');
            navigate('/campgrounds');
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Error deleting campground');
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading)     return <LoadingSpinner label="Loading campground..." />;
    if (!campground) return null;

    const images     = campground.images || [];
    const reviews    = campground.reviews || [];
    const isAuthor   = currentUser && campground.author && campground.author._id === currentUser._id;
    const avgRating  = reviews.length
        ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
        : null;

    return (
        <div style={{ minHeight: '80vh' }}>

            {/* ── Delete Confirmation Modal ── */}
            {showDeleteModal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1055, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>Delete Campground?</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            This will permanently remove <strong>"{campground.title}"</strong>, all its photos and all reviews. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setShowDeleteModal(false)}
                                style={{ flex: 1, padding: '0.65rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                style={{ flex: 1, padding: '0.65rem', borderRadius: '999px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)', opacity: deleting ? 0.7 : 1 }}>
                                {deleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Image Gallery Hero ── */}
            {images.length > 0 && (
                <div style={{ position: 'relative', background: 'var(--c-slate)', marginBottom: '2rem', borderRadius: '1rem', overflow: 'hidden', maxHeight: 480 }}>
                    <img
                        src={images[activeImg]?.url}
                        alt={campground.title}
                        style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block', transition: 'opacity 0.25s' }}
                    />
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(27,40,56,0.7) 0%, transparent 50%)' }} />

                    {/* Title overlay */}
                    <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.5rem,4vw,2.4rem)', color: '#fff', letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1 }}>
                            {campground.title}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
                            📍 {campground.location}
                        </p>
                    </div>

                    {/* Thumbnail nav */}
                    {images.length > 1 && (
                        <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.4rem' }}>
                            {images.map((img, i) => (
                                <button key={img._id} onClick={() => setActiveImg(i)}
                                    style={{
                                        width: 42, height: 42, borderRadius: '0.4rem', overflow: 'hidden',
                                        border: i === activeImg ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                                        padding: 0, cursor: 'pointer',
                                    }}
                                >
                                    <img src={img.url.replace('/upload', '/upload/w_84,h_84,c_fill')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Main grid ── */}
            <div className="row g-4">
                {/* ── Left column ── */}
                <div className="col-lg-7">

                    {/* Info card */}
                    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.75rem', marginBottom: '1.5rem' }}>

                        {/* Rating + price row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                            {avgRating !== null ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{stars(avgRating)}</span>
                                    <span style={{ fontWeight: 800, color: 'var(--c-slate)', fontSize: '1.05rem' }}>{avgRating.toFixed(1)}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                                </div>
                            ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No reviews yet</span>
                            )}
                            <div style={{
                                background: 'var(--c-alpine-pale)', color: 'var(--c-alpine-green)',
                                borderRadius: '999px', padding: '0.3rem 1rem',
                                fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem',
                            }}>
                                ${campground.price}<span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.7 }}>/night</span>
                            </div>
                        </div>

                        {images.length === 0 && (
                            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.6rem', color: 'var(--c-slate)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                                {campground.title}
                            </h1>
                        )}

                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.75, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                            {campground.description || <em>No description provided.</em>}
                        </p>

                        {/* Meta chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                            <span style={{ background: 'var(--c-snow)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.3rem 0.85rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                📍 {campground.location}
                            </span>
                            {campground.author?.username && (
                                <span style={{ background: 'var(--c-snow)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.3rem 0.85rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                    👤 by {campground.author.username}
                                </span>
                            )}
                        </div>

                        {/* Author actions */}
                        {isAuthor && (
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                                <Link to={`/campgrounds/${campground._id}/edit`}
                                    style={{ flex: 1, textAlign: 'center', background: 'var(--c-alpine-pale)', color: 'var(--c-alpine-green)', borderRadius: '999px', padding: '0.6rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                                    ✏ Edit Campground
                                </Link>
                                <button onClick={() => setShowDeleteModal(true)}
                                    style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '999px', padding: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                                    🗑 Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Reviews section */}
                    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.75rem' }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--c-slate)', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
                            Reviews {reviews.length > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>· {reviews.length}</span>}
                        </h2>
                        <ReviewList
                            reviews={reviews}
                            campgroundId={id}
                            onReviewDeleted={fetchCampground}
                            onReviewUpdated={(updatedReview) => {
                                setCampground(prev => ({
                                    ...prev,
                                    reviews: prev.reviews.map(r => r._id === updatedReview._id ? updatedReview : r)
                                }));
                            }}
                        />
                    </div>
                </div>

                {/* ── Right column ── */}
                <div className="col-lg-5">
                    {/* Map */}
                    {mapToken ? (
                        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <div ref={mapContainerRef} style={{ height: 280 }} aria-label="Location map" />
                            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                📍 {campground.location}
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-warning mb-3">Map unavailable — configure <code>VITE_MAPBOX_TOKEN</code>.</div>
                    )}

                    {/* Review form */}
                    {currentUser && (
                        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.75rem' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--c-slate)', marginBottom: '1.2rem', letterSpacing: '-0.02em' }}>
                                ✍ Leave a Review
                            </h3>
                            <ReviewForm campgroundId={id} onReviewAdded={fetchCampground} />
                        </div>
                    )}

                    {!currentUser && (
                        <div style={{
                            background: 'var(--c-alpine-pale)', borderRadius: '1rem', padding: '1.5rem',
                            textAlign: 'center', border: '1px solid rgba(45,106,79,0.2)',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💬</div>
                            <p style={{ color: 'var(--c-alpine-green)', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                Sign in to leave a review
                            </p>
                            <Link to="/login" style={{ background: 'var(--c-alpine-green)', color: '#fff', borderRadius: '999px', padding: '0.55rem 1.4rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                                Log In
                            </Link>
                        </div>
                    )}

                    {/* Back link */}
                    <div style={{ marginTop: '1.25rem' }}>
                        <Link to="/campgrounds" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            ← Back to all campgrounds
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampgroundShow;
