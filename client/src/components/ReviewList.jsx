import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import { deleteReview } from '../api/reviews';
import StarRating from './StarRating';

const ReviewList = ({ reviews, campgroundId, onReviewDeleted }) => {
    const { currentUser } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (reviewId) => {
        setDeletingId(reviewId);
        try {
            await deleteReview(campgroundId, reviewId);
            showFlash('success', 'Successfully deleted review');
            if (onReviewDeleted) onReviewDeleted(reviewId);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Could not delete review');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            {!reviews.length && <p className="text-muted">No reviews yet. Be the first to share your experience.</p>}
            {reviews.map(review => (
                <div className="card mb-3" key={review._id}>
                    <div className="card-body">
                        <h5 className="card-title"> {review.author?.username}</h5>
                        <StarRating rating={review.rating} readOnly={true} />
                        <p className="card-text">Review: {review.body}</p>
                        {currentUser && review.author && review.author._id === currentUser._id && (
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(review._id)}
                                disabled={deletingId === review._id}
                            >
                                {deletingId === review._id ? 'Deleting…' : 'Delete'}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReviewList;
