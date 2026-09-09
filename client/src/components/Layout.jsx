import Navbar from './Navbar';
import Footer from './Footer';
import FlashMessage from './FlashMessage';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="d-flex flex-column vh-100">
            <Navbar />
            <main className="container mt-5 mb-5 flex-grow-1">
                <FlashMessage />
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
