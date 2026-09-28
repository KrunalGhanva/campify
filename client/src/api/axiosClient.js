import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true
});

/**
 * Response interceptor — handles account suspension globally.
 *
 * When the server returns 403 with code === 'ACCOUNT_SUSPENDED':
 *  1. Call the backend /logout endpoint to clear the session cookie.
 *  2. Clear the in-memory auth state via a custom DOM event so
 *     AuthContext can react without a circular import.
 *  3. Redirect to /login with a query param the Login page can read
 *     to show a friendly message.
 *
 * All other errors are re-thrown so individual callers can handle them.
 */
axiosClient.interceptors.response.use(
    // Pass through successful responses unchanged
    (response) => response,

    // Handle errors
    async (error) => {
        const { response } = error;

        if (
            response?.status === 403 &&
            response?.data?.code === 'ACCOUNT_SUSPENDED'
        ) {
            // 1. Best-effort server-side session clear
            try {
                await axios.post('/api/logout', {}, { withCredentials: true });
            } catch {
                // Ignore — session may already be gone
            }

            // 2. Notify AuthContext to clear currentUser without a circular import
            window.dispatchEvent(new CustomEvent('campify:suspended'));

            // 3. Redirect to login with context
            window.location.href = '/login?reason=suspended';

            // Don't propagate — we're navigating away anyway
            return Promise.resolve({ data: null, _suspended: true });
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
