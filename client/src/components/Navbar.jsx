import { useContext, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';

const Navbar = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            showFlash('success', 'See you on the trail! 👋');
            navigate('/');
        } catch {
            showFlash('danger', 'Error logging out');
        }
    };

    const avatarUrl = currentUser?.avatar?.url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'U')}&background=2d6a4f&color=fff&size=32`;

    return (
        <nav
            className="navbar sticky-top navbar-expand-lg navbar-dark"
            style={{
                background: scrolled
                    ? 'rgba(27,40,56,0.97)'
                    : 'rgba(27,40,56,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
                boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.25)' : 'none',
            }}
        >
            <div className="container-fluid px-4">
                {/* Brand */}
                <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                    <span style={{
                        fontSize: '1.5rem',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: '#fff',
                    }}>
                        ⛰ Camp<span style={{ color: 'var(--c-orange)' }}>ify</span>
                    </span>
                </Link>

                {/* Toggler */}
                <button
                    className="navbar-toggler border-0"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarMain"
                    aria-controls="navbarMain"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon" />
                </button>

                <div className="collapse navbar-collapse" id="navbarMain">
                    {/* Left links */}
                    <ul className="navbar-nav me-auto gap-1">
                        <li className="nav-item">
                            <NavLink className="nav-link px-3 py-2 rounded-2" to="/campgrounds"
                                style={({ isActive }) => isActive ? { color: '#fff', background: 'rgba(255,255,255,0.1)' } : {}}>
                                🏕 Campgrounds
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link px-3 py-2 rounded-2" to="/about"
                                style={({ isActive }) => isActive ? { color: '#fff', background: 'rgba(255,255,255,0.1)' } : {}}>
                                About
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link px-3 py-2 rounded-2" to="/contact"
                                style={({ isActive }) => isActive ? { color: '#fff', background: 'rgba(255,255,255,0.1)' } : {}}>
                                Contact
                            </NavLink>
                        </li>
                        {currentUser && (
                            <li className="nav-item">
                                <NavLink className="nav-link px-3 py-2 rounded-2" to="/campgrounds/new"
                                    style={({ isActive }) => isActive ? { color: '#fff', background: 'rgba(255,255,255,0.1)' } : {}}>
                                    + New Campground
                                </NavLink>
                            </li>
                        )}
                    </ul>

                    {/* Right: auth */}
                    <ul className="navbar-nav align-items-lg-center gap-2">
                        {!currentUser ? (
                            <>
                                <li className="nav-item">
                                    <NavLink className="nav-link px-3" to="/login">Login</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink
                                        to="/register"
                                        className="btn btn-sm px-4 py-2 fw-semibold"
                                        style={{
                                            background: 'var(--c-orange)',
                                            color: '#fff',
                                            borderRadius: '999px',
                                            textDecoration: 'none',
                                            border: 'none',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Get Started
                                    </NavLink>
                                </li>
                            </>
                        ) : (
                            <>
                                {/* Admin badge */}
                                {currentUser.role === 'admin' && (
                                    <li className="nav-item">
                                        <NavLink
                                            to="/admin/dashboard"
                                            className="nav-link px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                                            style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600 }}
                                        >
                                            🛡 Admin
                                        </NavLink>
                                    </li>
                                )}

                                {/* User avatar + name */}
                                <li className="nav-item">
                                    <NavLink
                                        to="/profile"
                                        className="nav-link d-flex align-items-center gap-2 px-2 py-1 rounded-2"
                                        style={({ isActive }) => ({
                                            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        })}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt="avatar"
                                            style={{
                                                width: 32, height: 32,
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                            }}
                                        />
                                        <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                                            {currentUser.username}
                                        </span>
                                    </NavLink>
                                </li>

                                {/* Logout */}
                                <li className="nav-item">
                                    <button
                                        className="btn btn-sm btn-outline-light px-3 rounded-pill"
                                        onClick={handleLogout}
                                        style={{ fontSize: '0.82rem' }}
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
