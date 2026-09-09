import { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import AuthForm from '../components/AuthForm';
import { validateLogin } from '../utils/validation';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateLogin({ username, password });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSubmitting(true);
        try {
            await login(username, password);
            showFlash('success', 'Welcome back!');
            const redirectTo = location.state?.from?.pathname || '/campgrounds';
            navigate(redirectTo, { replace: true });
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Invalid username or password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthForm 
            title="Login" 
            onSubmit={handleSubmit} 
            linkTo="/register" 
            linkText="Register here"
            submitting={submitting}
        >
            <div className="mb-3">
                <label className="form-label" htmlFor="username">Username</label>
                <input className={`form-control ${errors.username ? 'is-invalid' : ''}`} type="text" id="username" name="username" autoFocus
                    value={username} onChange={e => {
                        setUsername(e.target.value);
                        setErrors(validateLogin({ username: e.target.value, password }));
                    }} />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>

            <div className="mb-3">
                <label className="form-label" htmlFor="password">Password</label>
                <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" id="password" name="password"
                    value={password} onChange={e => {
                        setPassword(e.target.value);
                        setErrors(validateLogin({ username, password: e.target.value }));
                    }} />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
        </AuthForm>
    );
};

export default Login;
