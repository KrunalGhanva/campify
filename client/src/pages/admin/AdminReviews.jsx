import { useEffect, useState, useCallback, useContext } from 'react';
import { getAdminReviews, deleteAdminReview } from '../../api/admin';
import { FlashContext } from '../../context/FlashContext';

const LIMIT = 10;

const avatar = (user) =>
    user?.avatar?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || '?')}&background=random&size=32`;

const Stars = ({ n }) => (
    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
        {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
);

const ConfirmModal = ({ review, onConfirm, onClose }) => (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title text-danger">Delete Review</h5>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>
                <div className="modal-body">
                    <p>Delete this review by <strong>{review.author?.username}</strong>?</p>
                    <blockquote className="blockquote border-start border-3 ps-3 text-muted" style={{ fontSize: '0.85rem' }}>
                        {review.body?.slice(0, 120)}{review.body?.length > 120 ? '…' : ''}
                    </blockquote>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    </div>
);

const Pagination = ({ page, pages, onChange }) => (
    <nav>
        <ul className="pagination pagination-sm mb-0 justify-content-end">
            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => onChange(page - 1)}>‹</button>
            </li>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => onChange(p)}>{p}</button>
                </li>
            ))}
            <li className={`page-item ${page >= pages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => onChange(page + 1)}>›</button>
            </li>
        </ul>
    </nav>
);

const AdminReviews = () => {
    const { showFlash } = useContext(FlashContext);
    const [reviews, setReviews] = useState([]);
    const [total, setTotal]     = useState(0);
    const [page, setPage]       = useState(1);
    const [pages, setPages]     = useState(1);
    const [loading, setLoading] = useState(true);
    const [confirmReview, setConfirmReview] = useState(null);
    const [busyId, setBusyId]   = useState(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminReviews({ page, limit: LIMIT });
            setReviews(data.reviews);
            setTotal(data.total);
            setPages(data.pages);
        } catch {
            showFlash('danger', 'Failed to load reviews.');
        } finally {
            setLoading(false);
        }
    }, [page, showFlash]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleDelete = async () => {
        if (!confirmReview) return;
        setBusyId(confirmReview._id);
        setConfirmReview(null);
        try {
            const res = await deleteAdminReview(confirmReview._id);
            showFlash('success', res.message);
            fetchReviews();
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to delete review.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            {confirmReview && (
                <ConfirmModal
                    review={confirmReview}
                    onConfirm={handleDelete}
                    onClose={() => setConfirmReview(null)}
                />
            )}

            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <h1 className="admin-page-title mb-0">Manage Reviews</h1>
                <span className="badge bg-secondary fs-6">{total} total</span>
            </div>

            <div className="card admin-card">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 admin-table">
                            <thead>
                                <tr>
                                    <th>Author</th>
                                    <th>Rating</th>
                                    <th className="d-none d-md-table-cell">Review</th>
                                    <th className="d-none d-lg-table-cell">Photos</th>
                                    <th className="d-none d-lg-table-cell">Date</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                    </td></tr>
                                ) : reviews.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-4 text-muted">No reviews found.</td></tr>
                                ) : (
                                    reviews.map(r => (
                                        <tr key={r._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <img src={avatar(r.author)} alt="" className="admin-table-avatar" />
                                                    <span style={{ fontSize: '0.85rem' }} className="fw-semibold">{r.author?.username || '—'}</span>
                                                </div>
                                            </td>
                                            <td><Stars n={r.rating} /></td>
                                            <td className="d-none d-md-table-cell" style={{ maxWidth: 260, fontSize: '0.8rem', color: '#6b7280' }}>
                                                <span className="text-truncate d-block">{r.body}</span>
                                            </td>
                                            <td className="d-none d-lg-table-cell" style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                                                {r.images?.length || 0} photo{r.images?.length !== 1 ? 's' : ''}
                                            </td>
                                            <td className="d-none d-lg-table-cell" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-end">
                                                    <button
                                                        className="btn btn-xs btn-danger"
                                                        onClick={() => setConfirmReview(r)}
                                                        disabled={busyId === r._id}
                                                        title="Delete review"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {pages > 1 && (
                    <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <small className="text-muted">Page {page} of {pages} · {total} reviews</small>
                        <Pagination page={page} pages={pages} onChange={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReviews;
