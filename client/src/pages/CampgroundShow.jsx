import { useCallback, useEffect, useState, useRef, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getCampground, deleteCampground } from '../api/campgrounds';
import { AuthContext } from '../context/AuthContext';
import { FlashContext } from '../context/FlashContext';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import '../styles/stars.css';
import LoadingSpinner from '../components/LoadingSpinner';

const CampgroundShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campground, setCampground] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    
    const { currentUser } = useContext(AuthContext);
    const { showFlash } = useContext(FlashContext);
    const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const fetchCampground = useCallback(async () => {
        try {
            const data = await getCampground(id);
            setCampground(data.campground);
        } catch {
            showFlash('danger', 'Cannot find that campground!');
            navigate('/campgrounds');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, showFlash]);

    useEffect(() => {
        fetchCampground();
    }, [fetchCampground]);

    useEffect(() => {
        if (!loading && mapToken && campground && campground.geometry && mapContainerRef.current && !mapRef.current) {
            mapboxgl.accessToken = mapToken;
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/light-v10',
                center: campground.geometry.coordinates,
                zoom: 10
            });
            map.addControl(new mapboxgl.NavigationControl());

            new mapboxgl.Marker()
                .setLngLat(campground.geometry.coordinates)
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>${campground.title}</h3><p>${campground.location}</p>`)
                )
                .addTo(map);

            mapRef.current = map;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [loading, campground, mapToken]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteCampground(id);
            showFlash('success', 'Successfully deleted campground');
            navigate('/campgrounds');
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Error deleting campground');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <LoadingSpinner label="Loading campground..." />;
    if (!campground) return null;

    const images = campground.images || [];
    const reviews = campground.reviews || [];

    return (
        <div className="row g-4">
            <div className="col-lg-6">
                {images.length ? <div id="campgroundCarousel" className="carousel slide campground-carousel" data-bs-ride="carousel">
                    <div className="carousel-inner">
                        {images.map((img, i) => (
                            <div key={img._id} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                                <img src={img.url} className="d-block w-100" alt={`View of ${campground.title}`} />
                            </div>
                        ))}
                    </div>
                    {images.length > 1 && (
                        <>
                            <button className="carousel-control-prev" type="button" data-bs-target="#campgroundCarousel" data-bs-slide="prev">
                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Previous</span>
                            </button>
                            <button className="carousel-control-next" type="button" data-bs-target="#campgroundCarousel" data-bs-slide="next">
                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Next</span>
                            </button>
                        </>
                    )}
                </div> : <div className="campground-image-placeholder mb-3">No photos have been added yet.</div>}

                <div className="card mb-3">
                    <div className="card-body">
                        <h5 className="card-title">{campground.title}</h5>
                        <p className="card-text">{campground.description}</p>
                    </div>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item text-muted">{campground.location}</li>
                        <li className="list-group-item">Submitted by {campground.author?.username}</li>
                        <li className="list-group-item">${campground.price}/night</li>
                    </ul>
                    {currentUser && campground.author && campground.author._id === currentUser._id && (
                        <div className="card-body">
                            <Link className="btn btn-info" to={`/campgrounds/${campground._id}/edit`}>Edit</Link>
                            <button className="btn btn-danger ms-2" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="col-lg-6">
                {mapToken ? (
                    <div ref={mapContainerRef} className="campground-map campground-map--detail mb-3" aria-label="Location map"></div>
                ) : (
                    <div className="alert alert-warning">The map is unavailable until <code>VITE_MAPBOX_TOKEN</code> is configured.</div>
                )}
                
                {currentUser && (
                    <>
                        <h2>Leave a Review</h2>
                        <ReviewForm campgroundId={id} onReviewAdded={fetchCampground} />
                    </>
                )}

                <h2 className="h3 mt-4">Reviews</h2>
                <ReviewList reviews={reviews} campgroundId={id} onReviewDeleted={fetchCampground} />
            </div>
        </div>
    );
};

export default CampgroundShow;
