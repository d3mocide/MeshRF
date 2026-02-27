import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../../../utils/meshTopology';

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

function LinksTab({ results, interNodeLinks, units }) {
    if (!interNodeLinks || interNodeLinks.length === 0) {
        return (
            <div style={{ color: '#666', textAlign: 'center', padding: '24px', fontSize: '0.9em' }}>
                {results.length < 2
                    ? 'Add at least 2 sites to see link analysis.'
                    : 'No link data available.'}
            </div>
        );
    }

    const sortedLinks = [...interNodeLinks].sort((a, b) => {
        const order = { viable: 0, degraded: 1, blocked: 2, unknown: 3 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

    return (
        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            <div style={{ fontSize: '0.75em', color: '#666', marginBottom: '10px' }}>
                {interNodeLinks.length} link{interNodeLinks.length !== 1 ? 's' : ''} between {results.length} sites
            </div>
            {sortedLinks.map((link, i) => {
                const color = STATUS_COLORS[link.status] || '#888';
                return (
                    <div
                        key={i}
                        style={{
                            background: `${color}08`,
                            border: `1px solid ${color}25`,
                            borderLeft: `3px solid ${color}`,
                            borderRadius: '6px',
                            padding: '10px 12px',
                            marginBottom: '8px',
                            fontSize: '0.88em'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>
                                {link.node_a_name} → {link.node_b_name}
                            </span>
                            {statusBadge(link.status)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', color: '#aaa', fontSize: '0.9em' }}>
                            <div>
                                <div style={{ color: '#555', fontSize: '0.8em', textTransform: 'uppercase' }}>Distance</div>
                                <div style={{ color: '#ccc' }}>
                                    {units === 'imperial'
                                        ? `${(link.dist_km * 0.621371).toFixed(2)} mi`
                                        : `${link.dist_km.toFixed(2)} km`}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#555', fontSize: '0.8em', textTransform: 'uppercase' }}>Path Loss</div>
                                <div style={{ color: '#ccc' }}>{link.path_loss_db} dB</div>
                            </div>
                            <div>
                                <div style={{ color: '#555', fontSize: '0.8em', textTransform: 'uppercase' }}>Fresnel</div>
                                <div style={{ color: link.min_clearance_ratio >= 0.6 ? '#00f2ff' : link.min_clearance_ratio >= 0 ? '#ffd700' : '#ff4444' }}>
                                    {link.min_clearance_ratio > 50 ? 'Clear' : `${(link.min_clearance_ratio * 100).toFixed(0)}%`}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default LinksTab;
