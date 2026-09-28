import { useContext, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import FlashMessage from './FlashMessage';
import '../styles/admin.css';

const NAV_LINKS = [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/users',     icon: '👥', label: 'Users' },
    { to: '/admin/campgrounds', icon: '🏕️', label: 'Campgrounds' },
    { to: '/admin/reviews',   icon: '⭐', label: 'Reviews' },
];

const AdminLayout = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        showFlash('success', 'Logged out.');
        navigate('/');
    };

    return (
        <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

            {/* ── Sidebar ──────────────────────────────────── */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar__brand">
                    <span className="admin-sidebar__logo">🏕️</span>
                    {sidebarOpen && <span className="admin-sidebar__name">Campify<sup>Admin</sup></span>}
                </div>

                <nav className="admin-sidebar__nav">
                    {NAV_LINKS.map(({ to, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
                            }
                            title={!sidebarOpen ? label : undefined}
                        >
                            <span className="admin-nav-link__icon">{icon}</span>
                            {sidebarOpen && <span className="admin-nav-link__label">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <Link
                        to="/campgrounds"
                        className="admin-nav-link"
                        title={!sidebarOpen ? 'Back to site' : undefined}
                    >
                        <span className="admin-nav-link__icon">🌐</span>
                        {sidebarOpen && <span className="admin-nav-link__label">Back to Site</span>}
                    </Link>
                </div>
            </aside>

            {/* ── Main area ────────────────────────────────── */}
            <div className="admin-main">

                {/* Top navbar */}
                <header className="admin-topbar">
                    <button
                        className="admin-topbar__toggle"
                        onClick={() => setSidebarOpen(o => !o)}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>

                    <span className="admin-topbar__title">Admin Panel</span>

                    <div className="admin-topbar__user ms-auto d-flex align-items-center gap-3">
                        <img
                            src={currentUser?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'A')}&background=6366f1&color=fff&size=36`}
                            alt="avatar"
                            className="admin-topbar__avatar"
                        />
                        <div className="d-none d-md-block lh-1">
                            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{currentUser?.username}</div>
                            <div style={{ fontSize: '0.7rem', color: '#6366f1' }}>Administrator</div>
                        </div>
                        <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Flash messages */}
                <div className="px-3 pt-2">
                    <FlashMessage />
                </div>

                {/* Page content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
