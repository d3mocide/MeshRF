import React from 'react';
import PropTypes from 'prop-types';

const LinkBudgetDisplay = ({ distDisplay, margin, statusColor, budget, clearanceDisplay, diffractionLoss }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9em', marginBottom: '16px', flexShrink: 0 }}>
            <div>
                <div style={{ color: '#888', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
                <div style={{ fontSize: '1.2em', fontWeight: 600, color: '#fff' }}>{distDisplay}</div>
            </div>
            <div>
                <div style={{ color: '#888', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Margin</div>
                <div style={{ fontSize: '1.2em', fontWeight: 600, color: statusColor }}>{margin} dB</div>
            </div>
            <div>
                <div style={{ color: '#888', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RSSI</div>
                <div style={{ fontSize: '1.1em', color: '#00f2ff', fontWeight: 600 }}>{budget ? budget.rssi : '--'} dBm</div>
            </div>
            <div>
                <div style={{ color: '#888', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Fresnel</div>
                <div style={{ fontSize: '1.1em', color: '#fff', fontWeight: 600 }}>{clearanceDisplay}</div>
            </div>
            {diffractionLoss > 0 && (
                 <div style={{ gridColumn: 'span 2', marginTop: '4px', padding: '4px', background: 'rgba(255, 0, 0, 0.2)', borderRadius: '4px' }}>
                    <div style={{ color: '#ffaaaa', fontSize: '0.85em' }}>Obstruction Loss</div>
                    <div style={{ fontSize: '1.1em', fontWeight: 600, color: '#ff4444' }}>-{diffractionLoss} dB</div>
                </div>
            )}
        </div>
    );
};

LinkBudgetDisplay.propTypes = {
    distDisplay: PropTypes.string.isRequired,
    margin: PropTypes.number.isRequired,
    statusColor: PropTypes.string.isRequired,
    budget: PropTypes.object,
    clearanceDisplay: PropTypes.string.isRequired,
    diffractionLoss: PropTypes.number.isRequired
};

export default LinkBudgetDisplay;
