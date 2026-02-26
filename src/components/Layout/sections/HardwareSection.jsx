import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import { useHardware } from '../../../context/HardwareContext';
import { useUI } from '../../../context/UIContext';
import { useEnvironment } from '../../../context/EnvironmentContext';
import { useRadio } from '../../../context/RadioContext';
import { DEVICE_PRESETS, ANTENNA_PRESETS, CABLE_TYPES } from '../../../data/presets';

const HardwareSection = ({ isOpen, onToggle }) => {
    const {
        editMode,
        selectedDevice, setSelectedDevice,
        selectedAntenna, setSelectedAntenna,
        antennaGain, setAntennaGain,
        antennaHeight, setAntennaHeight,
        selectedCableType, setSelectedCableType,
        cableLength, setCableLength,
        txPower, setTxPower,
        erp, cableLoss
    } = useHardware();

    const { toolMode, units } = useUI();
    const { rxHeight, setRxHeight } = useEnvironment();
    const { triggerRecalc } = useRadio();

    const isCustomAntenna = selectedAntenna === 'CUSTOM';

    const labelStyle = {
        display: 'block',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
        marginBottom: 'var(--spacing-xs)',
        marginTop: 'var(--spacing-sm)'
    };

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

    const handleTxPowerChange = (e) => {
        const val = Number(e.target.value);
        const max = DEVICE_PRESETS[selectedDevice]?.tx_power_max || 22;
        setTxPower(Math.min(val, max));
    };

    return (
        <CollapsibleSection
            title={editMode === 'GLOBAL' ? 'Hardware Config' : 'Node Hardware'}
            isOpen={isOpen}
            collapsible={false}
            onToggle={onToggle}
        >
            <div style={{ paddingLeft: editMode !== 'GLOBAL' ? '12px' : '0', borderLeft: editMode !== 'GLOBAL' ? `3px solid ${editMode === 'A' ? '#00ff41' : '#ff0000'}` : 'none' }}>

            <label style={labelStyle} htmlFor="device-preset">Device Preset</label>
            <select
                id="device-preset"
                name="device-preset"
                style={selectStyle}
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
            >
                {Object.values(DEVICE_PRESETS).map(device => (
                    <option key={device.id} value={device.id}>{device.name}</option>
                ))}
            </select>

            <label style={labelStyle} htmlFor="antenna-type">Antenna Type</label>
            <select
                id="antenna-type"
                name="antenna-type"
                style={selectStyle}
                value={selectedAntenna}
                onChange={(e) => setSelectedAntenna(e.target.value)}
            >
                 {Object.values(ANTENNA_PRESETS).map(ant => (
                    <option key={ant.id} value={ant.id}>
                        {ant.name} ({ant.gain} dBi)
                    </option>
                ))}
            </select>

            {isCustomAntenna && (
                <div>
                     <label style={labelStyle} htmlFor="custom-gain">Custom Gain (dBi)</label>
                     <input
                        id="custom-gain"
                        name="custom-gain"
                        type="number"
                        style={inputStyle}
                        value={antennaGain}
                        onChange={(e) => setAntennaGain(Number(e.target.value))}
                    />
                </div>
            )}

            <label style={labelStyle} htmlFor="antenna-height">
                Antenna Height: {units === 'imperial' ? `${(antennaHeight * 3.28084).toFixed(0)} ft` : `${antennaHeight} m`}
            </label>
            <input
                id="antenna-height"
                name="antenna-height"
                aria-label="Antenna Height"
                type="range"
                min="1" max="50"
                value={antennaHeight}
                onChange={(e) => setAntennaHeight(Number(e.target.value))}
                style={{
                    '--range-progress': `${((antennaHeight - 1) / 49) * 100}%`,
                    '--range-color': '#a855f7'
                }}
            />

            {/* RX Height Slider - Only for RF Coverage Tool */}
            {toolMode === 'rf_coverage' && (
                <div style={{marginTop: 'var(--spacing-md)'}}>
                    <label style={labelStyle} htmlFor="rx-height">
                        Receiver Height: {units === 'imperial' ? `${(rxHeight * 3.28084).toFixed(0)} ft` : `${rxHeight} m`}
                        <span style={{color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '0.8em'}}>
                            ({rxHeight <= 2 ? 'Handheld' : rxHeight <= 5 ? 'Vehicle' : 'Mast'})
                        </span>
                    </label>
                    <input
                        id="rx-height"
                        name="rx-height"
                        type="range"
                        min="1" max="30" steps="1"
                        value={rxHeight}
                        onChange={(e) => setRxHeight(Number(e.target.value))}
                        style={{
                            '--range-progress': `${((rxHeight - 1) / 29) * 100}%`,
                            '--range-color': 'var(--color-secondary)'
                        }}
                    />
                </div>
            )}

            {/* CABLE CONFIGURATION */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)'}}>
                <div>
                    <label style={labelStyle} htmlFor="cable-type">Cable Type</label>
                    <select
                        id="cable-type"
                        name="cable-type"
                        style={selectStyle}
                        value={selectedCableType}
                        onChange={(e) => setSelectedCableType(e.target.value)}
                    >
                        {Object.values(CABLE_TYPES).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={labelStyle} htmlFor="cable-length">Length ({units === 'imperial' ? 'ft' : 'm'})</label>
                    <input
                        id="cable-length"
                        name="cable-length"
                        type="number"
                        min="0" step="0.5"
                        style={inputStyle}
                        value={units === 'imperial' ? (cableLength * 3.28084).toFixed(1) : cableLength}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            // Store in meters always
                            setCableLength(units === 'imperial' ? val / 3.28084 : val);
                        }}
                    />
                </div>
            </div>

            <label style={labelStyle} htmlFor="tx-power">
                TX Power (dBm): {txPower}
                <span style={{color: 'var(--color-secondary)', marginLeft: '8px'}}>
                    (Max: {DEVICE_PRESETS[selectedDevice]?.tx_power_max || 22})
                </span>
            </label>
            <input
                id="tx-power"
                name="tx-power"
                type="range"
                min="0"
                max={DEVICE_PRESETS[selectedDevice]?.tx_power_max || 22}
                value={txPower}
                onChange={handleTxPowerChange}
                style={{ '--range-progress': `${(txPower / (DEVICE_PRESETS[selectedDevice]?.tx_power_max || 22)) * 100}%` }}
            />

            {/* Manual Recalculation Trigger */}
            <button
                onClick={triggerRecalc}
                style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '8px',
                    background: 'rgba(0, 255, 65, 0.1)',
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(0, 255, 65, 0.2)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(0, 255, 65, 0.1)'}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                 Update Calculation
            </button>

            {/* ERP CALCULATION DISPLAY */}
            <div style={{
                marginTop: 'var(--spacing-md)',
                marginBottom: '12px',
                padding: 'var(--spacing-sm)',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
            }}>
                <label style={{fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase'}}>Estimated ERP</label>
                <div style={{fontSize: '1.2rem', color: 'var(--color-primary)', fontWeight: 'bold'}}>
                    {erp} dBm
                </div>
                <div style={{fontSize: '0.7rem', color: 'var(--color-text-muted)'}}>
                    (TX {txPower} + Gain {antennaGain} - Loss {cableLoss})
                </div>

                {/* DOCUMENTATION LINK */}
                <a
                    href="https://github.com/d3mocide/MeshRF/tree/main/Documentation"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: 'rgba(0, 242, 255, 0.05)',
                        border: '1px solid rgba(0, 242, 255, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px',
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        marginTop: '12px'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 242, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 242, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.2)';
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    View Documentation
                </a>

            </div>
            </div>
        </CollapsibleSection>
    );
};

export default HardwareSection;
