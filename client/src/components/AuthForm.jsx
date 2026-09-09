import { Link } from 'react-router-dom';

const AuthForm = ({ title, onSubmit, children, linkTo, linkText, submitting = false }) => {
    return (
        <div className="container auth-page d-flex justify-content-center align-items-center">
            <div className="row w-100">
                <div className="col-md-6 offset-md-3 col-xl-4 offset-xl-4">
                    <div className="card shadow">
                        <img src="https://images.unsplash.com/photo-1571863533956-01c88e79957e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1267&q=80"
                            alt="" className="card-img-top auth-form-image" />
                        <div className="card-body">
                            <h5 className="card-title">{title}</h5>
                            <form onSubmit={onSubmit} noValidate>
                                {children}
                                <button className="btn btn-success w-100 mt-3" disabled={submitting}>
                                    {submitting ? `${title}…` : title}
                                </button>
                            </form>
                            <div className="mt-3 text-center">
                                <Link to={linkTo}>{linkText}</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
