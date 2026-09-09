import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getAllCampgrounds } from '../api/campgrounds';
import CampgroundCard from '../components/CampgroundCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CampgroundList = () => {
    const [campgrounds, setCampgrounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

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

    useEffect(() => {
        if (!loading && mapToken && campgrounds.length > 0 && mapContainerRef.current && !mapRef.current) {
            mapboxgl.accessToken = mapToken;
            
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/light-v10',
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
                            .filter((campground) => campground.geometry?.type === 'Point' && campground.geometry.coordinates?.length === 2)
                            .map((campground) => ({
                                type: 'Feature',
                                geometry: campground.geometry,
                                properties: {
                                    id: campground._id,
                                    title: campground.title,
                                    description: campground.description,
                                    location: campground.location
                                }
                            }))
                    },
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'campgrounds',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#00BCD4',
                            10,
                            '#2196F3',
                            30,
                            '#3F51B5'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            15,
                            10,
                            20,
                            30,
                            25
                        ]
                    }
                });

                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'campgrounds',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'campgrounds',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': '#11b4da',
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });

                map.on('click', 'clusters', (e) => {
                    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                    const clusterId = features[0].properties.cluster_id;
                    map.getSource('campgrounds').getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err) return;
                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom
                        });
                    });
                });

                map.on('click', 'unclustered-point', (e) => {
                    const { id, title, description, location } = e.features[0].properties;
                    const coordinates = e.features[0].geometry.coordinates.slice();

                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    const content = document.createElement('div');
                    const heading = document.createElement('strong');
                    heading.textContent = title || 'Campground';
                    const details = document.createElement('p');
                    details.className = 'mb-1';
                    details.textContent = `${String(description || '').slice(0, 100)}…`;
                    const place = document.createElement('p');
                    place.className = 'mb-2 text-muted';
                    place.textContent = location || '';
                    const link = document.createElement('a');
                    link.href = `/campgrounds/${encodeURIComponent(id)}`;
                    link.textContent = 'View campground';
                    content.append(heading, details, place, link);

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setDOMContent(content)
                        .addTo(map);
                });

                map.on('mouseenter', 'clusters', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'clusters', () => {
                    map.getCanvas().style.cursor = '';
                });
            });

            mapRef.current = map;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [loading, campgrounds, mapToken]);

    if (loading) return <LoadingSpinner label="Loading campgrounds..." />;
    if (error) return <div className="alert alert-danger" role="alert">{error}</div>;

    return (
        <>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                <div>
                    <h1 className="h2 mb-1">All Campgrounds</h1>
                    <p className="text-muted mb-0">Find your next place to sleep under the stars.</p>
                </div>
            </div>
            {!campgrounds.length ? (
                <div className="alert alert-light border text-center py-5">
                    <h2 className="h4">No campgrounds yet</h2>
                    <p className="mb-0 text-muted">Be the first camper to add one.</p>
                </div>
            ) : (
                <>
                    {!mapToken ? (
                        <div className="alert alert-warning">The map is unavailable until <code>VITE_MAPBOX_TOKEN</code> is configured.</div>
                    ) : (
                        <div ref={mapContainerRef} className="campground-map mb-4" aria-label="Map of campgrounds"></div>
                    )}
                    <div className="vstack gap-3">
                        {campgrounds.map(campground => (
                            <CampgroundCard key={campground._id} campground={campground} />
                        ))}
                    </div>
                </>
            )}
        </>
    );
};

export default CampgroundList;
