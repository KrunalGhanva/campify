const LoadingSpinner = ({ label = 'Loading...', fullPage = false }) => (
    <div className={`d-flex flex-column align-items-center justify-content-center gap-3 ${fullPage ? 'min-vh-100' : 'py-5'}`} role="status">
        <div className="spinner-border text-primary" aria-hidden="true"></div>
        <span className="visually-hidden">{label}</span>
        <span className="text-muted">{label}</span>
    </div>
);

export default LoadingSpinner;
