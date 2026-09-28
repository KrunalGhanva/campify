import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCampground, updateCampground } from '../api/campgrounds';
import { FlashContext } from '../context/FlashContext';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateCampground } from '../utils/validation';

const CampgroundEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showFlash }   = useContext(FlashContext);
    const { currentUser } = useContext(AuthContext);

    const [campground, setCampground]     = useState(null);
    const [loading, setLoading]           = useState(true);
    const [formData, setFormData]         = useState({ title: '', location: '', price: '', description: '' });
    const [newImages, setNewImages]       = useState([]);
    const [newPreviews, setNewPreviews]   = useState([]);
    const [deleteImages, setDeleteImages] = useState([]);
    const [errors, setErrors]             = useState({});
    const [submitting, setSubmitting]     = useState(false);
    const [focused, setFocused]           = useState('');

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
                    title:       data.campground.title,
                    location:    data.campground.location,
                    price:       data.campground.price,
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
        const next = { ...formData, [e.target.name]: e.target.value };
        setFormData(next);
        setErrors(validateCampground(next));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(files);
        setNewPreviews(files.map(f => URL.createObjectURL(f)));
    };

    const removeNewPreview = (idx) => {
        setNewImages(prev => prev.filter((_, i) => i !== idx));
        setNewPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const toggleDeleteImage = (filename) => {
        setDeleteImages(prev =>
            prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
        );
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
        newImages.forEach(f => data.append('image', f));
        deleteImages.forEach(fn => data.append('deleteImages[]', fn));

        setSubmitting(true);
        try {
            const res = await updateCampground(id, data);
            showFlash('success', 'Campground updated!');
            navigate(`/campgrounds/${res.campground._id}`);
        } catch (err) {
            showFlash('danger', err.response?.data?.error || 'Failed to update campground');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)     return <LoadingSpinner label="Loading campground..." />;
    if (!campground) return null;

    /* ── Shared input style ── */
    const inputStyle = (field, hasError) => ({
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${hasError ? '#ef4444' : focused === field ? 'var(--c-alpine-green)' : 'var(--color-border)'}`,
        borderRadius: '0.6rem',
        padding: '0.65rem 0.9rem',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        background: 'var(--c-snow)',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: focused === field ? `0 0 0 3px ${hasError ? 'rgba(239,68,68,.1)' : 'rgba(45,106,79,.12)'}` : 'none',
    });

    const Field = ({ label, id: fid, error, children }) => (
        <div style={{ marginBottom: '1.2rem' }}>
            <label htmlFor={fid} style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                {label}
            </label>
            {children}
            {error && <p style={{ color: '#ef4444', fontSize: '0.73rem', margin: '0.3rem 0 0' }}>{error}</p>}
        </div>
    );

    return (
        <div style={{ minHeight: '80vh', background: 'var(--c-snow)' }}>
            {/* ── Header Banner ── */}
            <div style={{
                background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
                padding: '3rem 0 2.5rem',
                marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
                marginBottom: '2.5rem',
            }}>
                <div className="container">
                    <div style={{
                        display: 'inline-block', background: 'rgba(232,93,4,0.18)', color: '#fbbf24',
                        border: '1px solid rgba(232,93,4,0.35)', borderRadius: '999px',
                        padding: '0.25rem 0.9rem', fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>✏ Edit Listing</div>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 900,
                        fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#fff',
                        letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                    }}>
                        Edit: {campground.title}
                    </h1>
                </div>
            </div>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-7">
                        <div style={{
                            background: '#fff', border: '1px solid var(--color-border)',
                            borderRadius: '1.25rem', padding: '2.5rem',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                        }}>
                            <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">

                                <Field label="Campground Title *" id="title" error={errors.title}>
                                    <input
                                        id="title" name="title" type="text" maxLength="100"
                                        value={formData.title} onChange={handleChange}
                                        onFocus={() => setFocused('title')} onBlur={() => setFocused('')}
                                        style={inputStyle('title', !!errors.title)}
                                    />
                                </Field>

                                <Field label="Location *" id="location" error={errors.location}>
                                    <input
                                        id="location" name="location" type="text" maxLength="200"
                                        value={formData.location} onChange={handleChange}
                                        onFocus={() => setFocused('location')} onBlur={() => setFocused('')}
                                        style={inputStyle('location', !!errors.location)}
                                    />
                                </Field>

                                <Field label="Price per Night *" id="price" error={errors.price}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 600 }}>$</span>
                                        <input
                                            id="price" name="price" type="number" min="0" step="0.01"
                                            value={formData.price} onChange={handleChange}
                                            onFocus={() => setFocused('price')} onBlur={() => setFocused('')}
                                            style={{ ...inputStyle('price', !!errors.price), paddingLeft: '1.7rem' }}
                                        />
                                    </div>
                                </Field>

                                <Field label="Description *" id="description" error={errors.description}>
                                    <textarea
                                        id="description" name="description" rows={5} maxLength="2000"
                                        value={formData.description} onChange={handleChange}
                                        onFocus={() => setFocused('description')} onBlur={() => setFocused('')}
                                        style={{ ...inputStyle('description', !!errors.description), resize: 'vertical', minHeight: 120 }}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0', textAlign: 'right' }}>
                                        {formData.description.length}/2000
                                    </p>
                                </Field>

                                {/* ── Existing images ── */}
                                {campground.images?.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.6rem' }}>
                                            Current Photos — check to remove
                                        </label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                            {campground.images.map((img, i) => {
                                                const marked = deleteImages.includes(img.filename);
                                                return (
                                                    <div
                                                        key={img._id}
                                                        onClick={() => toggleDeleteImage(img.filename)}
                                                        style={{
                                                            position: 'relative', width: 80, height: 80,
                                                            borderRadius: '0.5rem', overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            border: marked ? '2.5px solid #ef4444' : '2.5px solid transparent',
                                                            transition: 'border-color 0.15s',
                                                            opacity: marked ? 0.55 : 1,
                                                        }}
                                                    >
                                                        <img
                                                            src={(img.thumbnail || img.url).replace('/upload', '/upload/w_160,h_160,c_fill')}
                                                            alt={`Image ${i + 1}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                        />
                                                        {marked && (
                                                            <div style={{
                                                                position: 'absolute', inset: 0,
                                                                background: 'rgba(239,68,68,0.25)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '1.4rem',
                                                            }}>🗑</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {deleteImages.length > 0 && (
                                            <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.4rem 0 0' }}>
                                                {deleteImages.length} photo{deleteImages.length > 1 ? 's' : ''} will be removed on save.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── Add new photos ── */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                                        Add New Photos
                                    </label>
                                    <label
                                        htmlFor="formFileMultiple"
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            border: '2px dashed var(--color-border)', borderRadius: '0.75rem',
                                            padding: '1.25rem', cursor: 'pointer', background: 'var(--c-snow)',
                                            transition: 'border-color 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-alpine-green)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                    >
                                        <span style={{ fontSize: '1.8rem' }}>📸</span>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                                            Click to upload additional photos
                                        </span>
                                    </label>
                                    <input
                                        id="formFileMultiple" name="image" type="file"
                                        accept="image/jpeg,image/png" multiple
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    {newPreviews.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            {newPreviews.map((url, i) => (
                                                <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                                                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                                    <button
                                                        type="button" onClick={() => removeNewPreview(i)}
                                                        style={{
                                                            position: 'absolute', top: -6, right: -6,
                                                            width: 20, height: 20, borderRadius: '50%',
                                                            background: '#ef4444', color: '#fff', border: 'none',
                                                            fontSize: '0.65rem', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, lineHeight: 1,
                                                        }}
                                                    >✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Submit ── */}
                                <button
                                    type="submit" disabled={submitting}
                                    style={{
                                        width: '100%', background: 'var(--c-alpine-green)', color: '#fff',
                                        border: 'none', borderRadius: '999px', padding: '0.85rem',
                                        fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-body)',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        opacity: submitting ? 0.75 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => !submitting && (e.currentTarget.style.background = 'var(--c-alpine-light)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--c-alpine-green)')}
                                >
                                    {submitting ? (
                                        <>
                                            <span style={{
                                                width: 16, height: 16,
                                                border: '2px solid rgba(255,255,255,.4)',
                                                borderTopColor: '#fff', borderRadius: '50%',
                                                display: 'inline-block',
                                                animation: 'edit-spin 0.7s linear infinite',
                                            }} />
                                            Saving…
                                        </>
                                    ) : '💾 Save Changes'}
                                </button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                                <Link to={`/campgrounds/${campground._id}`} style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                                    ← Cancel & go back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes edit-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default CampgroundEdit;
