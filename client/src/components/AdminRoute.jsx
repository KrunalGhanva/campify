import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Wraps any route that requires the logged-in user to have role === 'admin'.
 * - Not logged in  → redirect to /login (preserving destination)
 * - Logged in but not admin → redirect to /forbidden
 */
const AdminRoute = ({ children }) => {
    const { currentUser } = useContext(AuthContext);
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (currentUser.role !== 'admin') {
        return <Navigate to="/forbidden" replace />;
    }

    return children;
};

export default AdminRoute;
