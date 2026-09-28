import { Link } from 'react-router-dom';

const Forbidden = () => (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <div style={{ fontSize: '5rem' }}>🚫</div>
        <h1 className="mt-3">403 — Access Denied</h1>
        <p className="text-muted">You do not have permission to view this page.</p>
        <Link to="/" className="btn btn-primary mt-2">Go Home</Link>
    </div>
);

export default Forbidden;
