import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import '../styles/home.css';

const Home = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            showFlash('success', 'Goodbye!');
            navigate('/campgrounds');
        } catch {
            showFlash('danger', 'Could not log out. Please try again.');
            navigate('/campgrounds');
        }
    };

    return (
        <div className="d-flex text-center text-white bg-dark home-container" style={{ height: '100vh', width: '100vw' }}>
            <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
                <header className="mb-auto">
                    <div>
                        <h3 className="float-md-start mb-0">Campify</h3>
                        <nav className="nav nav-masthead justify-content-center float-md-end">
                            <Link className="nav-link active" aria-current="page" to="/">Home</Link>
                            <Link className="nav-link" to="/campgrounds">Campgrounds</Link>
                            {!currentUser ? (
                                <>
                                    <Link className="nav-link" to="/login">Login</Link>
                                    <Link className="nav-link" to="/register">Register</Link>
                                </>
                            ) : (
                                <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                            )}
                        </nav>
                    </div>
                </header>
                <main className="px-3 m-auto">
                    <h1>Campify</h1>
                    <p className="lead"> Welcome to Campify! <br /> Jump right in and explore our many campgrounds. <br />
                        Feel free to share some of your own and comment on others!</p>
                    <Link to="/campgrounds" className="btn btn-lg btn-secondary fw-bold border-white bg-white text-dark">
                        View Campgrounds
                    </Link>
                </main>

                <footer className="mt-auto text-white-50">
                    <p>&copy; Campify 2026 </p>
                </footer>
            </div>
        </div>
    );
};

export default Home;
