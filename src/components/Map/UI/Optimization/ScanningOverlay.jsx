import React from 'react';

const ScanningOverlay = () => {
    return (
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 10, 15, 0.75)',
            color: '#00f2ff',
            padding: '40px 60px',
            borderRadius: '24px',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 255, 0.1)',
            zIndex: 2000,
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            minWidth: '300px'
        }}>
            <div className="spinner" style={{
                width: '48px', height: '48px',
                border: '3px solid rgba(0, 242, 255, 0.1)',
                borderTop: '3px solid #00f2ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                boxShadow: '0 0 15px rgba(0, 242, 255, 0.3)'
            }}></div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
            `}</style>
            <div style={{ fontSize: '1.2em', fontWeight: '600', letterSpacing: '1px', animation: 'pulse-text 2s ease-in-out infinite' }}>SCANNING COVERAGE</div>
            <div style={{ fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.6)' }}>Calculating RF propagation paths...</div>
        </div>
    );
};

export default ScanningOverlay;
