import { useRouteError, Link } from "react-router-dom";

const ErrorPage = () => {
    const error = useRouteError();
    console.error(error);

    return (
        <div className="row">
            <div className="col-6 offset-3">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Oops! Something went wrong</h4>
                    <p>{error?.statusText || error?.message || 'Page not found'}</p>
                    <hr />
                    <Link className="btn btn-primary" to="/">Return Home</Link>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
