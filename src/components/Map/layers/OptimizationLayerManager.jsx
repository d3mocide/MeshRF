import React from 'react';
import { Marker, Popup, Polyline, ImageOverlay, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import OptimizationLayer from '../OptimizationLayer';
import useSimulationStore from '../../../store/useSimulationStore';

const MultiSiteClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return null;
};

const OptimizationLayerManager = ({
    active,
    setActive,
    siteAnalysisMode,
    lastClickedLocation, setLastClickedLocation,
    onStateUpdate,
    weights,
    simNodes, simResults, interNodeLinks, compositeOverlay,
    units
}) => {

    // Proactive addition logic moved here
    const handleLocationSelect = (loc) => {
        setLastClickedLocation(loc);
        useSimulationStore.getState().addNode({
            lat: loc.lat,
            lon: loc.lng,
            height: 10,
            name: `Node ${simNodes.length + 1}`
        });
    };

    if (!active && !simNodes.length && !compositeOverlay) return null;

    return (
        <>
            {/* Multi-Site Click Handler */}
            {active && siteAnalysisMode === 'manual' && (
                <MultiSiteClickHandler onLocationSelect={handleLocationSelect} />
            )}

            <OptimizationLayer
                active={active && siteAnalysisMode === 'auto'}
                setActive={setActive}
                onStateUpdate={onStateUpdate}
                weights={weights}
            />

            {/* Multi-Site Composite Overlay */}
            {compositeOverlay && compositeOverlay.bounds && (
                <ImageOverlay
                    url={`data:image/png;base64,${compositeOverlay.image}`}
                    bounds={[
                        [compositeOverlay.bounds.north, compositeOverlay.bounds.west],
                        [compositeOverlay.bounds.south, compositeOverlay.bounds.east]
                    ]}
                    opacity={0.4}
                    zIndex={500}
                />
            )}

            {/* Temporary Node Marker */}
            {active && siteAnalysisMode === 'manual' && lastClickedLocation && (
                <Marker
                    key="temp-candidate"
                    position={[lastClickedLocation.lat, lastClickedLocation.lng]}
                    icon={L.divIcon({
                        className: 'temp-node-icon',
                        html: `<div style="
                            background-color: transparent;
                            width: 16px; height: 16px;
                            border-radius: 50%; opacity: 0.8;
                            border: 2px dashed #00f2ff;
                            box-shadow: 0 0 5px rgba(0, 242, 255, 0.5);
                        "></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    })}
                >
                    <Popup>New Site Candidate</Popup>
                </Marker>
            )}

            {/* Simulation Nodes Rendering */}
            {(active || simNodes.length > 0) && simNodes.map((node) => (
                <Marker
                    key={`sim-${node.id}`}
                    position={[node.lat, node.lon]}
                    icon={L.divIcon({
                        className: 'sim-node-icon',
                        html: `<div style="
                            background-color: #00f2ff;
                            width: 14px; height: 14px;
                            border-radius: 50%; opacity: 1;
                            border: 2px solid white;
                            box-shadow: 0 0 10px #00f2ff;
                            display: flex; align-items: center; justify-content: center;
                            font-size: 10px; font-weight: bold; color: black;
                        ">${simResults ? '✓' : ''}</div>`,
                        iconSize: [14, 14],
                        iconAnchor: [7, 7],
                    })}
                >
                    <Popup>
                        <strong>{node.name}</strong><br/>
                        Lat: {node.lat.toFixed(5)}<br/>
                        Lon: {node.lon.toFixed(5)}<br/>
                        {simResults && Array.isArray(simResults) && (() => {
                            const res = simResults.find(r => Math.abs(r.lat - node.lat) < 0.0001 && Math.abs(r.lon - node.lon) < 0.0001);
                            if (!res) return null;
                            return (
                                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#888' }}>Elevation:</span>
                                        <span style={{ color: '#00f2ff', fontWeight: 'bold' }}>
                                            {units === 'imperial'
                                                ? `${(res.elevation * 3.28084).toFixed(1)} ft`
                                                : `${res.elevation} m`}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#888' }}>Coverage:</span>
                                        <span style={{ color: '#00f2ff', fontWeight: 'bold' }}>
                                            {units === 'imperial'
                                                ? `${(res.coverage_area_km2 * 0.386102).toFixed(2)} mi²`
                                                : `${res.coverage_area_km2} km²`}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                                        ({res.coverage_points} visible points)
                                    </div>
                                </div>
                            );
                        })()}
                    </Popup>
                </Marker>
            ))}

            {/* Inter-node link quality polylines */}
            {simResults && interNodeLinks && interNodeLinks.map((link, i) => {
                const nodeA = simResults[link.node_a_idx];
                const nodeB = simResults[link.node_b_idx];
                if (!nodeA || !nodeB) return null;
                const colorMap = { viable: '#00f2ff', degraded: '#ffd700', blocked: '#ff4444', unknown: '#888' };
                const color = colorMap[link.status] || '#888';
                const dashArray = link.status === 'blocked' ? '6 6' : link.status === 'degraded' ? '10 4' : null;
                return (
                    <Polyline
                        key={`link-${i}`}
                        positions={[[nodeA.lat, nodeA.lon], [nodeB.lat, nodeB.lon]]}
                        pathOptions={{ color, weight: 2, opacity: 0.85, dashArray }}
                    />
                );
            })}
        </>
    );
};

export default OptimizationLayerManager;
