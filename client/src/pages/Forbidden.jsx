import React from 'react';
import { Link } from 'react-router-dom';

const Forbidden = () => (
    <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        background: 'var(--c-snow)',
    }}>
        {/* Icon */}
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>🚫</div>

        {/* Code watermark */}
        <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '5.5rem',
            fontWeight: 900,
            color: 'rgba(239,68,68,0.08)',
            lineHeight: 1,
            letterSpacing: '-0.05em',
            marginBottom: '-1.2rem',
            userSelect: 'none',
        }}>
            403
        </div>

        <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 900,
            color: 'var(--c-slate)',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: '0.75rem',
            position: 'relative',
            zIndex: 1,
        }}>
            Access Denied
        </h1>

        <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.95rem',
            maxWidth: 360,
            lineHeight: 1.65,
            marginBottom: '2rem',
        }}>
            You don't have permission to view this page. If you believe this is a mistake, please contact support.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
                to="/"
                style={{
                    background: 'var(--c-alpine-green)',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '0.65rem 1.6rem',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                }}
            >
                🏠 Go Home
            </Link>
            <Link
                to="/campgrounds"
                style={{
                    background: 'transparent',
                    color: 'var(--c-slate)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '999px',
                    padding: '0.65rem 1.6rem',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                }}
            >
                Browse Campgrounds
            </Link>
        </div>
    </div>
);

export default Forbidden;
