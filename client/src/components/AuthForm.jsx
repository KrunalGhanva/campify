import { Link } from 'react-router-dom';

const AuthForm = ({ title, onSubmit, children, linkTo, linkText, submitting = false }) => {
    return (
        <div className="container auth-page d-flex justify-content-center align-items-center py-5">
            <div className="row w-100">
                <div className="col-md-8 offset-md-2 col-xl-4 offset-xl-4 col-lg-6 offset-lg-3">
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1571863533956-01c88e79957e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1267&q=80"
                            alt="" className="card-img-top auth-form-image" style={{ height: '200px', objectFit: 'cover' }} />
                        <div className="card-body p-5">
                            <h3 className="card-title text-center fw-bold text-primary mb-4">{title}</h3>
                            <form onSubmit={onSubmit} noValidate>
                                {children}
                                <button className="btn btn-primary btn-lg rounded-pill w-100 mt-4 shadow-sm fw-bold" disabled={submitting}>
                                    {submitting ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                                    {submitting ? `${title}…` : title}
                                </button>
                            </form>
                            <div className="mt-4 text-center">
                                <Link to={linkTo} className="text-decoration-none text-secondary fw-semibold">
                                    {linkText} <i className="fa-solid fa-arrow-right ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
