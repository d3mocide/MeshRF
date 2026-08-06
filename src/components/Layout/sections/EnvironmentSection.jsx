import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import { useEnvironment, GROUND_TYPES, CLIMATE_ZONES, RELIABILITY_MODES } from '../../../context/EnvironmentContext';

const EnvironmentSection = ({ isOpen, onToggle }) => {
    const {
        kFactor, setKFactor,
        clutterHeight, setClutterHeight,
        groundType, setGroundType,
        climate, setClimate,
        fadeMargin, setFadeMargin,
        reliabilityMode, setReliabilityMode, variability
    } = useEnvironment();

    const inputStyle = {
        width: '100%',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-main)',
        padding: 'var(--spacing-sm)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'monospace'
    };

    const selectStyle = {
        ...inputStyle,
        cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2300f2ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        backgroundSize: '16px',
        paddingRight: '32px',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none'
    };

    return (
        <CollapsibleSection
            title="Environment"
            isOpen={isOpen}
            onToggle={onToggle}
            isITM={true}
        >
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                 <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                     <div>
                         <label style={{fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '4px'}} htmlFor="k-factor">
                             Refraction (K)
                         </label>
                         <input
                            type="number"
                            step="0.01"
                            id="k-factor"
                            name="k-factor"
                            value={kFactor}
                            onChange={(e) => setKFactor(parseFloat(e.target.value))}
                            style={{...inputStyle, padding: '6px', fontSize: '0.9em'}}
                         />
                     </div>
                     <div>
                         <label style={{fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '4px'}} htmlFor="clutter-height">
                             Clutter (m)
                         </label>
                         <input
                            type="number"
                            step="1"
                            id="clutter-height"
                            name="clutter-height"
                            value={clutterHeight}
                            onChange={(e) => setClutterHeight(parseFloat(e.target.value))}
                            style={{...inputStyle, padding: '6px', fontSize: '0.9em'}}
                         />
                     </div>
                 </div>

                 {/* Ground Type */}
                 <div>
                    <label style={{fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '4px'}}>Ground Type</label>
                    <select
                        value={groundType}
                        onChange={(e) => setGroundType(e.target.value)}
                        style={{...selectStyle, padding: '6px', fontSize: '0.9em', width: '100%'}}
                    >
                        {Object.keys(GROUND_TYPES).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                 </div>

                 {/* Climate Zone */}
                 <div>
                    <label style={{fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '4px'}}>Climate Zone</label>
                    <select
                        value={climate}
                        onChange={(e) => setClimate(Number(e.target.value))}
                        style={{...selectStyle, padding: '6px', fontSize: '0.9em', width: '100%'}}
                    >
                        {Object.entries(CLIMATE_ZONES).map(([id, name]) => (
                            <option key={id} value={id}>{id} - {name}</option>
                        ))}
                    </select>
                 </div>

                 {/* Reliability / ITM Variability (ROADMAP P4-6) */}
                 <div>
                    <label style={{fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '4px'}} htmlFor="reliability-mode">
                        Reliability (ITM Variability)
                    </label>
                    <select
                        id="reliability-mode"
                        name="reliability-mode"
                        value={reliabilityMode}
                        onChange={(e) => setReliabilityMode(e.target.value)}
                        style={{...selectStyle, padding: '6px', fontSize: '0.9em', width: '100%'}}
                    >
                        {Object.values(RELIABILITY_MODES).map(mode => (
                            <option key={mode.id} value={mode.id}>{mode.name}</option>
                        ))}
                    </select>
                    <div style={{fontSize: '0.7em', color: '#666', marginTop: '4px', lineHeight: '1.4'}}>
                        {variability.description}
                        <div style={{color: '#555', marginTop: '2px', fontFamily: 'monospace'}}>
                            time/loc/situation: {variability.time}/{variability.loc}/{variability.sit}
                        </div>
                    </div>
                 </div>

                 {/* Fade Margin */}
                 <div>
                     <label style={{fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '4px'}} htmlFor="fade-margin">
                         Fade Margin (dB)
                     </label>
                     <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                         <input
                            type="range"
                            min="0" max="20" step="1"
                            id="fade-margin"
                            name="fade-margin"
                            value={fadeMargin}
                            onChange={(e) => setFadeMargin(Number(e.target.value))}
                            style={{ '--range-progress': `${(fadeMargin / 20) * 100}%` }}
                         />

                         <span style={{fontSize: '0.9em', color: '#fff', width: '24px', textAlign: 'right', fontWeight: 'bold'}}>{fadeMargin}</span>
                     </div>
                 </div>

            </div>
        </CollapsibleSection>
    );
};

export default EnvironmentSection;
