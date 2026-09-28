import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/home.css';

/* ── Scroll-reveal hook ───────────────────────────────────── */
function useReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}

/* ── Stat Counter ─────────────────────────────────────────── */
const Counter = ({ target, label, icon }) => {
    const [count, setCount] = useState(0);
    const [ref, visible] = useReveal(0.5);
    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 20);
        return () => clearInterval(timer);
    }, [visible, target]);
    return (
        <div ref={ref} className="stat-item">
            <div className="stat-icon">{icon}</div>
            <div className="stat-number">{count.toLocaleString()}+</div>
            <div className="stat-label">{label}</div>
        </div>
    );
};

/* ── Feature Card ─────────────────────────────────────────── */
const FeatureCard = ({ icon, title, body, delay, color }) => {
    const [ref, visible] = useReveal(0.15);
    return (
        <div ref={ref} className={`feature-card ${visible ? 'feature-card--visible' : ''}`}
            style={{ transitionDelay: delay }}>
            <div className="feature-card__icon" style={{ background: color }}>
                {icon}
            </div>
            <h3 className="feature-card__title">{title}</h3>
            <p className="feature-card__body">{body}</p>
        </div>
    );
};

/* ── Step Card ────────────────────────────────────────────── */
const StepCard = ({ num, title, body, delay }) => {
    const [ref, visible] = useReveal(0.15);
    return (
        <div ref={ref} className={`step-card ${visible ? 'step-card--visible' : ''}`}
            style={{ transitionDelay: delay }}>
            <div className="step-num">{num}</div>
            <h4 className="step-title">{title}</h4>
            <p className="step-body">{body}</p>
        </div>
    );
};

