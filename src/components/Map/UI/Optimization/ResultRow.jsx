import React from 'react';

const ResultRow = ({ node, index, onCenter }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
            onClick={() => onCenter(node)}
            onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(0, 242, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.3)';
            }}
            onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            }}
        >
            {/* Rank Badge */}
            <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 255, 0.15)',
                border: '1px solid rgba(0, 242, 255, 0.5)',
                color: '#00f2ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '12px',
                fontSize: '0.9em'
            }}>
                {index + 1}
            </div>

            {/* Info */}
            <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                    <span style={{ color: '#00f2ff', fontWeight: 700, fontSize: '1.1em' }}>{node.score}</span>
                    <span style={{ color: '#bbb', fontSize: '0.9em' }}>Score</span>
                </div>
                <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                    Elev: <span style={{ color: '#fff' }}>{Math.round(node.elevation)}m</span>
                    {node.prominence > 5 && (
                        <span style={{ marginLeft: '8px', color: '#ffd700', fontSize: '0.85em' }}>
                            ★ Prom: {Math.round(node.prominence)}m
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '0.75em', color: '#666', fontFamily: 'monospace', marginTop: '2px' }}>
                    {node.lat.toFixed(5)}, {node.lon.toFixed(5)}
                </div>
            </div>

            {/* Arrow */}
            <div style={{ color: '#444' }}>›</div>
        </div>
    );
};

export default ResultRow;
