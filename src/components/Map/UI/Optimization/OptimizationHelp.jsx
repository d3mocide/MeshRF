import React from 'react';

const OptimizationHelp = ({ showHelp, setShowHelp }) => {
    if (!showHelp) return null;

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
                Coverage Analysis Guide
            </div>
            <div style={{ color: '#ccc', marginBottom: '16px' }}>
                This tool identifies optimal reception locations that maximize signal strength and line-of-sight based on your transmitter.
            </div>
            <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0', color: '#bbb', flexGrow: 1 }}>
                <li style={{ marginBottom: '10px' }}><strong>Signal Quality:</strong> Sites are ranked by Line-of-Sight, Fresnel Zone clearance, and Signal Strength.</li>
                <li style={{ marginBottom: '10px' }}><strong>Coverage Radius:</strong> Scanning based on your selected radius.</li>
                <li style={{ marginBottom: '10px' }}><strong>Dynamic Re-scan:</strong> Drag the radius slider or click a new center to update coverage.</li>
            </ul>
            <button
                onClick={() => setShowHelp(false)}
                style={{
                    marginTop: 'auto',
                    width: '100%',
                    background: 'rgba(0, 242, 255, 0.1)',
                    border: '1px solid #00f2ff66',
                    color: '#00f2ff',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.target.style.background = 'rgba(0, 242, 255, 0.2)'}
                onMouseOut={e => e.target.style.background = 'rgba(0, 242, 255, 0.1)'}
            >
                Got it
            </button>
        </div>
    );
};

export default OptimizationHelp;
