import React from 'react';

const ScoringWeights = ({ weights, isMinimized }) => {
    if (!weights || isMinimized) return null;

    return (
        <div style={{
            background: 'rgba(0, 242, 255, 0.05)',
            border: '1px solid rgba(0, 242, 255, 0.15)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '16px',
            flexShrink: 0
        }}>
            <div style={{
                color: '#00f2ff',
                fontSize: '0.85em',
                fontWeight: 600,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Scoring Weights
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                fontSize: '0.8em'
            }}>
                <div style={{ color: '#bbb' }}>
                    <span style={{ color: '#b19cd9', fontWeight: 600 }}>Elevation:</span> {weights.elevation}%
                </div>
                <div style={{ color: '#bbb' }}>
                    <span style={{ color: '#ff9500', fontWeight: 600 }}>Prominence:</span> {weights.prominence}%
                </div>
                <div style={{ color: '#bbb' }}>
                    <span style={{ color: '#00ff41', fontWeight: 600 }}>Fresnel:</span> {weights.fresnel}%
                </div>
            </div>
        </div>
    );
};

export default ScoringWeights;
