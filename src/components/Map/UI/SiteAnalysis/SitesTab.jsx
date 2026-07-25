import React from 'react';

function SitesTab({ results, units, onCenter }) {
    return (
        <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }}>
            {results.map((res, index) => {
                const connScore = res.connectivity_score ?? 0;
                const connMax = results.length - 1;
                const connColor = connMax === 0 ? '#888'
                    : connScore === connMax ? '#00f2ff'
                    : connScore > 0 ? '#ffd700'
                    : '#ff4444';

                const uniquePct = res.unique_coverage_pct ?? 100;
                const uniqueColor = uniquePct >= 70 ? '#00f2ff'
                    : uniquePct >= 30 ? '#ffd700'
                    : '#ff4444';

                return (
                    <div
                        key={index}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => onCenter(res)}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(0,242,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(0,242,255,0.2)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {res.color && (
                                    <span
                                        title="Coverage color on map"
                                        style={{
                                            display: 'inline-block',
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            backgroundColor: res.color,
                                            boxShadow: `0 0 6px ${res.color}`,
                                            flexShrink: 0
                                        }}
                                    />
                                )}
                                {res.name || `Site ${index + 1}`}
                            </span>
                            <span style={{ color: '#00f2ff', fontSize: '0.75em', fontFamily: 'monospace' }}>
                                {res.lat.toFixed(4)}, {res.lon.toFixed(4)}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <div style={{ fontSize: '0.65em', color: '#888', textTransform: 'uppercase' }}>Elevation</div>
                                <div style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: '1.0em' }}>
                                    {units === 'imperial'
                                        ? `${(res.elevation * 3.28084).toFixed(1)} ft`
                                        : `${res.elevation} m`}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65em', color: '#888', textTransform: 'uppercase' }}>Coverage Area</div>
                                <div style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: '1.0em' }}>
                                    {units === 'imperial'
                                        ? `${(res.coverage_area_km2 * 0.386102).toFixed(2)} mi²`
                                        : `${res.coverage_area_km2} km²`}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65em', color: '#888', textTransform: 'uppercase' }}>Unique Coverage</div>
                                <div style={{ color: uniqueColor, fontWeight: 'bold', fontSize: '1.0em' }}>
                                    {uniquePct.toFixed(0)}%
                                    <span style={{ fontSize: '0.75em', color: '#666', marginLeft: '4px' }}>
                                        ({units === 'imperial'
                                            ? `${((res.marginal_coverage_km2 || 0) * 0.386102).toFixed(2)} mi²`
                                            : `${(res.marginal_coverage_km2 || 0).toFixed(2)} km²`})
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65em', color: '#888', textTransform: 'uppercase' }}>Links</div>
                                <div style={{ color: connColor, fontWeight: 'bold', fontSize: '1.0em' }}>
                                    {connScore}/{connMax} nodes
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default SitesTab;
