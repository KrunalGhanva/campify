import { useState, useContext, useRef } from 'react';
import { createReview } from '../api/reviews';
import { FlashContext } from '../context/FlashContext';
import StarRating from './StarRating';
import { validateReview } from '../utils/validation';

const MAX_PHOTOS = 6;
const MAX_FILE_MB = 5;

const ReviewForm = ({ campgroundId, onReviewAdded }) => {
    const [rating, setRating] = useState(0);
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState([]); // [{file, preview}]
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const { showFlash } = useContext(FlashContext);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const remaining = MAX_PHOTOS - photos.length;
        const toAdd = files.slice(0, remaining).filter(f => {
            if (f.size > MAX_FILE_MB * 1024 * 1024) {
                showFlash('danger', `${f.name} exceeds ${MAX_FILE_MB} MB limit.`);
                return false;
            }
            return true;
        });
        const newPhotos = toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
        setPhotos(prev => [...prev, ...newPhotos]);
        // Reset input so same file can be re-added if removed
        e.target.value = '';
    };

    const removePhoto = (idx) => {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[idx].preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateReview({ rating, body });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('review[rating]', rating);
            fd.append('review[body]', body);
            photos.forEach(p => fd.append('image', p.file));

            const data = await createReview(campgroundId, fd);
            showFlash('success', 'Review posted!');

            // Clean up previews
            photos.forEach(p => URL.revokeObjectURL(p.preview));
            setRating(0);
            setBody('');
            setPhotos([]);
            if (onReviewAdded) onReviewAdded(data);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Could not post review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="review-form mb-4">
            {/* Star picker */}
            <div className="mb-3">
                <label className="form-label fw-semibold">Your Rating</label>
                <div>
                    <StarRating
                        rating={rating}
                        setRating={(v) => {
                            setRating(v);
                            setErrors(c => ({ ...c, rating: undefined }));
                        }}
                        size="lg"
                        name={`rating-${campgroundId}`}
                    />
                </div>
                {errors.rating && <div className="text-danger small mt-1">{errors.rating}</div>}
            </div>

            {/* Body */}
            <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="review-body">Your Review</label>
                <textarea
                    id="review-body"
                    className={`form-control ${errors.body ? 'is-invalid' : ''}`}
                    rows={3}
                    maxLength={1000}
                    placeholder="Share your experience…"
                    value={body}
                    onChange={e => {
                        setBody(e.target.value);
                        setErrors(c => ({ ...c, body: undefined }));
                    }}
                />
                <div className="d-flex justify-content-between">
                    {errors.body
                        ? <div className="invalid-feedback d-block">{errors.body}</div>
                        : <span />}
                    <small className="text-muted ms-auto">{body.length}/1000</small>
                </div>
            </div>

            {/* Photo upload */}
            <div className="mb-3">
                <label className="form-label fw-semibold">Add Photos (optional, max {MAX_PHOTOS})</label>
                {photos.length < MAX_PHOTOS && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            multiple
                            className="d-none"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm d-block mb-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <i className="bi bi-camera me-1"></i>
                            Choose Photos
                        </button>
                    </>
                )}
                {photos.length > 0 && (
                    <div className="review-photo-previews">
                        {photos.map((p, i) => (
                            <div key={i} className="review-photo-thumb">
                                <img src={p.preview} alt={`Preview ${i + 1}`} />
                                <button
                                    type="button"
                                    className="review-photo-remove"
                                    onClick={() => removePhoto(i)}
                                    aria-label="Remove photo"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="btn btn-success px-4" disabled={submitting}>
                {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Posting…</>
                ) : 'Post Review'}
            </button>
        </form>
    );
};

export default ReviewForm;
