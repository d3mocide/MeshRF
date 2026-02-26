import React from 'react';
import { useUI } from '../../../context/UIContext';

const SettingsSection = () => {
    const { units, setUnits, mapStyle, setMapStyle } = useUI();

    return (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
             <h3
                style={{
                    fontSize: '1rem',
                    color: '#fff',
                    margin: '0 0 var(--spacing-sm) 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                }}
             >
                Settings
             </h3>

             <div style={{ animation: 'fadeOnly 0.2s ease-in-out' }}>
                 <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                     <label style={{color: '#aaa', fontSize: '0.9em'}}>Units</label>
                     <div style={{display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden', border: '1px solid #444'}}>
                         <button
                            onClick={() => setUnits('metric')}
                            style={{
                                background: units === 'metric' ? 'var(--color-primary)' : 'transparent',
                                color: units === 'metric' ? '#000' : '#888',
                                border: 'none',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.8em',
                                fontWeight: 600
                            }}
                         >
                            Metric
                         </button>
                         <button
                            onClick={() => setUnits('imperial')}
                            style={{
                                background: units === 'imperial' ? 'var(--color-primary)' : 'transparent',
                                color: units === 'imperial' ? '#000' : '#888',
                                border: 'none',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.8em',
                                fontWeight: 600
                            }}
                         >
                            Imperial
                         </button>
                     </div>
                 </div>

                 {/* Map Theme Selector */}
                 <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', marginTop: '12px'}}>
                     <label style={{color: '#aaa', fontSize: '0.9em'}} htmlFor="map-style">Map Style</label>
                     <select
                        id="map-style"
                        name="map-style"
                        value={mapStyle}
                        onChange={(e) => setMapStyle(e.target.value)}
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid #444',
                            color: '#eee',
                            borderRadius: '4px',
                            padding: '4px',
                            fontSize: '0.85em',
                            width: '120px'
                        }}
                     >
                         <option value="dark">Dark Matter</option>
                         <option value="dark_green">Dark (Parks/Forests)</option>
                         <option value="light">Light Mode</option>
                         <option value="topo">Topography</option>
                         <option value="topo_dark">Dark Topography</option>
                         <option value="satellite">Satellite</option>
                     </select>
                 </div>
             </div>
        </div>
    );
};

export default SettingsSection;
