import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FlashContext } from '../context/FlashContext';

/* ── Contact info items ───────────────────────────────── */
const INFO_ITEMS = [
    { icon: '✉️', bg: 'rgba(45,106,79,0.18)',   label: 'Email Us',       value: 'support@campify.com'          },
    { icon: '📞', bg: 'rgba(14,165,233,0.18)',   label: 'Call Us',        value: '+1 (555) 123-4567'            },
    { icon: '📍', bg: 'rgba(232,93,4,0.18)',     label: 'Our Office',     value: '123 Trail View, Nature City, CA' },
    { icon: '🕐', bg: 'rgba(245,158,11,0.18)',   label: 'Support Hours',  value: 'Mon – Fri · 9 AM – 6 PM IST' },
];

const SUBJECTS = [
    'General Inquiry',
    'Report a Campground',
    'Account Issue',
    'Partnership',
    'Other',
];

/* ── Validation ───────────────────────────────────────── */
const validate = ({ name, email, subject, message }) => {
    const e = {};
    if (!name.trim())    e.name    = 'Name is required';
    if (!email.trim())   e.email   = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!subject)        e.subject = 'Please select a subject';
    if (!message.trim()) e.message = 'Message cannot be empty';
    return e;
};

/* ── Input with focus styling ─────────────────────────── */
const Field = ({ label, error, children }) => (
    <div style={{ marginBottom: '1.1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
            {label}
        </label>
        {children}
        {error && <p style={{ color: '#ef4444', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>{error}</p>}
    </div>
);

const baseInput = (hasError, extra = {}) => ({
    width: '100%',
    boxSizing: 'border-box',
    border: `1.5px solid ${hasError ? '#ef4444' : 'var(--color-border)'}`,
    borderRadius: '0.6rem',
    padding: '0.65rem 0.9rem',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    background: 'var(--c-snow)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    ...extra,
});

/* ── Page component ───────────────────────────────────── */
const Contact = () => {
    const { showFlash } = useContext(FlashContext);

    const [form, setForm]           = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors]       = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent]           = useState(false);
    const [focused, setFocused]     = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const focusStyle = (field, hasError) => ({
        ...baseInput(hasError),
        ...(focused === field ? {
            borderColor: hasError ? '#ef4444' : 'var(--c-alpine-green)',
            boxShadow: `0 0 0 3px ${hasError ? 'rgba(239,68,68,.1)' : 'rgba(45,106,79,.12)'}`,
        } : {}),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 900));   // simulate network
        setSubmitting(false);
        setSent(true);
        showFlash('success', "Message sent! We\u2019ll get back to you within 24 hours.");
    };

    const handleReset = () => {
        setForm({ name: '', email: '', subject: '', message: '' });
        setErrors({});
        setSent(false);
    };

    return (
        <div style={{ background: 'var(--c-snow)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

            {/* ══ HERO ══════════════════════════════════════ */}
            <section style={{
                background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
                padding: '4rem 0 3rem',
                textAlign: 'center',
            }}>
                <div className="container">
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(232,93,4,0.18)',
                        color: '#fbbf24',
                        border: '1px solid rgba(232,93,4,0.4)',
                        borderRadius: '999px',
                        padding: '0.3rem 1rem',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '1rem',
                    }}>
                        📬 Reach Out
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        marginBottom: '0.75rem',
                    }}>
                        Let's Start a Conversation
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
                        Whether you have a question, found a great campsite we're missing, or just want to say hi —
                        we read every message.
                    </p>
                </div>
            </section>

            {/* ══ MAIN ══════════════════════════════════════ */}
            <section style={{ padding: '4rem 0 5rem' }}>
                <div className="container">
                    <div className="row g-4 align-items-start">

                        {/* ── Left info panel ── */}
                        <div className="col-lg-4">
                            <div style={{
                                background: 'linear-gradient(160deg, var(--c-slate) 0%, var(--c-slate-mid) 100%)',
                                borderRadius: '1.25rem',
                                padding: '2.5rem 2rem',
                                color: '#fff',
                                position: 'sticky',
                                top: 80,
                            }}>
                                <h2 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1.4rem',
                                    fontWeight: 800,
                                    color: '#fff',
                                    letterSpacing: '-0.03em',
                                    marginBottom: '0.4rem',
                                }}>
                                    Contact Info
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                                    We're a small team with a big love for the outdoors. Don't hesitate to reach out.
                                </p>

                                {INFO_ITEMS.map((item) => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', marginBottom: '1.25rem' }}>
                                        <div style={{
                                            width: 40, height: 40,
                                            borderRadius: '0.6rem',
                                            background: item.bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.1rem',
                                            flexShrink: 0,
                                        }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 500 }}>
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.75rem 0' }} />

                                <Link
                                    to="/campgrounds"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        color: '#fbbf24',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                    }}
                                >
                                    🏕 Browse Campgrounds →
                                </Link>
                            </div>
                        </div>

                        {/* ── Right form card ── */}
                        <div className="col-lg-8">
                            <div style={{
                                background: '#fff',
                                border: '1px solid var(--color-border)',
                                borderRadius: '1.25rem',
                                padding: '2.5rem',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                            }}>
                                {sent ? (
                                    /* Success state */
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
                                        <h3 style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.4rem',
                                            fontWeight: 800,
                                            color: 'var(--c-alpine-green)',
                                            marginBottom: '0.5rem',
                                        }}>
                                            Message Sent!
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 1.5rem' }}>
                                            Thanks for reaching out, <strong>{form.name.split(' ')[0]}</strong>! We'll
                                            get back to you at <strong>{form.email}</strong> within 24 hours.
                                        </p>
                                        <button
                                            onClick={handleReset}
                                            style={{
                                                background: 'var(--c-alpine-pale)',
                                                color: 'var(--c-alpine-green)',
                                                border: 'none',
                                                borderRadius: '999px',
                                                padding: '0.65rem 1.6rem',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-body)',
                                            }}
                                        >
                                            Send Another Message
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h3 style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.35rem',
                                            fontWeight: 800,
                                            color: 'var(--c-slate)',
                                            letterSpacing: '-0.03em',
                                            marginBottom: '0.35rem',
                                        }}>
                                            Send Us a Message
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
                                            We typically respond within 24 hours on business days.
                                        </p>

                                        <form onSubmit={handleSubmit} noValidate>
                                            <div className="row g-3">
                                                {/* Name + Email */}
                                                <div className="col-sm-6">
                                                    <Field label="Full Name *" error={errors.name}>
                                                        <input
                                                            type="text" name="name" id="c-name"
                                                            placeholder="Jane Smith"
                                                            value={form.name}
                                                            onChange={handleChange}
                                                            onFocus={() => setFocused('name')}
                                                            onBlur={() => setFocused('')}
                                                            style={focusStyle('name', !!errors.name)}
                                                        />
                                                    </Field>
                                                </div>
                                                <div className="col-sm-6">
                                                    <Field label="Email Address *" error={errors.email}>
                                                        <input
                                                            type="email" name="email" id="c-email"
                                                            placeholder="jane@example.com"
                                                            value={form.email}
                                                            onChange={handleChange}
                                                            onFocus={() => setFocused('email')}
                                                            onBlur={() => setFocused('')}
                                                            style={focusStyle('email', !!errors.email)}
                                                        />
                                                    </Field>
                                                </div>
                                            </div>

                                            {/* Subject */}
                                            <Field label="Subject *" error={errors.subject}>
                                                <select
                                                    name="subject" id="c-subject"
                                                    value={form.subject}
                                                    onChange={handleChange}
                                                    onFocus={() => setFocused('subject')}
                                                    onBlur={() => setFocused('')}
                                                    style={{
                                                        ...focusStyle('subject', !!errors.subject),
                                                        appearance: 'none',
                                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'right 0.9rem center',
                                                        paddingRight: '2.2rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <option value="">Select a subject…</option>
                                                    {SUBJECTS.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </Field>

                                            {/* Message */}
                                            <Field label="Message *" error={errors.message}>
                                                <textarea
                                                    name="message" id="c-message" rows={5}
                                                    placeholder="Tell us everything…"
                                                    value={form.message}
                                                    onChange={handleChange}
                                                    onFocus={() => setFocused('message')}
                                                    onBlur={() => setFocused('')}
                                                    style={{ ...focusStyle('message', !!errors.message), resize: 'vertical', minHeight: 130 }}
                                                />
                                            </Field>

                                            {/* Submit */}
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--c-alpine-green)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '999px',
                                                    padding: '0.85rem',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    fontFamily: 'var(--font-body)',
                                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                                    opacity: submitting ? 0.75 : 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    transition: 'background 0.2s',
                                                }}
                                                onMouseEnter={e => !submitting && (e.currentTarget.style.background = 'var(--c-alpine-light)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--c-alpine-green)')}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span style={{
                                                            width: 16, height: 16,
                                                            border: '2px solid rgba(255,255,255,0.4)',
                                                            borderTopColor: '#fff',
                                                            borderRadius: '50%',
                                                            display: 'inline-block',
                                                            animation: 'contact-spin 0.7s linear infinite',
                                                        }} />
                                                        Sending…
                                                    </>
                                                ) : '📨 Send Message'}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <style>{`@keyframes contact-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Contact;
