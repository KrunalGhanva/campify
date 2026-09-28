import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getAllCampgrounds } from '../api/campgrounds';
import CampgroundCard from '../components/CampgroundCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CampgroundList = () => {
    const [campgrounds, setCampgrounds] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [search, setSearch]           = useState('');
    const mapContainerRef = useRef(null);
    const mapRef          = useRef(null);
    const mapToken        = import.meta.env.VITE_MAPBOX_TOKEN;

    useEffect(() => {
        const fetchCampgrounds = async () => {
            try {
                const data = await getAllCampgrounds();
                setCampgrounds(data.campgrounds || []);
            } catch (err) {
                setError(err.response?.data?.error || 'Could not load campgrounds. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchCampgrounds();
    }, []);

    /* Mapbox cluster map */
    useEffect(() => {
        if (!loading && mapToken && campgrounds.length > 0 && mapContainerRef.current && !mapRef.current) {
            mapboxgl.accessToken = mapToken;
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/outdoors-v12',   // adventure-themed style
                center: [-103.59179687498357, 40.66995747013945],
                zoom: 3
            });
            map.addControl(new mapboxgl.NavigationControl());

            map.on('load', () => {
                map.addSource('campgrounds', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: campgrounds
                            .filter(c => c.geometry?.type === 'Point' && c.geometry.coordinates?.length === 2)
                            .map(c => ({
                                type: 'Feature',
                                geometry: c.geometry,
                                properties: { id: c._id, title: c.title, description: c.description, location: c.location }
                            }))
                    },
                    cluster: true, clusterMaxZoom: 14, clusterRadius: 50
                });

                map.addLayer({ id: 'clusters', type: 'circle', source: 'campgrounds', filter: ['has', 'point_count'],
                    paint: { 'circle-color': ['step', ['get', 'point_count'], '#2d6a4f', 10, '#40916c', 30, '#1b2838'], 'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30] }
                });
                map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'campgrounds', filter: ['has', 'point_count'],
                    layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 12 },
                    paint: { 'text-color': '#ffffff' }
                });
                map.addLayer({ id: 'unclustered-point', type: 'circle', source: 'campgrounds', filter: ['!', ['has', 'point_count']],
                    paint: { 'circle-color': '#e85d04', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
                });

                map.on('click', 'clusters', (e) => {
                    const [f] = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                    map.getSource('campgrounds').getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
                        if (!err) map.easeTo({ center: f.geometry.coordinates, zoom });
                    });
                });

                map.on('click', 'unclustered-point', (e) => {
                    const { id, title, description, location } = e.features[0].properties;
                    const coords = e.features[0].geometry.coordinates.slice();
                    while (Math.abs(e.lngLat.lng - coords[0]) > 180) coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;

                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'font-family:Inter,sans-serif;min-width:160px;';
                    wrap.innerHTML = `
                        <strong style="font-size:0.9rem;color:#1b2838">${title || 'Campground'}</strong>
                        <p style="font-size:0.75rem;color:#6b7280;margin:4px 0">${location || ''}</p>
                        <a href="/campgrounds/${encodeURIComponent(id)}" style="font-size:0.78rem;color:#2d6a4f;font-weight:700;">View details →</a>`;

                    new mapboxgl.Popup({ offset: 12 }).setLngLat(coords).setDOMContent(wrap).addTo(map);
                });

                ['clusters', 'unclustered-point'].forEach(layer => {
                    map.on('mouseenter', layer, () => map.getCanvas().style.cursor = 'pointer');
                    map.on('mouseleave', layer, () => map.getCanvas().style.cursor = '');
                });
            });

            mapRef.current = map;
        }
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [loading, campgrounds, mapToken]);

    const filtered = campgrounds.filter(c =>
        !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <LoadingSpinner label="Loading campgrounds..." />;
    if (error)   return <div className="alert alert-danger mt-4" role="alert">{error}</div>;

    return (
        <div style={{ minHeight: '80vh' }}>
            {/* ── Page Header ── */}
            <div style={{
                background: 'linear-gradient(135deg, var(--c-slate) 0%, var(--c-alpine-green) 100%)',
                padding: '3rem 0 2.5rem', marginBottom: '2rem',
                marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
            }}>
                <div className="container">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                            <div style={{
                                display: 'inline-block', background: 'rgba(232,93,4,0.2)', color: '#fbbf24',
                                border: '1px solid rgba(232,93,4,0.35)', borderRadius: '999px',
                                padding: '0.25rem 0.9rem', fontSize: '0.72rem', fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem',
                            }}>🏕 All Campgrounds</div>
                            <h1 style={{
                                fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)',
                                fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                            }}>
                                Find your next adventure
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.65)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
                                {campgrounds.length} campground{campgrounds.length !== 1 ? 's' : ''} listed by the community
                            </p>
                        </div>
                        <Link
                            to="/campgrounds/new"
                            style={{
                                background: 'var(--c-orange)', color: '#fff', border: 'none',
                                borderRadius: '999px', padding: '0.7rem 1.6rem',
                                fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                                boxShadow: '0 4px 16px rgba(232,93,4,.3)',
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            }}
                        >
                            + Add Campground
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* ── Map ── */}
                {mapToken ? (
                    <div
                        ref={mapContainerRef}
                        className="campground-map mb-4"
                        style={{ height: 380, borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                        aria-label="Map of all campgrounds"
                    />
                ) : (
                    <div className="alert alert-warning mb-4">Map unavailable — configure <code>VITE_MAPBOX_TOKEN</code>.</div>
                )}

                {/* ── Search bar ── */}
                {campgrounds.length > 0 && (
                    <div style={{ position: 'relative', maxWidth: 460, marginBottom: '1.5rem' }}>
                        <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
                        <input
                            type="search"
                            placeholder="Search by name or location…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', paddingLeft: '2.4rem', paddingRight: '1rem',
                                paddingTop: '0.65rem', paddingBottom: '0.65rem',
                                border: '1.5px solid var(--color-border)', borderRadius: '999px',
                                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                                background: '#fff', outline: 'none',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--c-alpine-green)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>
                )}

                {/* ── Cards ── */}
                {!campgrounds.length ? (
                    <div style={{
                        textAlign: 'center', padding: '5rem 0',
                        background: '#fff', borderRadius: '1rem', border: '1px dashed var(--color-border)',
                    }}>
                        <div style={{ fontSize: '3rem' }}>🏕️</div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--c-slate)', margin: '1rem 0 0.5rem' }}>
                            No campgrounds yet
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Be the first camper to add one.</p>
                        <Link
                            to="/campgrounds/new"
                            style={{
                                background: 'var(--c-alpine-green)', color: '#fff',
                                borderRadius: '999px', padding: '0.7rem 1.8rem',
                                fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
                            }}
                        >
                            + Create Campground
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                        <div style={{ fontSize: '2rem' }}>🔍</div>
                        <p className="mt-2">No campgrounds match "<strong>{search}</strong>"</p>
                        <button
                            onClick={() => setSearch('')}
                            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="vstack gap-3">
                        {filtered.map(campground => (
                            <CampgroundCard key={campground._id} campground={campground} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampgroundList;