/* ── Home Page ────────────────────────────────────────────── */
const Home = () => {
    const { currentUser } = useContext(AuthContext);
    const [parallaxY, setParallaxY] = useState(0);
    const heroRef = useRef(null);

    /* Subtle parallax on hero bg */
    useEffect(() => {
        const onScroll = () => {
            const scrolled = window.scrollY;
            setParallaxY(scrolled * 0.35);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="home-page">

            {/* ══ HERO ════════════════════════════════════════ */}
            <section ref={heroRef} className="hero-section">
                {/* Parallax bg */}
                <div
                    className="hero-bg"
                    style={{ transform: `translateY(${parallaxY}px)` }}
                    aria-hidden="true"
                />
                {/* Gradient overlay */}
                <div className="hero-overlay" aria-hidden="true" />

                <div className="container hero-content">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-9">
                            <div className="hero-eyebrow anim-fade-in">
                                🏔 Adventure Awaits
                            </div>
                            <h1 className="hero-title anim-fade-up anim-delay-1">
                                Discover Your Next<br />
                                <span className="hero-title--accent">Wild Escape</span>
                            </h1>
                            <p className="hero-subtitle anim-fade-up anim-delay-2">
                                Find handpicked campgrounds across breathtaking mountain terrain.
                                Explore, book, and share your adventures with a community of outdoor enthusiasts.
                            </p>

                            <div className="hero-ctas anim-fade-up anim-delay-3">
                                <Link to="/campgrounds" className="btn hero-btn-primary">
                                    Explore Campgrounds
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="ms-2">
                                        <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                                    </svg>
                                </Link>
                                {!currentUser && (
                                    <Link to="/register" className="btn hero-btn-secondary">
                                        Join for Free
                                    </Link>
                                )}
                                {currentUser && (
                                    <Link to="/campgrounds/new" className="btn hero-btn-secondary">
                                        + List Your Campground
                                    </Link>
                                )}
                            </div>

                            {/* Scroll cue */}
                            <div className="hero-scroll-cue anim-fade-in anim-delay-5">
                                <div className="scroll-dot" />
                                <span>Scroll to explore</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="hero-wave" aria-hidden="true">
                    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--c-snow)" />
                    </svg>
                </div>
            </section>

            {/* ══ STATS ════════════════════════════════════════ */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <Counter target={300} label="Campgrounds" icon="🏕️" />
                        <Counter target={1200} label="Happy Campers" icon="😊" />
                        <Counter target={50} label="Destinations" icon="📍" />
                        <Counter target={4800} label="Reviews" icon="⭐" />
                    </div>
                </div>
            </section>

            {/* ══ FEATURES ════════════════════════════════════ */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Why Campify</span>
                        <h2 className="section-title">Everything you need<br />for the perfect trip</h2>
                    </div>
                    <div className="features-grid">
                        <FeatureCard
                            icon="🗺"
                            title="Interactive Maps"
                            body="Explore campgrounds on a live Mapbox map with clustered markers. See exactly where each site sits in the landscape."
                            delay="0s"
                            color="rgba(45,106,79,0.12)"
                        />
                        <FeatureCard
                            icon="📸"
                            title="Real Photo Galleries"
                            body="Browse authentic Cloudinary-hosted photos uploaded by campground owners and fellow campers."
                            delay="0.08s"
                            color="rgba(232,93,4,0.1)"
                        />
                        <FeatureCard
                            icon="⭐"
                            title="Honest Reviews"
                            body="5-star ratings, text reviews, and photo uploads from the real community. No fake listings."
                            delay="0.16s"
                            color="rgba(245,158,11,0.12)"
                        />
                        <FeatureCard
                            icon="🔒"
                            title="Secure & Trusted"
                            body="Helmet security headers, MongoDB sanitization, Joi validation, and session-backed authentication."
                            delay="0.24s"
                            color="rgba(99,102,241,0.1)"
                        />
                        <FeatureCard
                            icon="🏔"
                            title="Mountain Destinations"
                            body="From basecamp stays to alpine meadows — every listing is geocoded and pinned to the exact location."
                            delay="0.32s"
                            color="rgba(14,165,233,0.1)"
                        />
                        <FeatureCard
                            icon="✏️"
                            title="List Your Site"
                            body="Any registered user can publish their own campground — add photos, set a price, and start getting reviews."
                            delay="0.40s"
                            color="rgba(236,72,153,0.1)"
                        />
                    </div>
                </div>
            </section>

            {/* ══ HOW IT WORKS ════════════════════════════════ */}
            <section className="steps-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Simple Process</span>
                        <h2 className="section-title">Go from idea to adventure<br />in three steps</h2>
                    </div>
                    <div className="steps-grid">
                        <StepCard num="01" title="Create an Account" body="Sign up in seconds — just a username, email, and password. No credit card required to browse." delay="0s" />
                        <StepCard num="02" title="Find a Campground" body="Use the map or list view to browse hundreds of campgrounds. Filter by location to find your perfect spot." delay="0.1s" />
                        <StepCard num="03" title="Share the Experience" body="Leave a star rating, write a review, and upload your own photos to help fellow adventurers." delay="0.2s" />
                    </div>
                </div>
            </section>

            {/* ══ CTA BANNER ══════════════════════════════════ */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-bg" aria-hidden="true" />
                        <div className="cta-content">
                            <h2 className="cta-title">Ready to find your basecamp?</h2>
                            <p className="cta-sub">Join thousands of adventurers already exploring with Campify.</p>
                            <div className="d-flex gap-3 justify-content-center flex-wrap">
                                <Link to="/campgrounds" className="btn cta-btn-primary">
                                    Browse Campgrounds
                                </Link>
                                {!currentUser && (
                                    <Link to="/register" className="btn cta-btn-secondary">
                                        Create Free Account
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ FOOTER ══════════════════════════════════════ */}
            <footer style={{
                background: 'var(--c-slate)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                padding: '1.5rem 0',
                textAlign: 'center',
            }}>
                © {new Date().getFullYear()} Campify — Discover the wild. Share the journey.
            </footer>
        </div>
    );
};

export default Home;
