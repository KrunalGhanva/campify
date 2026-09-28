import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

const ErrorPage = () => {
    const error = useRouteError();
    const status  = error?.status || 500;
    const message = error?.statusText || error?.message || 'Something went wrong';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
        }}>
            {/* Big emoji */}
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                {status === 404 ? '🗺' : '⛺'}
            </div>

            {/* Status code */}
            <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '6rem',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.15)',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                marginBottom: '-1.5rem',
                userSelect: 'none',
            }}>
                {status}
            </div>

            {/* Title */}
            <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                marginBottom: '0.75rem',
                position: 'relative',
                zIndex: 1,
            }}>
                {status === 404 ? 'Trail Not Found' : 'Oops! Base Camp Down'}
            </h1>

            {/* Subtitle */}
            <p style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '1rem',
                maxWidth: 400,
                lineHeight: 1.65,
                marginBottom: '2rem',
            }}>
                {status === 404
                    ? "Looks like this trail doesn't exist on our map. Let's get you back to base camp."
                    : `Something went wrong on our end: ${message}`}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    to="/"
                    style={{
                        background: 'var(--c-orange)',
                        color: '#fff',
                        borderRadius: '999px',
                        padding: '0.75rem 1.8rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(232,93,4,.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                    }}
                >
                    🏠 Go Home
                </Link>
                <Link
                    to="/campgrounds"
                    style={{
                        background: 'transparent',
                        color: '#fff',
                        border: '1.5px solid rgba(255,255,255,0.45)',
                        borderRadius: '999px',
                        padding: '0.75rem 1.8rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                    }}
                >
                    🏕 Browse Campgrounds
                </Link>
            </div>

            {/* Decorative blobs */}
            <div style={{
                position: 'fixed', bottom: '-6rem', right: '-6rem',
                width: 280, height: 280, borderRadius: '50%',
                background: 'rgba(232,93,4,0.12)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed', top: '-4rem', left: '-4rem',
                width: 200, height: 200, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
            }} />
        </div>
    );
};

export default ErrorPage;
