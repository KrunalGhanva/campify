import { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';

const Navbar = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            showFlash('success', 'Goodbye!');
            navigate('/campgrounds');
        } catch {
            showFlash('danger', 'Error logging out');
        }
    };

    return (
        <nav className="navbar sticky-top navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Campify</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
                    aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav">
                        <NavLink className="nav-link" to="/">Home</NavLink>
                        <NavLink className="nav-link" to="/campgrounds">Campgrounds</NavLink>
                        {currentUser && (
                            <NavLink className="nav-link" to="/campgrounds/new">New Campground</NavLink>
                        )}
                    </div>
                    <div className="navbar-nav ms-auto">
                        {!currentUser ? (
                            <>
                                <NavLink className="nav-link" to="/login">Login</NavLink>
                                <NavLink className="nav-link" to="/register">Register</NavLink>
                            </>
                        ) : (
                            <>
                                <span className="navbar-text text-white-50 me-2">Signed in as {currentUser.username}</span>
                                <button className="nav-link btn btn-link text-start" onClick={handleLogout}>Logout</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
