import { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import { updateProfile, updatePassword } from '../api/auth';
import { getAllCampgrounds, deleteCampground } from '../api/campgrounds';
import StarRating from '../components/StarRating';

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */

/* ── Skeleton Card ─────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '1rem' }}>
        <div className="skeleton" style={{ height: 180 }} />
        <div className="card-body p-3">
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            <div className="skeleton skeleton-text" style={{ width: '45%' }} />
        </div>
    </div>
);

/* ── Delete Confirm Modal ──────────────────────────────── */
const DeleteModal = ({ camp, onConfirm, onClose }) => (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)', zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1rem' }}>
                <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title fw-bold text-danger">Delete Campground</h5>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>
                <div className="modal-body">
                    <p className="mb-1">
                        Are you sure you want to delete <strong>"{camp.title}"</strong>?
                    </p>
                    <p className="text-danger small mb-0">
                        This will permanently remove the campground, all its photos, and all reviews.
                    </p>
                </div>
                <div className="modal-footer border-0 pt-0">
                    <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger rounded-pill px-4" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    </div>
);

/* ── Campground Card ───────────────────────────────────── */
const MyCampgroundCard = ({ camp, onDelete }) => {
    const avgRating = camp.reviews?.length
        ? camp.reviews.reduce((s, r) => s + (r.rating || 0), 0) / camp.reviews.length
        : null;

    return (
        <div className="card border-0 shadow-sm overflow-hidden h-100 campground-card"
            style={{ borderRadius: '1rem', transition: 'box-shadow 0.25s, transform 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
        >
            {/* Thumbnail */}
            <div style={{ overflow: 'hidden', height: 180, background: '#e2e8f0', position: 'relative' }}>
                {camp.images?.[0]?.url ? (
                    <img
                        src={camp.images[0].url.replace('/upload', '/upload/w_400,h_240,c_fill')}
                        alt={camp.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        className="campground-card-image"
                    />
                ) : (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: '2rem' }}>
                        🏕️
                    </div>
                )}
                {/* Price badge */}
                <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(27,40,56,0.85)', color: '#fff',
                    borderRadius: '999px', padding: '0.25rem 0.75rem',
                    fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(4px)',
                }}>
                    ${camp.price}/night
                </div>
            </div>

            <div className="card-body p-3 d-flex flex-column">
                <h5 className="fw-bold mb-1" style={{ fontSize: '0.95rem', color: 'var(--c-slate)' }}>
                    {camp.title}
                </h5>
                <p className="text-muted mb-2" style={{ fontSize: '0.78rem' }}>
                    📍 {camp.location}
                </p>
                {avgRating !== null && (
                    <div className="d-flex align-items-center gap-1 mb-2">
                        <StarRating rating={Math.round(avgRating)} readOnly size="sm" />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            ({camp.reviews.length})
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto d-flex gap-2 pt-2">
                    <Link
                        to={`/campgrounds/${camp._id}`}
                        className="btn btn-sm btn-outline-secondary flex-fill"
                        style={{ borderRadius: '999px', fontSize: '0.78rem' }}
                    >
                        View
                    </Link>
                    <Link
                        to={`/campgrounds/${camp._id}/edit`}
                        className="btn btn-sm btn-outline-primary flex-fill"
                        style={{ borderRadius: '999px', fontSize: '0.78rem' }}
                    >
                        ✏ Edit
                    </Link>
                    <button
                        className="btn btn-sm btn-danger flex-fill"
                        style={{ borderRadius: '999px', fontSize: '0.78rem' }}
                        onClick={() => onDelete(camp)}
                    >
                        🗑 Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════ */

/* ── Overview Tab ──────────────────────────────────────── */
const OverviewTab = ({ currentUser, campgrounds, loading, onTabChange }) => {
    const totalReviews = campgrounds.reduce((s, c) => s + (c.reviews?.length || 0), 0);
    const avgRating = campgrounds.length
        ? campgrounds.reduce((sum, c) => {
            if (!c.reviews?.length) return sum;
            return sum + c.reviews.reduce((rs, r) => rs + (r.rating || 0), 0) / c.reviews.length;
        }, 0) / campgrounds.filter(c => c.reviews?.length).length
        : null;

    const statsCards = [
        { icon: '🏕️', label: 'My Campgrounds', value: campgrounds.length, action: () => onTabChange('campgrounds') },
        { icon: '⭐', label: 'Total Reviews',   value: totalReviews },
        { icon: '📊', label: 'Avg. Rating',      value: avgRating !== null ? `${avgRating.toFixed(1)} / 5` : '—' },
    ];

    const recentCamps = [...campgrounds].slice(0, 3);

    return (
        <div>
            {/* Stats row */}
            <div className="row g-3 mb-4">
                {statsCards.map(s => (
                    <div className="col-md-4" key={s.label}>
                        <div
                            className="card border-0 shadow-sm h-100 d-flex flex-row align-items-center gap-3 p-3"
                            style={{ borderRadius: '1rem', cursor: s.action ? 'pointer' : 'default' }}
                            onClick={s.action}
                        >
                            <div style={{
                                fontSize: '1.8rem', width: 52, height: 52,
                                borderRadius: '0.75rem', background: 'var(--c-alpine-pale)',
                                display: 'grid', placeItems: 'center', flexShrink: 0,
                            }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '1.6rem', fontWeight: 800,
                                    fontFamily: 'var(--font-heading)', color: 'var(--c-alpine-green)',
                                    lineHeight: 1,
                                }}>
                                    {loading ? <span className="skeleton skeleton-text d-block" style={{ width: 50 }} /> : s.value}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: 2 }}>
                                    {s.label}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent campgrounds preview */}
            {recentCamps.length > 0 && (
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--c-slate)' }}>Recent Campgrounds</h6>
                        <button className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            style={{ fontSize: '0.78rem' }} onClick={() => onTabChange('campgrounds')}>
                            View All →
                        </button>
                    </div>
                    <div className="row g-3">
                        {recentCamps.map(c => (
                            <div key={c._id} className="col-md-4">
                                <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '0.75rem' }}>
                                    {c.images?.[0]?.url ? (
                                        <img src={c.images[0].url.replace('/upload', '/upload/w_300,h_150,c_fill')}
                                            alt={c.title} style={{ height: 120, objectFit: 'cover', width: '100%' }} />
                                    ) : (
                                        <div style={{ height: 120, background: '#e2e8f0', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>🏕️</div>
                                    )}
                                    <div className="p-2">
                                        <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>{c.title}</div>
                                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>📍 {c.location}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && campgrounds.length === 0 && (
                <div className="text-center py-5">
                    <div style={{ fontSize: '3.5rem' }}>🏕️</div>
                    <h5 className="mt-3 fw-bold">No campgrounds yet</h5>
                    <p className="text-muted">Share your favourite outdoor spot with the community.</p>
                    <Link to="/campgrounds/new" className="btn btn-primary rounded-pill px-4 mt-1">
                        + Create Your First Campground
                    </Link>
                </div>
            )}
        </div>
    );
};

/* ── My Campgrounds Tab ────────────────────────────────── */
const MyCampgroundsTab = ({ campgrounds, loading, onDelete }) => {
    const [search, setSearch] = useState('');
    const filtered = campgrounds.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="d-flex gap-3 align-items-center justify-content-between mb-4 flex-wrap">
                <div>
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--c-slate)' }}>
                        My Campgrounds
                        <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>
                            {campgrounds.length}
                        </span>
                    </h5>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Search my campgrounds…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ borderRadius: '999px', width: 220 }}
                    />
                    <Link to="/campgrounds/new" className="btn btn-primary btn-sm rounded-pill px-3">
                        + New
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="row g-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="col-md-4"><SkeletonCard /></div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5">
                    <div style={{ fontSize: '3rem' }}>{campgrounds.length === 0 ? '🏕️' : '🔍'}</div>
                    <p className="text-muted mt-3">
                        {campgrounds.length === 0
                            ? "You haven't listed any campgrounds yet."
                            : "No campgrounds match your search."}
                    </p>
                    {campgrounds.length === 0 && (
                        <Link to="/campgrounds/new" className="btn btn-primary rounded-pill px-4 mt-1">
                            + Create Your First Campground
                        </Link>
                    )}
                </div>
            ) : (
                <div className="row g-3">
                    {filtered.map(c => (
                        <div key={c._id} className="col-sm-6 col-xl-4">
                            <MyCampgroundCard camp={c} onDelete={onDelete} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Settings Tab ──────────────────────────────────────── */
const SettingsTab = ({ currentUser, setCurrentUser, showFlash }) => {
    const [email, setEmail]     = useState(currentUser.email || '');
    const [mobile, setMobile]   = useState(currentUser.mobile || '');
    const [username, setUsername] = useState(currentUser.username || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd]         = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdSubmitting, setPwdSubmitting] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() && !mobile.trim()) {
            return showFlash('danger', 'Provide either Email or Mobile Number.');
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('email', email);
            fd.append('mobile', mobile);
            fd.append('username', username);
            if (avatarFile) fd.append('avatar', avatarFile);
            const data = await updateProfile(fd);
            setCurrentUser(data.user);
            showFlash('success', 'Profile updated!');
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) return showFlash('danger', 'Passwords do not match');
        setPwdSubmitting(true);
        try {
            await updatePassword(currentPwd, newPwd);
            showFlash('success', 'Password updated!');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to update password');
        } finally {
            setPwdSubmitting(false);
        }
    };

    return (
        <div className="row g-4">
            {/* Profile info */}
            <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
                    <div className="card-body p-4">
                        <h6 className="fw-bold mb-4" style={{ color: 'var(--c-slate)' }}>
                            ✏️ Update Profile
                        </h6>

                        {/* Avatar preview */}
                        <div className="text-center mb-4">
                            <img
                                src={avatarPreview || currentUser.avatar?.url ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=2d6a4f&color=fff&size=100`}
                                alt="avatar"
                                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--c-alpine-pale)' }}
                            />
                        </div>

                        <form onSubmit={handleProfileSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold" htmlFor="s-username">Username</label>
                                <input id="s-username" type="text" className="form-control" value={username}
                                    onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={30}
                                    style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold" htmlFor="s-email">Email</label>
                                <input id="s-email" type="email" className="form-control" value={email}
                                    onChange={e => setEmail(e.target.value)} style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold" htmlFor="s-mobile">Mobile</label>
                                <input id="s-mobile" type="tel" className="form-control" value={mobile}
                                    onChange={e => setMobile(e.target.value)} style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <div className="mb-4">
                                <label className="form-label small fw-semibold" htmlFor="s-avatar">Change Avatar</label>
                                <input id="s-avatar" type="file" className="form-control" accept="image/png,image/jpeg"
                                    onChange={handleFileChange} style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <button className="btn btn-primary w-100 rounded-pill fw-semibold" disabled={submitting}>
                                {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Change password */}
            <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
                    <div className="card-body p-4">
                        <h6 className="fw-bold mb-4" style={{ color: 'var(--c-slate)' }}>
                            🔒 Change Password
                        </h6>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold" htmlFor="s-cur-pwd">Current Password</label>
                                <input id="s-cur-pwd" type="password" className="form-control" value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)} required style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold" htmlFor="s-new-pwd">New Password</label>
                                <input id="s-new-pwd" type="password" className="form-control" value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)} required minLength={6} style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <div className="mb-4">
                                <label className="form-label small fw-semibold" htmlFor="s-con-pwd">Confirm New Password</label>
                                <input id="s-con-pwd" type="password" className="form-control" value={confirmPwd}
                                    onChange={e => setConfirmPwd(e.target.value)} required minLength={6} style={{ borderRadius: '0.5rem' }} />
                            </div>
                            <button className="btn btn-danger w-100 rounded-pill fw-semibold" disabled={pwdSubmitting}>
                                {pwdSubmitting ? <><span className="spinner-border spinner-border-sm me-2" />Changing…</> : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   MAIN UserProfile PAGE
══════════════════════════════════════════════════════════ */
const TABS = [
    { id: 'overview',     label: '📊 Overview' },
    { id: 'campgrounds',  label: '🏕️ My Campgrounds' },
    { id: 'settings',     label: '⚙️ Settings' },
];

const UserProfile = () => {
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const [campgrounds, setCampgrounds] = useState([]);
    const [campLoading, setCampLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);

    /* Fetch all campgrounds and filter to current user's */
    const fetchMyCampgrounds = useCallback(async () => {
        if (!currentUser) return;
        setCampLoading(true);
        try {
            const { campgrounds: all } = await getAllCampgrounds();
            const mine = all.filter(c =>
                c.author?._id === currentUser._id || c.author === currentUser._id
            );
            setCampgrounds(mine);
        } catch {
            showFlash('danger', 'Could not load your campgrounds.');
        } finally {
            setCampLoading(false);
        }
    }, [currentUser, showFlash]);

    useEffect(() => { fetchMyCampgrounds(); }, [fetchMyCampgrounds]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await deleteCampground(deleteTarget._id);
            showFlash('success', `"${deleteTarget.title}" deleted.`);
            setCampgrounds(prev => prev.filter(c => c._id !== deleteTarget._id));
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to delete campground.');
        } finally {
            setDeleteTarget(null);
        }
    };

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    const avatarUrl = currentUser.avatar?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=2d6a4f&color=fff&size=100`;

    return (
        <div style={{ background: 'var(--c-snow)', minHeight: '100vh' }}>
            {deleteTarget && (
                <DeleteModal
                    camp={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setDeleteTarget(null)}
                />
            )}

            {/* ── Profile Header Banner ─────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
                padding: '2.5rem 0 4rem',
            }}>
                <div className="container">
                    <div className="d-flex align-items-center gap-4 flex-wrap">
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            style={{
                                width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                                border: '4px solid rgba(255,255,255,0.3)',
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <h1 style={{
                                fontFamily: 'var(--font-heading)', fontWeight: 800,
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                color: '#fff', marginBottom: '0.25rem', letterSpacing: '-0.03em',
                            }}>
                                {currentUser.username}
                            </h1>
                            {currentUser.email && (
                                <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '0.9rem' }}>
                                    ✉ {currentUser.email}
                                </p>
                            )}
                            <div className="d-flex gap-2 mt-2 flex-wrap">
                                <span style={{
                                    background: 'rgba(255,255,255,0.12)', color: '#fff',
                                    borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                                }}>
                                    {currentUser.role === 'admin' ? '🛡 Admin' : '🏕 Camper'}
                                </span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.12)', color: '#fff',
                                    borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                                }}>
                                    {campgrounds.length} campground{campgrounds.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ────────────────────────────── */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid var(--color-border)',
                position: 'sticky', top: 56, zIndex: 50,
            }}>
                <div className="container">
                    <div className="d-flex gap-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id
                                        ? '3px solid var(--c-alpine-green)'
                                        : '3px solid transparent',
                                    padding: '1rem 1.25rem',
                                    fontFamily: 'var(--font-body)',
                                    fontWeight: 600,
                                    fontSize: '0.88rem',
                                    color: activeTab === tab.id ? 'var(--c-alpine-green)' : 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'color 0.15s, border-color 0.15s',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tab Content ───────────────────────────────── */}
            <div className="container py-4">
                {activeTab === 'overview' && (
                    <OverviewTab
                        currentUser={currentUser}
                        campgrounds={campgrounds}
                        loading={campLoading}
                        onTabChange={setActiveTab}
                    />
                )}
                {activeTab === 'campgrounds' && (
                    <MyCampgroundsTab
                        campgrounds={campgrounds}
                        loading={campLoading}
                        onDelete={setDeleteTarget}
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsTab
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                        showFlash={showFlash}
                    />
                )}
            </div>
        </div>
    );
};

export default UserProfile;
