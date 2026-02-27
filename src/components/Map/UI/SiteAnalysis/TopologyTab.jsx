import React from 'react';
import { findMeshPaths, STATUS_COLORS, STATUS_LABELS } from '../../../../utils/meshTopology';

function statusBadge(status) {
    const color = STATUS_COLORS[status] || STATUS_COLORS.unknown;
    return (
        <span style={{
            fontSize: '0.7em',
            fontWeight: 700,
            color,
            border: `1px solid ${color}44`,
            background: `${color}18`,
            borderRadius: '4px',
            padding: '2px 6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        }}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

function TopologyTab({ results, interNodeLinks }) {
    const paths = findMeshPaths(results, interNodeLinks);

    const viableDirect = (interNodeLinks || []).filter(l => l.status === 'viable').length;
    const degradedDirect = (interNodeLinks || []).filter(l => l.status === 'degraded').length;
    const blockedDirect = (interNodeLinks || []).filter(l => l.status === 'blocked').length;

    const multihopViable = paths.filter(p => p.status !== 'blocked' && p.hops > 1).length;
    const totalPairs = paths.length;
    const reachable = paths.filter(p => p.status !== 'blocked').length;

    const meshScore = totalPairs > 0 ? Math.round((reachable / totalPairs) * 100) : 0;
    const meshScoreColor = meshScore >= 80 ? '#00f2ff' : meshScore >= 50 ? '#ffd700' : '#ff4444';

    return (
        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            {/* Mesh health summary */}
            <div style={{
                background: 'rgba(0,242,255,0.05)',
                border: '1px solid rgba(0,242,255,0.15)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
            }}>
                <div style={{ fontSize: '0.7em', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Mesh Connectivity Score
                </div>
                <div style={{ fontSize: '1.8em', fontWeight: 700, color: meshScoreColor, marginBottom: '4px' }}>
                    {meshScore}%
                </div>
                <div style={{ fontSize: '0.78em', color: '#666' }}>
                    {reachable} of {totalPairs} node pair{totalPairs !== 1 ? 's' : ''} reachable (direct or multi-hop)
                </div>
            </div>

            {/* Direct link summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                marginBottom: '12px'
            }}>
                {[
                    { label: 'Viable', count: viableDirect, color: '#00f2ff' },
                    { label: 'Degraded', count: degradedDirect, color: '#ffd700' },
                    { label: 'Blocked', count: blockedDirect, color: '#ff4444' }
                ].map(({ label, count, color }) => (
                    <div key={label} style={{
                        background: `${color}0c`,
                        border: `1px solid ${color}30`,
                        borderRadius: '6px',
                        padding: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.4em', fontWeight: 700, color }}>{count}</div>
                        <div style={{ fontSize: '0.65em', color: '#666', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                ))}
            </div>

            {multihopViable > 0 && (
                <div style={{
                    background: 'rgba(255,215,0,0.05)',
                    border: '1px solid rgba(255,215,0,0.15)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    marginBottom: '12px',
                    fontSize: '0.8em',
                    color: '#ffd700'
                }}>
                    {multihopViable} blocked pair{multihopViable !== 1 ? 's' : ''} reachable via multi-hop relay
                </div>
            )}

            {/* Path table */}
            {paths.length > 0 && (
                <>
                    <div style={{ fontSize: '0.7em', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>
                        All Paths
                    </div>
                    {paths.map((p, i) => {
                        const pathStr = p.path.map(idx => results[idx]?.name || `Site ${idx + 1}`).join(' → ');
                        return (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 8px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                fontSize: '0.82em'
                            }}>
                                <span style={{ color: '#bbb', flex: 1, marginRight: '8px', wordBreak: 'break-word' }}>
                                    {pathStr}
                                </span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                    {p.hops > 1 && (
                                        <span style={{ fontSize: '0.75em', color: '#666' }}>{p.hops} hops</span>
                                    )}
                                    {statusBadge(p.status)}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export default TopologyTab;
