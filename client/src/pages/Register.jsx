import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import AuthForm from '../components/AuthForm';
import { validateRegistration } from '../utils/validation';

const Register = () => {
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const { register } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateRegistration({ email, mobile, username, password });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSubmitting(true);
        try {
            await register(email, mobile, username, password);
            showFlash('success', 'Welcome to Campify!');
            navigate('/campgrounds');
        } catch (err) {
            const response = err.response?.data;
            if (response?.code === 'EMAIL_IN_USE') {
                setErrors((current) => ({ ...current, email: 'This email is already registered.' }));
            }
            if (response?.code === 'MOBILE_IN_USE') {
                setErrors((current) => ({ ...current, mobile: 'This mobile number is already registered.' }));
            }
            if (response?.code === 'USERNAME_IN_USE') {
                setErrors((current) => ({ ...current, username: 'This username is already taken.' }));
            }
            showFlash('danger', response?.error || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthForm 
            title="Register" 
            onSubmit={handleSubmit} 
            linkTo="/login" 
            linkText="Already have an account? Login here"
            submitting={submitting}
        >
            <div className="mb-3">
                <label className="form-label" htmlFor="username">Username</label>
                <input className={`form-control ${errors.username ? 'is-invalid' : ''}`} type="text" id="username" name="username" maxLength="30" autoFocus
                    value={username} onChange={e => {
                        setUsername(e.target.value);
                        setErrors(validateRegistration({ email, mobile, username: e.target.value, password }));
                    }} />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>
            
            <p className="text-muted small mb-2 mt-4 text-center">Provide an Email OR Mobile Number (or both)</p>
            
            <div className="mb-3">
                <label className="form-label" htmlFor="email">Email</label>
                <input className={`form-control ${errors.email ? 'is-invalid' : ''}`} type="email" id="email" name="email"
                    value={email} onChange={e => {
                        setEmail(e.target.value);
                        setErrors(validateRegistration({ email: e.target.value, mobile, username, password }));
                    }} />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="mobile">Mobile Number</label>
                <input className={`form-control ${errors.mobile ? 'is-invalid' : ''}`} type="tel" id="mobile" name="mobile"
                    value={mobile} onChange={e => {
                        setMobile(e.target.value);
                        setErrors(validateRegistration({ email, mobile: e.target.value, username, password }));
                    }} />
                {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="password">Password</label>
                <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" id="password" name="password"
                    value={password} onChange={e => {
                        setPassword(e.target.value);
                        setErrors(validateRegistration({ email, mobile, username, password: e.target.value }));
                    }} />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
        </AuthForm>
    );
};

export default Register;
