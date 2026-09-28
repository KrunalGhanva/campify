import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Hover-lift card wrapper ──────────────────────────── */
const HoverCard = ({ style, children }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            style={{
                ...style,
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hovered
                    ? '0 12px 32px rgba(0,0,0,0.10)'
                    : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </div>
    );
};

/* ── Data ─────────────────────────────────────────────── */
const stats = [
    { icon: '🏕️', value: '300+',   label: 'Verified Campsites' },
    { icon: '😊', value: '1,200+', label: 'Active Campers'      },
    { icon: '⭐', value: '4.8',    label: 'Average Rating'      },
    { icon: '📍', value: '50+',    label: 'Locations Mapped'    },
];

const values = [
    {
        icon: '✅',
        bg: 'rgba(45,106,79,0.10)',
        title: 'Verified Reviews',
        body: 'Every review is from a real camper who visited the site. No bots, no fake ratings — just honest community opinions.',
    },
    {
        icon: '📍',
        bg: 'rgba(14,165,233,0.10)',
        title: 'GPS Coordinates',
        body: 'Every campground is geocoded with Mapbox so you always know exactly where you\'re headed before you pack your gear.',
    },
    {
        icon: '🌿',
        bg: 'rgba(22,163,74,0.10)',
        title: 'Eco-Friendly Focus',
        body: 'We promote low-impact camping and leave-no-trace principles in all our listings and community guidelines.',
    },
    {
        icon: '📸',
        bg: 'rgba(232,93,4,0.10)',
        title: 'Real Photo Galleries',
        body: 'Browse authentic photos uploaded by site owners and fellow visitors — see exactly what you\'re getting.',
    },
    {
        icon: '🗺',
        bg: 'rgba(99,102,241,0.10)',
        title: 'Interactive Maps',
        body: 'Explore all sites on a live clustered Mapbox map — no guessing, just discovering your next adventure.',
    },
    {
        icon: '🔒',
        bg: 'rgba(239,68,68,0.10)',
        title: 'Secure & Trusted',
        body: 'Helmet, Joi validation, MongoDB sanitization and session-backed auth keep your data safe at every step.',
    },
];

const checklist = [
    'Community-driven, honest campground reviews',
    'Real photos uploaded by fellow campers',
    'Precise GPS-mapped locations via Mapbox',
    'Free to browse — always',
];

/* ── Page ─────────────────────────────────────────────── */
const About = () => (
    <div style={{ background: 'var(--c-snow)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

        {/* ══ HERO ══════════════════════════════════════════ */}
        <section style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
            padding: '5rem 0 4rem',
        }}>
            <div className="container">
                <div className="row align-items-center g-5">
                    {/* Text */}
                    <div className="col-lg-6">
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
                            marginBottom: '1.2rem',
                        }}>
                            🌿 Our Story
                        </div>
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                            fontWeight: 900,
                            color: '#fff',
                            lineHeight: 1.1,
                            letterSpacing: '-0.04em',
                            marginBottom: '1.2rem',
                        }}>
                            Discover the Outdoors,{' '}
                            <span style={{ color: 'var(--c-orange)' }}>Leave No Trace</span>
                        </h1>
                        <p style={{
                            color: 'rgba(255,255,255,0.72)',
                            fontSize: '1.05rem',
                            lineHeight: 1.7,
                            marginBottom: '2rem',
                        }}>
                            Campify was born from a simple belief — the best moments in life happen under open skies.
                            We built the platform we always wished existed: honest campground reviews, real photos,
                            and a community of people who love the outdoors as much as we do.
                        </p>
                        <div className="d-flex gap-3 flex-wrap">
                            <Link
                                to="/campgrounds"
                                className="btn rounded-pill fw-bold"
                                style={{
                                    background: 'var(--c-orange)',
                                    color: '#fff',
                                    padding: '0.75rem 1.8rem',
                                    boxShadow: '0 4px 16px rgba(232,93,4,.3)',
                                    border: 'none',
                                }}
                            >
                                🏕 Explore Campgrounds
                            </Link>
                            <Link
                                to="/contact"
                                className="btn rounded-pill fw-semibold"
                                style={{
                                    background: 'transparent',
                                    color: '#fff',
                                    border: '1.5px solid rgba(255,255,255,0.5)',
                                    padding: '0.75rem 1.8rem',
                                }}
                            >
                                Contact Us →
                            </Link>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="col-lg-6">
                        <div style={{ position: 'relative' }}>
                            <img
                                src="/mountain-meadow.jpg"
                                alt="Alpine meadow with snow-capped mountains and wildflowers"
                                style={{
                                    width: '100%',
                                    borderRadius: '1.2rem',
                                    objectFit: 'cover',
                                    maxHeight: 440,
                                    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                                    display: 'block',
                                }}
                            />
                            {/* Live badge */}
                            <div style={{
                                position: 'absolute',
                                bottom: '1.2rem',
                                left: '1.2rem',
                                background: 'rgba(255,255,255,0.95)',
                                borderRadius: '0.75rem',
                                padding: '0.6rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 16px rgba(0,0,0,.2)',
                                backdropFilter: 'blur(4px)',
                            }}>
                                <div style={{
                                    width: 10, height: 10,
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111827' }}>Live Community</div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>1,200+ active campers</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ══ STATS ═════════════════════════════════════════ */}
        <section style={{ background: '#fff', padding: '3.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <div className="container">
                <div className="row g-4 text-center">
                    {stats.map((s) => (
                        <div className="col-6 col-md-3" key={s.label}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>{s.icon}</div>
                            <div style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: '2.2rem',
                                fontWeight: 900,
                                color: 'var(--c-alpine-green)',
                                lineHeight: 1,
                                letterSpacing: '-0.04em',
                            }}>
                                {s.value}
                            </div>
                            <div style={{
                                fontSize: '0.78rem',
                                color: 'var(--color-text-muted)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                marginTop: '0.35rem',
                            }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ══ STORY ═════════════════════════════════════════ */}
        <section style={{ padding: '5rem 0', background: 'var(--c-snow)' }}>
            <div className="container">
                <div className="row align-items-center g-5">
                    <div className="col-lg-5">
                        <img
                            src="https://images.unsplash.com/photo-1504280336669-beef6d306232?auto=format&fit=crop&w=800&q=80"
                            alt="Camping tent by a fire at dusk"
                            style={{
                                width: '100%',
                                borderRadius: '1.2rem',
                                objectFit: 'cover',
                                maxHeight: 380,
                                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                            }}
                        />
                    </div>
                    <div className="col-lg-7">
                        <div style={{
                            display: 'inline-block',
                            background: 'var(--c-alpine-pale)',
                            color: 'var(--c-alpine-green)',
                            borderRadius: '999px',
                            padding: '0.25rem 0.85rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: '1rem',
                        }}>
                            Our Mission
                        </div>
                        <h2 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                            fontWeight: 800,
                            color: 'var(--c-slate)',
                            lineHeight: 1.2,
                            letterSpacing: '-0.03em',
                            marginBottom: '1rem',
                        }}>
                            Making the outdoors accessible for everyone
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.75, fontSize: '0.95rem', marginBottom: '1rem' }}>
                            We believe that access to nature shouldn't require insider knowledge or expensive guides.
                            Campify puts every campground, trail head, and alpine meadow in reach — with the honest
                            information you need to plan a safe, memorable trip.
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.75, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                            From rugged backcountry bivouacs to family-friendly lakeside sites, our community
                            continuously maps, photographs, and reviews places that deserve to be discovered.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {checklist.map((item) => (
                                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                    <span style={{ color: 'var(--c-alpine-green)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* ══ CORE VALUES ═══════════════════════════════════ */}
        <section style={{ background: '#fff', padding: '5rem 0' }}>
            <div className="container">
                <div className="text-center mb-5">
                    <div style={{
                        display: 'inline-block',
                        background: 'var(--c-alpine-pale)',
                        color: 'var(--c-alpine-green)',
                        borderRadius: '999px',
                        padding: '0.3rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '0.75rem',
                    }}>
                        Core Values
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)',
                        fontWeight: 800,
                        color: 'var(--c-slate)',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.2,
                    }}>
                        Built on principles that matter
                    </h2>
                </div>

                <div className="row g-3">
                    {values.map((v) => (
                        <div className="col-md-6 col-lg-4" key={v.title}>
                            <HoverCard style={{
                                background: 'var(--c-snow)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '1rem',
                                padding: '1.75rem',
                                height: '100%',
                                cursor: 'default',
                            }}>
                                <div style={{
                                    width: 52, height: 52,
                                    borderRadius: '0.75rem',
                                    background: v.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    marginBottom: '1rem',
                                }}>
                                    {v.icon}
                                </div>
                                <h3 style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: 'var(--c-slate)',
                                    marginBottom: '0.5rem',
                                }}>
                                    {v.title}
                                </h3>
                                <p style={{
                                    fontSize: '0.84rem',
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}>
                                    {v.body}
                                </p>
                            </HoverCard>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════ */}
        <section style={{ padding: '5rem 0', background: 'var(--c-snow)' }}>
            <div className="container">
                <div style={{
                    position: 'relative',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    padding: '4.5rem 2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 60%, rgba(232,93,4,0.5) 100%)',
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        marginBottom: '0.75rem',
                    }}>
                        Ready to find your next adventure?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1rem', marginBottom: '2rem' }}>
                        Join thousands of campers already exploring with Campify.
                    </p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Link
                            to="/campgrounds"
                            className="btn rounded-pill fw-bold"
                            style={{ background: 'var(--c-orange)', color: '#fff', padding: '0.75rem 1.8rem', border: 'none' }}
                        >
                            Browse Campgrounds
                        </Link>
                        <Link
                            to="/contact"
                            className="btn rounded-pill fw-semibold"
                            style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', padding: '0.75rem 1.8rem' }}
                        >
                            Get in Touch
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    </div>
);

export default About;
