import React from 'react';
import PropTypes from 'prop-types';

const ModelComparisonTable = ({ onClose }) => {
    return (
        <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(10, 10, 15, 0.98)',
            backdropFilter: 'blur(15px)',
            border: '1px solid #00f2ff44',
            borderRadius: '8px',
            padding: '24px',
            zIndex: 3000,
            boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{ color: '#00f2ff', fontWeight: 'bold', marginBottom: '16px', fontSize: '1.2em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Propagation Model Guide
            </div>
            <div style={{ color: '#ccc', marginBottom: '16px' }}>
                The engine uses physical models to predict signal strength across the terrain.
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '12px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px', fontSize: '0.9em' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#00f2ff' }}>Quick Guide:</strong>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#00f2ff' }}>Longley-Rice ITM:</strong> Full NTIA implementation running in browser (WASM). Uses terrain, diffraction, and troposcatter. Most accurate.
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#00f2ff' }}>FSPL:</strong> Idealized "Line of Sight" calculation. Best for very short distances or space-to-earth links.
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#00f2ff' }}>Okumura-Hata:</strong> Statistical model based on city measurements. Accounts for clutter and building density.
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#00f2ff' }}>Bullington:</strong> Primary terrain-aware model for terrestrial links. Accounts for diffraction over hills.
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#bbb' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                            <th style={{ padding: '8px 4px' }}>Model</th>
                            <th style={{ padding: '8px 4px' }}>Recommended Use Case</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 'bold', color: '#00f2ff' }}>ITM (WASM)</td>
                            <td style={{ padding: '8px 4px' }}>General Purpose / Accurate</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>FSPL</td>
                            <td style={{ padding: '8px 4px' }}>Bench tests & Space links</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 'bold', color: '#fff' }}>Hata</td>
                            <td style={{ padding: '8px 4px' }}>City-wide Mesh Planning</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px 4px', fontWeight: 'bold', color: '#00ff41' }}>Bullington</td>
                            <td style={{ padding: '8px 4px' }}>Long-range Rural / Hills</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ marginTop: '20px', marginBottom: '8px', padding: '16px', background: 'rgba(0, 242, 255, 0.03)', border: '1px solid rgba(0, 242, 255, 0.15)', borderRadius: '8px' }}>
                    <div style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Propagation Analysis Note
                    </div>
                    <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#00f2ff', fontWeight: '600' }}>Statistical (Hata)</span> ignores terrain and assumes flat ground. This results in heavy signal penalties for high-elevation links.
                        </div>
                        <div style={{ color: '#ccc' }}>
                            <span style={{ color: '#00ff41', fontWeight: '600' }}>Terrain (Bullington)</span> accounts for hills and clear line-of-sight, providing accurate high-performance predictions for Mesh nodes.
                        </div>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                style={{
                    flexShrink: 0,
                    width: '100%',
                    background: '#0a0a0f', // Opaque dark background
                    border: '1px solid #00f2ff88',
                    color: '#00f2ff',
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 -8px 24px rgba(0,0,0,0.8)' // Stronger shadow to lift from content
                }}
                onMouseOver={e => e.target.style.background = 'rgba(0, 242, 255, 0.1)'}
                onMouseOut={e => e.target.style.background = '#0a0a0f'}
            >
                Got it
            </button>
        </div>
    );
};

ModelComparisonTable.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default ModelComparisonTable;
