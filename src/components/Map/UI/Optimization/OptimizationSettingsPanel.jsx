import React, { useRef, useEffect } from 'react';
import L from 'leaflet';

const OptimizationSettingsPanel = ({
    active, ghostNodes, isMobile,
    showSettings, setShowSettings,
    locked, radiusMeters, setRadiusMeters, handleRecalculate,
    kFactor, setKFactor, clutterHeight, setClutterHeight,
    showHeatmap, setShowHeatmap
}) => {
    const settingsRef = useRef(null);

    useEffect(() => {
        if (settingsRef.current) {
            L.DomEvent.disableClickPropagation(settingsRef.current);
            L.DomEvent.disableScrollPropagation(settingsRef.current);
        }
    });

    if (!active && !ghostNodes.length) return null;

    return (
        <div className="settings-panel"
            ref={settingsRef}
            style={{
                position: 'absolute',
                bottom: isMobile ? '190px' : '30px',
                left: '20px',
                background: 'rgba(10, 10, 15, 0.95)', padding: '15px',
                borderRadius: '12px', border: '1px solid #00f2ff',
                zIndex: 9999, color: '#fff', fontSize: '0.9em',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                cursor: 'default'
        }}>
            <div
                onClickCapture={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: showSettings ? '10px' : '0' }}
            >
                <span style={{ color: '#00f2ff' }}>⚙️ Advanced RF</span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>{showSettings ? '▲' : '▼'}</span>
            </div>

            {showSettings && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                        {/* Radius Slider (New) */}
                        {locked && (
                        <label style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                            <span>Radius: {(radiusMeters/1000).toFixed(1)} km</span>
                            <input
                                type="range" min="1000" max="20000" step="500"
                                value={radiusMeters}
                                onChangeCapture={e => {
                                    const r = parseFloat(e.target.value);
                                    setRadiusMeters(r);
                                }}
                                onMouseUpCapture={handleRecalculate}
                                onTouchEndCapture={handleRecalculate}
                            />
                        </label>
                        )}

                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Refraction (K): {kFactor}</span>
                        <input
                            type="range" min="0.5" max="2.0" step="0.01"
                            value={kFactor} onChangeCapture={e => setKFactor(parseFloat(e.target.value))}
                        />
                    </label>
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Clutter (m): {clutterHeight}</span>
                        <input
                            type="number" min="0" max="50" style={{ width: '50px', background: '#333', border: 'none', color: '#fff', padding: '2px' }}
                            value={clutterHeight} onChangeCapture={e => setClutterHeight(parseFloat(e.target.value))}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderTop: '1px solid #333', paddingTop: '5px' }}>
                        <input
                            type="checkbox"
                            checked={showHeatmap}
                            onChangeCapture={e => setShowHeatmap(e.target.checked)}
                        />
                        <span>Show Heatmap Overlay</span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default OptimizationSettingsPanel;
