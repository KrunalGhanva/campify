const Footer = () => (
    <footer style={{
        background: 'var(--c-slate)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.85rem',
    }}>
        <div className="container py-4">
            <div className="row align-items-center g-3">
                {/* Brand */}
                <div className="col-md-4">
                    <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        marginBottom: '0.25rem',
                    }}>
                        ⛰ Camp<span style={{ color: 'var(--c-orange)' }}>ify</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                        Discover the wild. Share the journey.
                    </div>
                </div>

                {/* Links */}
                <div className="col-md-4 text-md-center">
                    <div className="d-flex gap-3 justify-content-md-center flex-wrap">
                        {[
                            ['/campgrounds', 'Campgrounds'],
                            ['/about',       'About'],
                            ['/contact',     'Contact'],
                        ].map(([href, label]) => (
                            <a
                                key={href}
                                href={href}
                                style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    textDecoration: 'none',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => e.target.style.color = '#fff'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Copyright */}
                <div className="col-md-4 text-md-end">
                    <span>© {new Date().getFullYear()} Campify. All rights reserved.</span>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
