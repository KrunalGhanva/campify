import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCampgrounds, deleteAdminCampground } from '../../api/admin';
import { FlashContext } from '../../context/FlashContext';

const LIMIT = 10;

const ConfirmModal = ({ camp, onConfirm, onClose }) => (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title text-danger">Delete Campground</h5>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>
                <div className="modal-body">
                    <p>Delete <strong>{camp.title}</strong>? All its photos and reviews will also be removed.</p>
                    <p className="text-danger fw-semibold mb-0">This cannot be undone.</p>
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

const AdminCampgrounds = () => {
    const { showFlash } = useContext(FlashContext);
    const [campgrounds, setCampgrounds] = useState([]);
    const [total, setTotal]   = useState(0);
    const [page, setPage]     = useState(1);
    const [pages, setPages]   = useState(1);
    const [loading, setLoading] = useState(true);
    const [pendingSearch, setPendingSearch] = useState('');
    const [search, setSearch] = useState('');
    const [confirmCamp, setConfirmCamp] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const timer = useRef(null);

    const fetchCamps = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminCampgrounds({ page, limit: LIMIT, search: search || undefined });
            setCampgrounds(data.campgrounds);
            setTotal(data.total);
            setPages(data.pages);
        } catch {
            showFlash('danger', 'Failed to load campgrounds.');
        } finally {
            setLoading(false);
        }
    }, [page, search, showFlash]);

    useEffect(() => { fetchCamps(); }, [fetchCamps]);

    const handleSearch = (e) => {
        const v = e.target.value;
        setPendingSearch(v);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
    };

    const handleDelete = async () => {
        if (!confirmCamp) return;
        setBusyId(confirmCamp._id);
        setConfirmCamp(null);
        try {
            const res = await deleteAdminCampground(confirmCamp._id);
            showFlash('success', res.message);
            fetchCamps();
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to delete.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            {confirmCamp && (
                <ConfirmModal camp={confirmCamp} onConfirm={handleDelete} onClose={() => setConfirmCamp(null)} />
            )}

            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <h1 className="admin-page-title mb-0">Manage Campgrounds</h1>
                <span className="badge bg-secondary fs-6">{total} total</span>
            </div>

            <div className="card admin-card mb-3">
                <div className="card-body py-2">
                    <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Search by title or location…"
                        value={pendingSearch}
                        onChange={handleSearch}
                        id="admin-camp-search"
                    />
                </div>
            </div>

            <div className="card admin-card">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 admin-table">
                            <thead>
                                <tr>
                                    <th>Campground</th>
                                    <th className="d-none d-md-table-cell">Location</th>
                                    <th className="d-none d-sm-table-cell">Author</th>
                                    <th>Price</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                    </td></tr>
                                ) : campgrounds.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-4 text-muted">No campgrounds found.</td></tr>
                                ) : (
                                    campgrounds.map(c => (
                                        <tr key={c._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    {c.images?.[0]?.url ? (
                                                        <img
                                                            src={c.images[0].url.replace('/upload', '/upload/w_40,h_40,c_fill')}
                                                            alt=""
                                                            className="admin-table-avatar rounded"
                                                        />
                                                    ) : (
                                                        <div className="admin-table-avatar rounded bg-secondary d-flex align-items-center justify-content-center text-white" style={{ fontSize: '1rem' }}>🏕</div>
                                                    )}
                                                    <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{c.title}</span>
                                                </div>
                                            </td>
                                            <td className="d-none d-md-table-cell" style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                                {c.location}
                                            </td>
                                            <td className="d-none d-sm-table-cell" style={{ fontSize: '0.82rem' }}>
                                                {c.author?.username || '—'}
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>${c.price}</td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <Link
                                                        to={`/campgrounds/${c._id}`}
                                                        className="btn btn-xs btn-outline-secondary"
                                                        target="_blank"
                                                        title="View on site"
                                                    >
                                                        👁
                                                    </Link>
                                                    <Link
                                                        to={`/campgrounds/${c._id}/edit`}
                                                        className="btn btn-xs btn-outline-primary"
                                                        target="_blank"
                                                        title="Edit"
                                                    >
                                                        ✏
                                                    </Link>
                                                    <button
                                                        className="btn btn-xs btn-danger"
                                                        onClick={() => setConfirmCamp(c)}
                                                        disabled={busyId === c._id}
                                                        title="Delete"
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
                        <small className="text-muted">Page {page} of {pages} · {total} campgrounds</small>
                        <Pagination page={page} pages={pages} onChange={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCampgrounds;
