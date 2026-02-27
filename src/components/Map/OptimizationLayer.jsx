import React, { useState, useEffect, useRef } from 'react';
import { useMapEvents, useMap, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import { optimizeLocation } from '../../utils/rfService';
import { useRF } from '../../context/RFContext';
import OptimizationResultsPanel from './OptimizationResultsPanel';
import ProfileModal from './ProfileModal';

// Imported Sub-components
import ScanningOverlay from './UI/Optimization/ScanningOverlay';
import OptimizationAlert from './UI/Optimization/OptimizationAlert';
import OptimizationSettingsPanel from './UI/Optimization/OptimizationSettingsPanel';
import CandidateMarkers from './UI/Optimization/CandidateMarkers';
import HeatmapOverlay from './UI/Optimization/HeatmapOverlay';

const OptimizationLayer = ({ active, setActive, onStateUpdate, weights }) => {
    // Radial State
    const [center, setCenter] = useState(null);
    const [radiusMeters, setRadiusMeters] = useState(0);
    
    // Common State
    const [ghostNodes, setGhostNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locked, setLocked] = useState(false);
    const [notification, setNotification] = useState(null); // { message, type }
    const [showResults, setShowResults] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    
    const map = useMap(); 
    const { freq, antennaHeight, rxHeight, isMobile, kFactor, setKFactor, clutterHeight, setClutterHeight } = useRF();
    const lastSyncRef = useRef({ center: null, loading: false, ghostCount: 0 }); 
    
    // Manual sync helper
    const syncState = (forceState = null) => {
        if (!onStateUpdate) return;
        const stateToSync = forceState || { center, loading, ghostNodes, showResults };
        const prev = lastSyncRef.current;
        
        const centerChanged = stateToSync.center !== prev.center;
        const loadingChanged = stateToSync.loading !== prev.loading;
        const ghostCountChanged = (stateToSync.ghostNodes?.length || 0) !== prev.ghostCount;
        const resultsVisibleChanged = stateToSync.showResults !== prev.showResults;

        if (centerChanged || loadingChanged || ghostCountChanged || resultsVisibleChanged) {
            onStateUpdate(stateToSync);
            lastSyncRef.current = {
                center: stateToSync.center,
                loading: stateToSync.loading,
                ghostCount: stateToSync.ghostNodes?.length || 0,
                showResults: stateToSync.showResults
            };
        }
    };

    useMapEvents({
        click(e) {
            if (!active) return;
            if (loading) return; 
            if (locked || ghostNodes.length > 0) return; 
            
            if (!center) {
                // First Click: Set Center
                setCenter(e.latlng);
                setRadiusMeters(0);
                onStateUpdate?.({ center: e.latlng, loading: false, ghostNodes: [] });
            } else {
                // Second Click: Lock Radius & Scan
                setLocked(true);
                handleOptimize(center, radiusMeters); // pass current radius
                onStateUpdate?.({ center, loading: true, ghostNodes: [], showResults: false });
            }
        },
        mousemove(e) {
            if (active && center && !locked && !ghostNodes.length) { 
                 if(loading) return; 
                 // Update radius based on mouse position
                 const dist = center.distanceTo(e.latlng);
                 setRadiusMeters(dist);
            }
        }
    });

    const handleOptimize = async (scanCenter, scanRadius) => {
        if (!scanCenter || scanRadius < 100) return; // Min 100m radius
        
        setLoading(true);
        
        // Convert Center/Radius to Bounding Box for Backend
        // 1 deg Lat ~= 111km. 1 deg Lon ~= 111km * cos(lat)
        const r_km = scanRadius / 1000.0;
        const lat_deg = r_km / 111.0;
        const lon_deg = r_km / (111.0 * Math.cos(scanCenter.lat * (Math.PI / 180.0)));
        
        const min_lat = scanCenter.lat - lat_deg;
        const max_lat = scanCenter.lat + lat_deg;
        const min_lon = scanCenter.lng - lon_deg;
        const max_lon = scanCenter.lng + lon_deg;
        
        const bounds = L.latLngBounds([min_lat, min_lon], [max_lat, max_lon]);
        
        let finalGhostNodes = ghostNodes; 

        // Create "Home" node from center point
        const homeNode = {
            lat: scanCenter.lat,
            lon: scanCenter.lng,
            height: rxHeight
        };

        try {
            const result = await optimizeLocation(bounds, freq, antennaHeight, rxHeight, weights, kFactor, clutterHeight, [homeNode]);
            if (result.status === 'success') {
                // Filter results to actually be inside the circle
                const filtered = result.locations.filter(loc => {
                    const d = map.distance([loc.lat, loc.lon], scanCenter);
                    return d <= scanRadius * 1.05; // 5% tolerance
                });
                
                setGhostNodes(filtered);
                if (result.heatmap) setHeatmapData(result.heatmap);
                finalGhostNodes = filtered; 
                setShowResults(true); 
            } else {
                setNotification({ message: result.message || "Scan failed.", type: 'error' });
                setLocked(false); 
            }
        } catch (err) {
            console.error(err);
            setNotification({ message: "Scan failed. Please try again.", type: 'error' });
            setLocked(false); 
        } finally {
            setLoading(false);
            onStateUpdate?.({ center: scanCenter, loading: false, ghostNodes: finalGhostNodes, showResults: true }); 
        }
    };
    
    // Helper to trigger rescan from UI (Slider)
    const handleRecalculate = () => {
        if(center && radiusMeters) {
            handleOptimize(center, radiusMeters);
        }
    };

    const reset = () => {
        setCenter(null);
        setRadiusMeters(0);
        setGhostNodes([]);
        setHeatmapData([]);
        setLocked(false);
        setNotification(null);
        setShowResults(false);
        onStateUpdate?.({ center: null, loading: false, ghostNodes: [], showResults: false });
    }

    // Reset when deactivated
    useEffect(() => {
        if (!active) reset();
    }, [active]);

    if (!active && !ghostNodes.length) return null;

    return (
        <>
            {/* Visuals: Center, Radius, Line */}
            {center && (
                <>
                    {/* Home/TX Marker */}
                    <Marker 
                        position={center}
                        icon={L.divIcon({ 
                            className: 'home-icon', 
                            html: `<div style="width: 20px; height: 20px; background: #00f2ff; border: 2px solid white; box-shadow: 0 0 10px #00f2ff; transform: rotate(45deg);"></div>`, 
                            iconSize: [20, 20], 
                            iconAnchor: [10, 10] 
                        })}
                    />
                    
                    {/* The Scan Circle */}
                    <Circle 
                        center={center}
                        radius={radiusMeters}
                        pathOptions={{ 
                            color: '#00f2ff', 
                            weight: 1, 
                            dashArray: locked ? null : '5,5', 
                            fillOpacity: 0.05,
                            fillColor: '#00f2ff'
                        }}
                    />
                </>
            )}

            {/* Heatmap Overlay */}
            <HeatmapOverlay
                heatmapData={heatmapData}
                showHeatmap={showHeatmap}
                center={center}
                radiusMeters={radiusMeters}
            />

            {/* Ghost Nodes */}
            <CandidateMarkers
                ghostNodes={ghostNodes}
                setSelectedNode={setSelectedNode}
            />
            
            {/* Loading Overlay */}
            {loading && <ScanningOverlay />}

            {/* Success/Error Overlay */}
            <OptimizationAlert
                notification={notification}
                setNotification={setNotification}
                setShowResults={setShowResults}
            />
            
            {/* Results Panel */}
            {showResults && ghostNodes.length > 0 && (
                <OptimizationResultsPanel 
                    results={ghostNodes}
                    weights={weights}
                    onClose={() => setShowResults(false)}
                    onCenter={(node) => {
                        if (map) map.flyTo([node.lat, node.lon], 16, { duration: 1.5 });
                    }}
                    onReset={reset}
                    onRecalculate={handleRecalculate}
                />
            )}

             {/* Profile Modal */}
            {selectedNode && center && (
                <ProfileModal
                    tx={{ lat: center.lat, lon: center.lng, height: antennaHeight }}
                    rx={{ lat: selectedNode.lat, lon: selectedNode.lon, height: rxHeight }}
                    context={{ freq }}
                    onClose={() => setSelectedNode(null)}
                />
            )}
            
            {/* Advanced Settings & Legend */}
            <OptimizationSettingsPanel
                active={active}
                ghostNodes={ghostNodes}
                isMobile={isMobile}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                locked={locked}
                radiusMeters={radiusMeters}
                setRadiusMeters={setRadiusMeters}
                handleRecalculate={handleRecalculate}
                kFactor={kFactor} setKFactor={setKFactor}
                clutterHeight={clutterHeight} setClutterHeight={setClutterHeight}
                showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
            />
        </>
    );
};

export default OptimizationLayer;
