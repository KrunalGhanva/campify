import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCampground } from '../api/campgrounds';
import { FlashContext } from '../context/FlashContext';
import { validateCampground } from '../utils/validation';

const CampgroundNew = () => {
    const navigate = useNavigate();
    const { showFlash } = useContext(FlashContext);
    
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        price: '',
        description: '',
    });
    const [images, setImages] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const nextFormData = { ...formData, [e.target.name]: e.target.value };
        setFormData(nextFormData);
        setErrors(validateCampground(nextFormData));
    };

    const handleFileChange = (e) => {
        setImages(e.target.files);
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

        setSubmitting(true);
        try {
            const res = await createCampground(data);
            showFlash('success', 'Successfully made a new campground!');
            navigate(`/campgrounds/${res.campground._id}`);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to create campground');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="row">
            <h1 className="text-center">New Campground</h1>
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
                        <label htmlFor="formFileMultiple" className="form-label">Choose image(s)...</label>
                        <input className="form-control" type="file" id="formFileMultiple" name="image" accept="image/jpeg,image/png" multiple onChange={handleFileChange} />
                    </div>

                    <div className="mb-3">
                        <button className="btn btn-success" disabled={submitting}>{submitting ? 'Creating…' : 'Add campground'}</button>
                    </div>
                </form>
                <Link to="/campgrounds">All Campgrounds</Link>
            </div>
        </div>
    );
};

export default CampgroundNew;
