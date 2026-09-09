import { Link } from 'react-router-dom';

const CampgroundCard = ({ campground }) => {
    return (
        <article className="card campground-card overflow-hidden">
            <div className="row g-0">
                <div className="col-md-4">
                    {campground.images && campground.images.length ? (
                        <img className="campground-card-image" alt={`View of ${campground.title}`} src={campground.images[0].url} />
                    ) : (
                        <div className="campground-card-image campground-image-placeholder">No photo yet</div>
                    )}
                </div>
                <div className="col-md-8">
                    <div className="card-body">
                        <h5 className="card-title">{campground.title}</h5>
                        <p className="card-text campground-card-description">{campground.description}</p>
                        <p className="card-text">
                            <small className="text-muted">{campground.location}</small>
                        </p>
                        <Link className="btn btn-primary" to={`/campgrounds/${campground._id}`}>
                            View {campground.title}
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default CampgroundCard;
