import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../api/admin';

/* ── tiny helpers ─────────────────────────────────────────────── */
const KpiCard = ({ icon, label, value, color, to }) => (
    <div className="col-sm-6 col-xl-3">
        <div className={`admin-kpi-card admin-kpi-card--${color}`}>
            <div className="admin-kpi-card__icon">{icon}</div>
            <div className="admin-kpi-card__body">
                <div className="admin-kpi-card__value">
                    {value ?? <span className="placeholder col-4 bg-secondary" />}
                </div>
                <div className="admin-kpi-card__label">{label}</div>
            </div>
            {to && (
                <Link to={to} className="admin-kpi-card__link stretched-link" aria-label={`Go to ${label}`} />
            )}
        </div>
    </div>
);

const avatar = (user) =>
    user?.avatar?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || '?')}&background=random&size=32`;

/* ── Dashboard page ───────────────────────────────────────────── */
const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAdminStats()
            .then(setData)
            .catch(() => setError('Failed to load stats.'))
            .finally(() => setLoading(false));
    }, []);

    if (error) return <div className="alert alert-danger m-3">{error}</div>;

    const stats = data?.stats || {};

    return (
        <div>
            <h1 className="admin-page-title">Dashboard Overview</h1>

            {/* ── KPI Cards ─────────────────────────────────── */}
            <div className="row g-3 mb-4">
                <KpiCard icon="👥" label="Total Users"      value={loading ? null : stats.users}      color="indigo" to="/admin/users" />
                <KpiCard icon="🏕️" label="Campgrounds"     value={loading ? null : stats.campgrounds} color="emerald" to="/admin/campgrounds" />
                <KpiCard icon="⭐" label="Reviews"          value={loading ? null : stats.reviews}     color="amber" to="/admin/reviews" />
                <KpiCard icon="🛡️" label="Admins"          value={loading ? null : stats.admins}      color="rose" />
            </div>

            <div className="row g-3">
                {/* Recent Registrations */}
                <div className="col-lg-6">
                    <div className="card admin-card h-100">
                        <div className="card-header admin-card__header d-flex align-items-center justify-content-between">
                            <span>Recent Registrations</span>
                            <Link to="/admin/users" className="btn btn-sm btn-outline-primary">View all</Link>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="p-3 text-center text-muted">Loading…</div>
                            ) : (
                                <table className="table table-hover mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.recentUsers || []).map(u => (
                                            <tr key={u._id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <img src={avatar(u)} alt="" className="admin-table-avatar" />
                                                        <div>
                                                            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{u.username}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Campgrounds */}
                <div className="col-lg-6">
                    <div className="card admin-card h-100">
                        <div className="card-header admin-card__header d-flex align-items-center justify-content-between">
                            <span>Recent Campgrounds</span>
                            <Link to="/admin/campgrounds" className="btn btn-sm btn-outline-primary">View all</Link>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="p-3 text-center text-muted">Loading…</div>
                            ) : (
                                <table className="table table-hover mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Author</th>
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.recentCampgrounds || []).map(c => (
                                            <tr key={c._id}>
                                                <td style={{ maxWidth: 160 }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        {c.images?.[0]?.url && (
                                                            <img src={c.images[0].url.replace('/upload', '/upload/w_36,h_36,c_fill')} alt="" className="admin-table-avatar rounded" />
                                                        )}
                                                        <span className="text-truncate" style={{ fontSize: '0.85rem' }}>{c.title}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>{c.author?.username || '—'}</td>
                                                <td style={{ fontSize: '0.85rem' }}>${c.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="col-12">
                    <div className="card admin-card">
                        <div className="card-header admin-card__header d-flex align-items-center justify-content-between">
                            <span>Recent Reviews</span>
                            <Link to="/admin/reviews" className="btn btn-sm btn-outline-primary">View all</Link>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="p-3 text-center text-muted">Loading…</div>
                            ) : (
                                <table className="table table-hover mb-0 admin-table">
                                    <thead>
                                        <tr>
                                            <th>Author</th>
                                            <th>Rating</th>
                                            <th>Preview</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.recentReviews || []).map(r => (
                                            <tr key={r._id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <img src={avatar(r.author)} alt="" className="admin-table-avatar" />
                                                        <span style={{ fontSize: '0.85rem' }}>{r.author?.username}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                                </td>
                                                <td style={{ maxWidth: 240, fontSize: '0.8rem' }} className="text-muted text-truncate">
                                                    {r.body}
                                                </td>
                                                <td style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
