import { useContext, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import { deleteReview, updateReview } from '../api/reviews';
import StarRating from './StarRating';
import { validateReview } from '../utils/validation';

/* ─── Aggregate Rating Summary Card ───────────────────────────── */
const RatingSummary = ({ reviews }) => {
    if (!reviews.length) return null;

    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const counts = [5, 4, 3, 2, 1].map(n => ({
        star: n,
        count: reviews.filter(r => r.rating === n).length
    }));

    return (
        <div className="rating-summary card mb-4">
            <div className="card-body d-flex gap-4 align-items-center flex-wrap">
                {/* Big score */}
                <div className="rating-summary__score text-center">
                    <div className="rating-summary__avg">{avg.toFixed(1)}</div>
                    <StarRating rating={Math.round(avg)} readOnly size="lg" />
                    <div className="text-muted small mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                </div>

                {/* Bar breakdown */}
                <div className="rating-summary__bars flex-grow-1">
                    {counts.map(({ star, count }) => {
                        const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                            <div key={star} className="rating-bar-row">
                                <span className="rating-bar-label">{star}★</span>
                                <div className="rating-bar-track">
                                    <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="rating-bar-count">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/* ─── Inline Edit Form ─────────────────────────────────────────── */
const EditReviewForm = ({ review, campgroundId, onSaved, onCancel }) => {
    const [rating, setRating] = useState(review.rating);
    const [body, setBody] = useState(review.body);
    const [photos, setPhotos] = useState([]); // new photos to add
    const [deleteImages, setDeleteImages] = useState([]); // filenames to remove
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const { showFlash } = useContext(FlashContext);

    const toggleDeleteImage = (filename) => {
        setDeleteImages(prev =>
            prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
        );
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const total = (review.images?.length || 0) - deleteImages.length + photos.length + files.length;
        if (total > 6) {
            showFlash('danger', 'Maximum 6 photos per review.');
            return;
        }
        const newPhotos = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
        setPhotos(prev => [...prev, ...newPhotos]);
        e.target.value = '';
    };

    const removeNewPhoto = (idx) => {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[idx].preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const nextErrors = validateReview({ rating, body });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('review[rating]', rating);
            fd.append('review[body]', body);
            photos.forEach(p => fd.append('image', p.file));
            deleteImages.forEach(fn => fd.append('deleteImages[]', fn));

            const data = await updateReview(campgroundId, review._id, fd);
            photos.forEach(p => URL.revokeObjectURL(p.preview));
            showFlash('success', 'Review updated!');
            onSaved(data);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Could not update review');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="edit-review-form mt-3 p-3 border rounded bg-light">
            <div className="mb-2">
                <label className="form-label fw-semibold small">Rating</label>
                <div>
                    <StarRating
                        rating={rating}
                        setRating={v => { setRating(v); setErrors(c => ({ ...c, rating: undefined })); }}
                        size="md"
                        name={`edit-rating-${review._id}`}
                    />
                </div>
                {errors.rating && <div className="text-danger small">{errors.rating}</div>}
            </div>

            <div className="mb-2">
                <label className="form-label fw-semibold small" htmlFor={`edit-body-${review._id}`}>Review</label>
                <textarea
                    id={`edit-body-${review._id}`}
                    className={`form-control form-control-sm ${errors.body ? 'is-invalid' : ''}`}
                    rows={3}
                    maxLength={1000}
                    value={body}
                    onChange={e => { setBody(e.target.value); setErrors(c => ({ ...c, body: undefined })); }}
                />
                {errors.body && <div className="invalid-feedback">{errors.body}</div>}
            </div>

            {/* Existing images */}
            {review.images && review.images.length > 0 && (
                <div className="mb-2">
                    <label className="form-label fw-semibold small">Existing Photos (check to remove)</label>
                    <div className="review-photo-previews">
                        {review.images.map(img => (
                            <div
                                key={img.filename}
                                className={`review-photo-thumb ${deleteImages.includes(img.filename) ? 'marked-delete' : ''}`}
                                onClick={() => toggleDeleteImage(img.filename)}
                                title={deleteImages.includes(img.filename) ? 'Click to keep' : 'Click to remove'}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={img.url} alt="" />
                                {deleteImages.includes(img.filename) && (
                                    <div className="review-photo-delete-overlay">Remove</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New photos */}
            <div className="mb-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    multiple
                    className="d-none"
                    onChange={handleFileChange}
                />
                <button type="button" className="btn btn-outline-secondary btn-sm me-2" onClick={() => fileInputRef.current?.click()}>
                    Add Photos
                </button>
                {photos.length > 0 && (
                    <div className="review-photo-previews mt-2">
                        {photos.map((p, i) => (
                            <div key={i} className="review-photo-thumb">
                                <img src={p.preview} alt="" />
                                <button type="button" className="review-photo-remove" onClick={() => removeNewPhoto(i)}>×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

/* ─── Review Card ─────────────────────────────────────────────── */
const ReviewCard = ({ review, campgroundId, currentUser, onDeleted, onUpdated }) => {
    const { showFlash } = useContext(FlashContext);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [lightbox, setLightbox] = useState(null); // url string

    const isOwner = currentUser && review.author && review.author._id === currentUser._id;

    const handleDelete = async () => {
        if (!window.confirm('Delete this review?')) return;
        setDeleting(true);
        try {
            await deleteReview(campgroundId, review._id);
            showFlash('success', 'Review deleted.');
            onDeleted(review._id);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Could not delete review');
        } finally {
            setDeleting(false);
        }
    };

    const date = review.createdAt
        ? new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : null;

    return (
        <div className="review-card card mb-3">
            {/* Lightbox */}
            {lightbox && (
                <div className="review-lightbox" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="Full size" />
                </div>
            )}

            <div className="card-body">
                {/* Author row */}
                <div className="review-card__author d-flex align-items-center gap-2 mb-2">
                    <img
                        src={review.author?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author?.username || 'U')}&background=random&size=40`}
                        alt={review.author?.username}
                        className="review-avatar"
                    />
                    <div>
                        <div className="fw-semibold lh-1">{review.author?.username}</div>
                        {date && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{date}</div>}
                    </div>
                    <div className="ms-auto">
                        <StarRating rating={review.rating} readOnly size="sm" />
                    </div>
                </div>

                {/* Body */}
                <p className="review-card__body mb-2">{review.body}</p>

                {/* Photo gallery */}
                {review.images && review.images.length > 0 && (
                    <div className="review-photo-previews mb-2">
                        {review.images.map(img => (
                            <div
                                key={img.filename || img._id}
                                className="review-photo-thumb"
                                onClick={() => setLightbox(img.url)}
                                style={{ cursor: 'zoom-in' }}
                            >
                                <img src={img.url?.replace('/upload', '/upload/w_200,h_160,c_fill') || img.url} alt="" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit / Delete */}
                {isOwner && !editing && (
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(true)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                )}

                {/* Inline Edit Form */}
                {editing && (
                    <EditReviewForm
                        review={review}
                        campgroundId={campgroundId}
                        onSaved={(data) => { setEditing(false); onUpdated(data.review); }}
                        onCancel={() => setEditing(false)}
                    />
                )}
            </div>
        </div>
    );
};

/* ─── ReviewList (main export) ────────────────────────────────── */
const ReviewList = ({ reviews, campgroundId, onReviewDeleted, onReviewUpdated }) => {
    const { currentUser } = useContext(AuthContext);

    if (!reviews.length) {
        return (
            <div className="text-center text-muted py-4">
                <div style={{ fontSize: '2.5rem' }}>🏕️</div>
                <p className="mt-2">No reviews yet. Be the first to share your experience!</p>
            </div>
        );
    }

    return (
        <div>
            <RatingSummary reviews={reviews} />
            {reviews.map(review => (
                <ReviewCard
                    key={review._id}
                    review={review}
                    campgroundId={campgroundId}
                    currentUser={currentUser}
                    onDeleted={onReviewDeleted}
                    onUpdated={onReviewUpdated}
                />
            ))}
        </div>
    );
};

export default ReviewList;
