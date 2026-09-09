import { useState, useContext } from 'react';
import { createReview } from '../api/reviews';
import { FlashContext } from '../context/FlashContext';
import StarRating from './StarRating';
import { validateReview } from '../utils/validation';

const ReviewForm = ({ campgroundId, onReviewAdded }) => {
    const [rating, setRating] = useState(1);
    const [body, setBody] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const { showFlash } = useContext(FlashContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateReview({ rating, body });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSubmitting(true);
        try {
            const data = await createReview(campgroundId, { review: { rating, body } });
            showFlash('success', 'Created new review!');
            setRating(1);
            setBody('');
            if (onReviewAdded) onReviewAdded(data);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Could not create review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-3 validated-form">
            <div className="mb-3">
                <StarRating rating={rating} setRating={(value) => {
                    setRating(value);
                    setErrors((current) => ({ ...current, rating: undefined }));
                }} name="review-rating" />
                {errors.rating && <div className="text-danger small mt-1">{errors.rating}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="body">Review Text</label>
                <textarea
                    className={`form-control ${errors.body ? 'is-invalid' : ''}`}
                    name="review[body]"
                    id="body"
                    cols="30"
                    rows="3"
                    required
                    value={body}
                    onChange={e => {
                        setBody(e.target.value);
                        setErrors((current) => ({ ...current, body: undefined }));
                    }}
                ></textarea>
                {errors.body && <div className="invalid-feedback">{errors.body}</div>}
            </div>
            <button className="btn btn-success" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit review'}
            </button>
        </form>
    );
};

export default ReviewForm;
