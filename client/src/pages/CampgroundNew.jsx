import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCampground } from '../api/campgrounds';
import { FlashContext } from '../context/FlashContext';
import { validateCampground } from '../utils/validation';

const CampgroundNew = () => {
    const navigate = useNavigate();
    const { showFlash } = useContext(FlashContext);

    const [formData, setFormData] = useState({ title: '', location: '', price: '', description: '' });
    const [images, setImages]     = useState([]);
    const [previews, setPreviews] = useState([]);
    const [errors, setErrors]     = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const next = { ...formData, [e.target.name]: e.target.value };
        setFormData(next);
        setErrors(validateCampground(next));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviews(urls);
    };

    const removePreview = (idx) => {
        const newFiles = images.filter((_, i) => i !== idx);
        const newUrls  = previews.filter((_, i) => i !== idx);
        setImages(newFiles);
        setPreviews(newUrls);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateCampground(formData);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        const data = new FormData();
        data.append('campground[title]',       formData.title);
        data.append('campground[location]',    formData.location);
        data.append('campground[price]',       formData.price);
        data.append('campground[description]', formData.description);
        images.forEach(f => data.append('image', f));

        setSubmitting(true);
        try {
            const res = await createCampground(data);
            showFlash('success', 'Campground created!');
            navigate(`/campgrounds/${res.campground._id}`);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to create campground');
        } finally {
            setSubmitting(false);
        }
    };

    /* Field component */
    const Field = ({ label, id, error, children }) => (
        <div style={{ marginBottom: '1.2rem' }}>
            <label htmlFor={id} style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                {label}
            </label>
            {children}
            {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem', margin: 0 }}>{error}</p>}
        </div>
    );

    const inputStyle = (hasError) => ({
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${hasError ? '#ef4444' : 'var(--color-border)'}`,
        borderRadius: '0.6rem', padding: '0.65rem 0.9rem',
        fontSize: '0.9rem', fontFamily: 'var(--font-body)',
        color: 'var(--color-text)', background: 'var(--c-snow)',
        outline: 'none', transition: 'border-color 0.15s',
    });

    return (
        <div style={{ minHeight: '80vh', background: 'var(--c-snow)' }}>
            {/* Header banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
                padding: '3rem 0 2.5rem',
                marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
                marginBottom: '2.5rem',
            }}>
                <div className="container">
                    <div style={{
                        display: 'inline-block', background: 'rgba(232,93,4,0.2)', color: '#fbbf24',
                        border: '1px solid rgba(232,93,4,0.35)', borderRadius: '999px',
                        padding: '0.25rem 0.9rem', fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>🏕 New Listing</div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
                        Add a New Campground
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                        Share a great spot with the Campify community.
                    </p>
                </div>
            </div>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-7">
                        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '1.25rem', padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

                            <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
                                <Field label="Campground Title *" id="title" error={errors.title}>
                                    <input
                                        id="title" name="title" type="text" maxLength="100"
                                        placeholder="e.g. Blue Ridge Summit Camp"
                                        value={formData.title} onChange={handleChange}
                                        style={inputStyle(!!errors.title)}
                                        onFocus={e => e.target.style.borderColor = 'var(--c-alpine-green)'}
                                        onBlur={e => e.target.style.borderColor = errors.title ? '#ef4444' : 'var(--color-border)'}
                                    />
                                </Field>

                                <Field label="Location *" id="location" error={errors.location}>
                                    <input
                                        id="location" name="location" type="text" maxLength="200"
                                        placeholder="e.g. Asheville, North Carolina"
                                        value={formData.location} onChange={handleChange}
                                        style={inputStyle(!!errors.location)}
                                        onFocus={e => e.target.style.borderColor = 'var(--c-alpine-green)'}
                                        onBlur={e => e.target.style.borderColor = errors.location ? '#ef4444' : 'var(--color-border)'}
                                    />
                                </Field>

                                <Field label="Price per Night *" id="price" error={errors.price}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 600 }}>$</span>
                                        <input
                                            id="price" name="price" type="number" min="0" step="0.01"
                                            placeholder="0.00"
                                            value={formData.price} onChange={handleChange}
                                            style={{ ...inputStyle(!!errors.price), paddingLeft: '1.7rem' }}
                                            onFocus={e => e.target.style.borderColor = 'var(--c-alpine-green)'}
                                            onBlur={e => e.target.style.borderColor = errors.price ? '#ef4444' : 'var(--color-border)'}
                                        />
                                    </div>
                                </Field>

                                <Field label="Description *" id="description" error={errors.description}>
                                    <textarea
                                        id="description" name="description" rows="5" maxLength="2000"
                                        placeholder="Describe the site — terrain, facilities, best season, what makes it special…"
                                        value={formData.description} onChange={handleChange}
                                        style={{ ...inputStyle(!!errors.description), resize: 'vertical', minHeight: 120 }}
                                        onFocus={e => e.target.style.borderColor = 'var(--c-alpine-green)'}
                                        onBlur={e => e.target.style.borderColor = errors.description ? '#ef4444' : 'var(--color-border)'}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.3rem 0 0', textAlign: 'right' }}>
                                        {formData.description.length}/2000
                                    </p>
                                </Field>

                                {/* Image upload */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                                        Photos
                                    </label>
                                    <label
                                        htmlFor="formFileMultiple"
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            border: '2px dashed var(--color-border)', borderRadius: '0.75rem',
                                            padding: '1.5rem', cursor: 'pointer', background: 'var(--c-snow)',
                                            transition: 'border-color 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-alpine-green)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                    >
                                        <span style={{ fontSize: '2rem' }}>📸</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                                            Click to upload photos
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>PNG or JPG, multiple allowed</span>
                                    </label>
                                    <input
                                        id="formFileMultiple" name="image" type="file"
                                        accept="image/jpeg,image/png" multiple
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />

                                    {/* Preview grid */}
                                    {previews.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            {previews.map((url, i) => (
                                                <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                                                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                                    <button
                                                        type="button" onClick={() => removePreview(i)}
                                                        style={{
                                                            position: 'absolute', top: -6, right: -6,
                                                            width: 20, height: 20, borderRadius: '50%',
                                                            background: '#ef4444', color: '#fff', border: 'none',
                                                            fontSize: '0.65rem', cursor: 'pointer', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                                                        }}
                                                    >✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit" disabled={submitting}
                                    style={{
                                        width: '100%', background: 'var(--c-alpine-green)', color: '#fff',
                                        border: 'none', borderRadius: '999px', padding: '0.85rem',
                                        fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-body)',
                                        cursor: 'pointer', opacity: submitting ? 0.75 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => !submitting && (e.currentTarget.style.background = 'var(--c-alpine-light)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--c-alpine-green)')}
                                >
                                    {submitting ? (
                                        <>
                                            <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                            Creating…
                                        </>
                                    ) : '🏕 Create Campground'}
                                </button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                                <Link to="/campgrounds" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                                    ← Back to all campgrounds
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default CampgroundNew;
