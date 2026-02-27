import React, { useState, useEffect } from 'react';
import SitesTab from './SiteAnalysis/SitesTab';
import LinksTab from './SiteAnalysis/LinksTab';
import TopologyTab from './SiteAnalysis/TopologyTab';

// ─── Main Panel ───────────────────────────────────────────────────────────────

const TABS = ['Sites', 'Links', 'Topology'];

const SiteAnalysisResultsPanel = ({
    results,
    interNodeLinks,
    totalUniqueCoverageKm2,
    onClose, // Kept for API compatibility, though not used in UI currently
    onCenter,
    onClear,
    onRunNew,
    units
}) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [activeTab, setActiveTab] = useState('Sites');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const panelStyle = {
        position: 'absolute',
        top: isMobile ? 'auto' : '25px',
        bottom: isMobile ? '0' : 'auto',
        right: isMobile ? '0' : '25px',
        left: isMobile ? '0' : 'auto',
        width: isMobile ? '100%' : '380px',
        maxHeight: isMinimized ? '60px' : (isMobile ? '85dvh' : '680px'),
        background: 'rgba(10, 10, 15, 0.98)',
        backdropFilter: 'blur(15px)',
        border: isMobile ? 'none' : '1px solid #00f2ff33',
        borderTop: '1px solid #00f2ff33',
        borderRadius: isMobile ? '20px 20px 0 0' : '12px',
        padding: '16px',
        paddingBottom: isMobile ? 'calc(32px + env(safe-area-inset-bottom))' : '16px',
        color: '#eee',
        zIndex: 2500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
    };

    const helpItems = {
        Sites: [
            { term: 'Elevation', def: 'Ground elevation at this location. Higher sites generally improve LOS coverage.' },
            { term: 'Coverage Area', def: 'Total terrain area visible from this site within the scan radius.' },
            { term: 'Unique Coverage', def: 'Percentage of this node\'s coverage area that is not covered by any other selected site. Low % = redundant placement.' },
            { term: 'Links', def: 'Number of other selected sites this node has a viable or degraded RF link to.' }
        ],
        Links: [
            { term: 'Viable', def: 'Fresnel zone ≥60% clear. Full link budget margin expected.' },
            { term: 'Degraded', def: 'Fresnel zone 0–60% clear. Link may work but with reduced margin.' },
            { term: 'Blocked', def: 'Terrain obstructs the direct LOS path. Link unlikely without relay.' },
            { term: 'Path Loss', def: 'Estimated Bullington diffraction + free-space path loss (dB). Compare to your link budget.' },
            { term: 'Fresnel', def: 'Fresnel zone clearance ratio at the most obstructed point. ≥60% is the target.' }
        ],
        Topology: [
            { term: 'Mesh Score', def: 'Percentage of all node pairs that can communicate (directly or via relay). 100% = fully connected mesh.' },
            { term: 'Multi-hop relay', def: 'A path with ≥2 hops means nodes that cannot reach each other directly can still pass traffic through an intermediate node.' }
        ]
    };

    return (
        <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 600, color: '#00f2ff' }}>
                        Site Analysis Results
                    </h3>
                    <div style={{ fontSize: '0.75em', color: '#666' }}>
                        {results.length} site{results.length !== 1 ? 's' : ''}
                        {totalUniqueCoverageKm2 != null && (
                            <span> · {units === 'imperial'
                                ? `${(totalUniqueCoverageKm2 * 0.386102).toFixed(2)} mi²`
                                : `${totalUniqueCoverageKm2.toFixed(2)} km²`} combined
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ color: '#00f2ff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                        style={{
                            cursor: 'pointer',
                            color: '#00f2ff',
                            fontSize: '14px',
                            padding: '4px 8px',
                            background: showHelp ? 'rgba(0,242,255,0.15)' : 'rgba(0,242,255,0.05)',
                            borderRadius: '4px',
                            border: '1px solid rgba(0,242,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>Help</span>
                    </div>
                    {isMinimized ? '▲' : '▼'}
                </div>
            </div>

            {/* Help Overlay */}
            {showHelp && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10,10,15,0.98)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid #00f2ff44',
                    borderRadius: isMobile ? '20px 20px 0 0' : '12px',
                    padding: '24px',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div style={{ color: '#00f2ff', fontWeight: 'bold', marginBottom: '12px', fontSize: '1.1em' }}>
                        {activeTab} — Field Guide
                    </div>
                    <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                        {(helpItems[activeTab] || []).map(({ term, def }) => (
                            <div key={term} style={{ marginBottom: '12px' }}>
                                <div style={{ color: '#00f2ff', fontWeight: 600 }}>{term}</div>
                                <div style={{ color: '#aaa', fontSize: '0.9em' }}>{def}</div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowHelp(false)}
                        style={{
                            marginTop: '12px', width: '100%',
                            background: 'rgba(0,242,255,0.1)', border: '1px solid #00f2ff66',
                            color: '#00f2ff', padding: '12px', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                        }}
                        onMouseOver={e => e.target.style.background = 'rgba(0,242,255,0.2)'}
                        onMouseOut={e => e.target.style.background = 'rgba(0,242,255,0.1)'}
                    >
                        Got it
                    </button>
                    <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
                </div>
            )}

            {/* Content */}
            {!isMinimized && (
                <>
                    {/* Tab bar */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        padding: '3px'
                    }}>
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    flex: 1,
                                    padding: '6px 0',
                                    background: activeTab === tab ? 'rgba(0,242,255,0.15)' : 'transparent',
                                    border: activeTab === tab ? '1px solid rgba(0,242,255,0.3)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    color: activeTab === tab ? '#00f2ff' : '#666',
                                    fontSize: '0.82em',
                                    fontWeight: activeTab === tab ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
                        {activeTab === 'Sites' && (
                            <SitesTab results={results} units={units} onCenter={onCenter} />
                        )}
                        {activeTab === 'Links' && (
                            <LinksTab results={results} interNodeLinks={interNodeLinks} units={units} />
                        )}
                        {activeTab === 'Topology' && (
                            <TopologyTab results={results} interNodeLinks={interNodeLinks} />
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={onRunNew}
                            style={{
                                padding: '10px',
                                background: 'rgba(0,242,255,0.15)',
                                color: '#00f2ff',
                                border: '1px solid rgba(0,242,255,0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.target.style.background = 'rgba(0,242,255,0.25)'}
                            onMouseOut={e => e.target.style.background = 'rgba(0,242,255,0.15)'}
                        >
                            Run New Analysis
                        </button>
                        <button
                            onClick={onClear}
                            style={{
                                padding: '10px',
                                background: 'rgba(255,50,50,0.1)',
                                color: '#ff4444',
                                border: '1px solid rgba(255,50,50,0.2)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9em'
                            }}
                            onMouseOver={e => e.target.style.background = 'rgba(255,50,50,0.2)'}
                            onMouseOut={e => e.target.style.background = 'rgba(255,50,50,0.1)'}
                        >
                            Clear Results
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SiteAnalysisResultsPanel;
