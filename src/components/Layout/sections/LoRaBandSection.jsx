import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import { useRadio } from '../../../context/RadioContext';
import { RADIO_PRESETS } from '../../../data/presets';

const LoRaBandSection = ({ isOpen, onToggle }) => {
    const {
        selectedRadioPreset, setSelectedRadioPreset,
        freq, setFreq,
        bw, setBw,
        sf, setSf,
        cr, setCr
    } = useRadio();

    const isCustom = selectedRadioPreset === 'CUSTOM';

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

    const alwaysVisibleContent = (
        <div>
            <label style={labelStyle} htmlFor="radio-preset">Radio Preset</label>
            <select
                id="radio-preset"
                name="radio-preset"
                style={selectStyle}
                value={selectedRadioPreset}
                onChange={(e) => setSelectedRadioPreset(e.target.value)}
            >
                {Object.values(RADIO_PRESETS).map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
            </select>
        </div>
    );

    return (
        <CollapsibleSection
            title="LoRa Band"
            isOpen={isOpen}
            onToggle={onToggle}
            alwaysVisible={alwaysVisibleContent}
        >
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)'}}>
                <div>
                    <label style={labelStyle} htmlFor="radio-freq">Freq (MHz)</label>
                    <input
                        id="radio-freq"
                        name="radio-freq"
                        type="number"
                        style={inputStyle}
                        value={freq}
                        disabled={!isCustom}
                        onChange={(e) => isCustom && setFreq(e.target.value)}
                    />
                </div>
                 <div>
                    <label style={labelStyle} htmlFor="radio-bw">BW (kHz)</label>
                    <input
                        id="radio-bw"
                        name="radio-bw"
                        type="number"
                        style={inputStyle}
                        value={bw}
                        disabled={!isCustom}
                        onChange={(e) => isCustom && setBw(e.target.value)}
                    />
                </div>
                 <div>
                    <label style={labelStyle} htmlFor="radio-sf">SF</label>
                    <input
                        id="radio-sf"
                        name="radio-sf"
                        type="number"
                        style={inputStyle}
                        value={sf}
                        disabled={!isCustom}
                        onChange={(e) => isCustom && setSf(e.target.value)}
                    />
                </div>
                 <div>
                    <label style={labelStyle} htmlFor="radio-cr">CR</label>
                    <input
                        id="radio-cr"
                        name="radio-cr"
                        type="number"
                        style={inputStyle}
                        value={cr}
                        disabled={!isCustom}
                        onChange={(e) => isCustom && setCr(e.target.value)}
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default LoRaBandSection;
