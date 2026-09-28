import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { getAdminUsers, toggleUserRole, toggleUserSuspend, deleteAdminUser } from '../../api/admin';
import { FlashContext } from '../../context/FlashContext';
import { AuthContext } from '../../context/AuthContext';

const LIMIT = 10;

const avatar = (user) =>
    user?.avatar?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || '?')}&background=random&size=36`;

/* ── Confirm modal (Bootstrap) ────────────────────────────────── */
const ConfirmModal = ({ id, user, onConfirm, onClose }) => (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title text-danger">Delete User</h5>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>
                <div className="modal-body">
                    <p>
                        You are about to permanently delete <strong>{user.username}</strong>.
                        This will also remove all their campgrounds, reviews, and uploaded images.
                    </p>
                    <p className="text-danger fw-semibold mb-0">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Delete permanently</button>
                </div>
            </div>
        </div>
    </div>
);

/* ── Pagination ───────────────────────────────────────────────── */
const Pagination = ({ page, pages, onChange }) => (
    <nav aria-label="Users pagination">
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

/* ── AdminUsers page ──────────────────────────────────────────── */
const AdminUsers = () => {
    const { showFlash } = useContext(FlashContext);
    const { currentUser } = useContext(AuthContext);

    const [users, setUsers]     = useState([]);
    const [total, setTotal]     = useState(0);
    const [page, setPage]       = useState(1);
    const [pages, setPages]     = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [pendingSearch, setPendingSearch] = useState('');

    const [confirmUser, setConfirmUser] = useState(null); // user to delete
    const [busyId, setBusyId] = useState(null);           // id being mutated

    const searchTimer = useRef(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminUsers({
                page,
                limit: LIMIT,
                search: search || undefined,
                role: roleFilter || undefined
            });
            setUsers(data.users);
            setTotal(data.total);
            setPages(data.pages);
        } catch {
            showFlash('danger', 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, showFlash]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounce search input
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setPendingSearch(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setSearch(val);
            setPage(1);
        }, 350);
    };

    const handleRoleFilter = (e) => { setRoleFilter(e.target.value); setPage(1); };

    /* ── Actions ─────────────────────────────────────────────── */
    const handleToggleRole = async (user) => {
        setBusyId(user._id);
        try {
            const res = await toggleUserRole(user._id);
            showFlash('success', res.message);
            fetchUsers();
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to update role.');
        } finally {
            setBusyId(null);
        }
    };

    const handleToggleSuspend = async (user) => {
        setBusyId(user._id);
        try {
            const res = await toggleUserSuspend(user._id);
            showFlash('success', res.message);
            fetchUsers();
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to update status.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmUser) return;
        setBusyId(confirmUser._id);
        setConfirmUser(null);
        try {
            const res = await deleteAdminUser(confirmUser._id);
            showFlash('success', res.message);
            fetchUsers();
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to delete user.');
        } finally {
            setBusyId(null);
        }
    };

    const isSelf = (u) => currentUser?._id === u._id;

    return (
        <div>
            {confirmUser && (
                <ConfirmModal
                    user={confirmUser}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setConfirmUser(null)}
                />
            )}

            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <h1 className="admin-page-title mb-0">Manage Users</h1>
                <span className="badge bg-secondary fs-6">{total} total</span>
            </div>

            {/* Filters */}
            <div className="card admin-card mb-3">
                <div className="card-body py-2">
                    <div className="row g-2 align-items-center">
                        <div className="col-sm-7 col-md-8">
                            <input
                                type="search"
                                className="form-control form-control-sm"
                                placeholder="Search by name or email…"
                                value={pendingSearch}
                                onChange={handleSearchChange}
                                id="admin-user-search"
                            />
                        </div>
                        <div className="col-sm-5 col-md-4">
                            <select
                                className="form-select form-select-sm"
                                value={roleFilter}
                                onChange={handleRoleFilter}
                                id="admin-role-filter"
                            >
                                <option value="">All roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card admin-card">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th className="d-none d-md-table-cell">Email</th>
                                    <th>Role</th>
                                    <th className="d-none d-lg-table-cell">Joined</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">No users found.</td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u._id} className={u.suspended ? 'table-warning opacity-75' : ''}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <img src={avatar(u)} alt="" className="admin-table-avatar" />
                                                    <div>
                                                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                                            {u.username}
                                                            {isSelf(u) && <span className="badge bg-info ms-1" style={{ fontSize: '0.65rem' }}>You</span>}
                                                        </div>
                                                        <div className="text-muted d-md-none" style={{ fontSize: '0.72rem' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="d-none d-md-table-cell" style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                                {u.email || '—'}
                                            </td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="d-none d-lg-table-cell" style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <span className={`badge ${u.suspended ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                    {u.suspended ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-end flex-wrap">
                                                    {/* Toggle role */}
                                                    <button
                                                        className={`btn btn-xs ${u.role === 'admin' ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                                                        onClick={() => handleToggleRole(u)}
                                                        disabled={!!busyId || isSelf(u)}
                                                        title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                                    >
                                                        {busyId === u._id ? '…' : u.role === 'admin' ? '⬇ Demote' : '⬆ Promote'}
                                                    </button>

                                                    {/* Toggle suspend */}
                                                    <button
                                                        className={`btn btn-xs ${u.suspended ? 'btn-success' : 'btn-warning'}`}
                                                        onClick={() => handleToggleSuspend(u)}
                                                        disabled={!!busyId || isSelf(u)}
                                                        title={u.suspended ? 'Reactivate' : 'Suspend'}
                                                    >
                                                        {u.suspended ? '✓ Activate' : '⊘ Suspend'}
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        className="btn btn-xs btn-danger"
                                                        onClick={() => setConfirmUser(u)}
                                                        disabled={!!busyId || isSelf(u)}
                                                        title="Delete user"
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

                {/* Pagination footer */}
                {pages > 1 && (
                    <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <small className="text-muted">Page {page} of {pages} · {total} users</small>
                        <Pagination page={page} pages={pages} onChange={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
