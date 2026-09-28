import { createContext, useState, useEffect } from 'react';
import { getCurrentUser, login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';
import LoadingSpinner from '../components/LoadingSpinner';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await getCurrentUser();
                setCurrentUser(data.user);
            } catch {
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // Listen for the suspension event fired by the Axios interceptor
    useEffect(() => {
        const handleSuspended = () => setCurrentUser(null);
        window.addEventListener('campify:suspended', handleSuspended);
        return () => window.removeEventListener('campify:suspended', handleSuspended);
    }, []);

    const login = async (loginIdentifier, password) => {
        const data = await apiLogin(loginIdentifier, password);
        setCurrentUser(data.user);
        return data;
    };

    const register = async (email, mobile, username, password) => {
        const data = await apiRegister(email, mobile, username, password);
        setCurrentUser(data.user);
        return data;
    };

    const logout = async () => {
        await apiLogout();
        setCurrentUser(null);
    };

    if (loading) return <LoadingSpinner label="Checking your session..." fullPage />;

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
