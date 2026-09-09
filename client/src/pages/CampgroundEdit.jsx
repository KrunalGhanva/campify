import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCampground, updateCampground } from '../api/campgrounds';
import { FlashContext } from '../context/FlashContext';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateCampground } from '../utils/validation';

const CampgroundEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showFlash } = useContext(FlashContext);
    const { currentUser } = useContext(AuthContext);
    
    const [campground, setCampground] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        price: '',
        description: '',
    });
    const [images, setImages] = useState(null);
    const [deleteImages, setDeleteImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchCampground = async () => {
            try {
                const data = await getCampground(id);
                if (!data.campground.author || data.campground.author._id !== currentUser?._id) {
                    showFlash('danger', 'You do not have permission to edit that campground.');
                    navigate(`/campgrounds/${id}`, { replace: true });
                    return;
                }
                setCampground(data.campground);
                setFormData({
                    title: data.campground.title,
                    location: data.campground.location,
                    price: data.campground.price,
                    description: data.campground.description,
                });
            } catch {
                showFlash('danger', 'Cannot find that campground!');
                navigate('/campgrounds');
            } finally {
                setLoading(false);
            }
        };
        fetchCampground();
    }, [id, currentUser, navigate, showFlash]);

    const handleChange = (e) => {
        const nextFormData = { ...formData, [e.target.name]: e.target.value };
        setFormData(nextFormData);
        setErrors(validateCampground(nextFormData));
    };

    const handleFileChange = (e) => {
        setImages(e.target.files);
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setDeleteImages([...deleteImages, value]);
        } else {
            setDeleteImages(deleteImages.filter(imgId => imgId !== value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateCampground(formData);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        
        const data = new FormData();
        data.append('campground[title]', formData.title);
        data.append('campground[location]', formData.location);
        data.append('campground[price]', formData.price);
        data.append('campground[description]', formData.description);
        
        if (images) {
            for (let i = 0; i < images.length; i++) {
                data.append('image', images[i]);
            }
        }
        
        deleteImages.forEach(img => {
            data.append('deleteImages[]', img);
        });

        setSubmitting(true);
        try {
            const res = await updateCampground(id, data);
            showFlash('success', 'Successfully updated campground!');
            navigate(`/campgrounds/${res.campground._id}`);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to update campground');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner label="Loading campground..." />;
    if (!campground) return null;

    return (
        <div className="row">
            <h1 className="text-center">Edit Campground</h1>
            <div className="col-md-6 offset-md-3">
                <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
                    <div className="mb-3">
                        <label className="form-label" htmlFor="title">Title</label>
                        <input className={`form-control ${errors.title ? 'is-invalid' : ''}`} type="text" id="title" name="title" maxLength="100" value={formData.title} onChange={handleChange} />
                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="location">Location</label>
                        <input className={`form-control ${errors.location ? 'is-invalid' : ''}`} type="text" id="location" name="location" maxLength="200" value={formData.location} onChange={handleChange} />
                        {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor="price">Campground Price</label>
                        <div className="input-group">
                            <span className="input-group-text" id="price-label">$</span>
                            <input type="number" min="0" step="0.01" className={`form-control ${errors.price ? 'is-invalid' : ''}`} id="price" placeholder="0.00" aria-label="price" aria-describedby="price-label" name="price" value={formData.price} onChange={handleChange} />
                            {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor="description">Description</label>
                        <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} id="description" name="description" maxLength="2000" rows="5" value={formData.description} onChange={handleChange}></textarea>
                        {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="formFileMultiple" className="form-label">Add more image(s)...</label>
                        <input className="form-control" type="file" id="formFileMultiple" name="image" accept="image/jpeg,image/png" multiple onChange={handleFileChange} />
                    </div>

                    <div className="mb-3">
                        {campground.images.map((img, i) => (
                            <div key={img._id} className="form-check-inline me-3 mb-3">
                                <img src={img.thumbnail || img.url} className="img-thumbnail campground-edit-thumbnail" alt={`Current image ${i + 1}`} />
                                <div className="form-check">
                                    <input type="checkbox" id={`image-${i}`} name="deleteImages[]" value={img.filename} onChange={handleCheckboxChange} />
                                    <label htmlFor={`image-${i}`}>Delete?</label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-3">
                        <button className="btn btn-info" disabled={submitting}>{submitting ? 'Saving…' : 'Update campground'}</button>
                    </div>
                </form>
                <Link to={`/campgrounds/${campground._id}`}>Back To Campground</Link>
            </div>
        </div>
    );
};

export default CampgroundEdit;
