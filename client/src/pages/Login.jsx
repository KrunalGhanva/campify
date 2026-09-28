import { useState, useContext } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import AuthForm from '../components/AuthForm';
import { validateLogin } from '../utils/validation';

const Login = () => {
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const { login } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const isSuspended = searchParams.get('reason') === 'suspended';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateLogin({ loginIdentifier, password });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSubmitting(true);
        try {
            await login(loginIdentifier, password);
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
            {isSuspended && (
                <div className="alert alert-danger d-flex align-items-start gap-2 mb-3 py-2" role="alert">
                    <span style={{ fontSize: '1.1rem' }}>🚫</span>
                    <div>
                        <strong>Account suspended.</strong><br />
                        <small>Your account has been suspended by an administrator. Contact support if you believe this is a mistake.</small>
                    </div>
                </div>
            )}
            <div className="mb-3">
                <label className="form-label" htmlFor="loginIdentifier">Username, Email, or Mobile</label>
                <input className={`form-control ${errors.loginIdentifier ? 'is-invalid' : ''}`} type="text" id="loginIdentifier" name="loginIdentifier" autoFocus
                    value={loginIdentifier} onChange={e => {
                        setLoginIdentifier(e.target.value);
                        setErrors(validateLogin({ loginIdentifier: e.target.value, password }));
                    }} />
                {errors.loginIdentifier && <div className="invalid-feedback">{errors.loginIdentifier}</div>}
            </div>

            <div className="mb-3">
                <label className="form-label" htmlFor="password">Password</label>
                <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" id="password" name="password"
                    value={password} onChange={e => {
                        setPassword(e.target.value);
                        setErrors(validateLogin({ loginIdentifier, password: e.target.value }));
                    }} />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
        </AuthForm>
    );
};

export default Login;
