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

    const login = async (username, password) => {
        const data = await apiLogin(username, password);
        setCurrentUser(data.user);
        return data;
    };

    const register = async (email, username, password) => {
        const data = await apiRegister(email, username, password);
        setCurrentUser(data.user);
        return data;
    };

    const logout = async () => {
        await apiLogout();
        setCurrentUser(null);
    };

    if (loading) return <LoadingSpinner label="Checking your session..." fullPage />;

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
