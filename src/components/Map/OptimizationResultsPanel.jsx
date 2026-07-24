import React, { useState } from 'react';
import L from 'leaflet';

// Imported Sub-components
import OptimizationHelp from './UI/Optimization/OptimizationHelp';
import ScoringWeights from './UI/Optimization/ScoringWeights';
import ResultRow from './UI/Optimization/ResultRow';

const OptimizationResultsPanel = ({ results, weights, onCenter, onReset, onRecalculate }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const panelRef = React.useRef(null);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        // Prevent Map Interactions through Panel
        if (panelRef.current) {
            L.DomEvent.disableScrollPropagation(panelRef.current);
            L.DomEvent.disableClickPropagation(panelRef.current);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Fixed position panel logic
    const panelStyle = {
        position: 'absolute',
        top: isMobile ? 'auto' : '25px',
        bottom: isMobile ? '0' : 'auto',
        right: isMobile ? '0' : '25px',
        left: isMobile ? '0' : 'auto',
        width: isMobile ? '100%' : '360px',
        maxHeight: isMinimized ? '60px' : (isMobile ? '85dvh' : '600px'),
        background: 'rgba(10, 10, 15, 0.98)',
        backdropFilter: 'blur(15px)',
        border: isMobile ? 'none' : '1px solid #444',
        borderTop: isMobile ? '1px solid #555' : '1px solid #444',
        borderRadius: isMobile ? '20px 20px 0 0' : '8px',
        padding: '16px',
        paddingBottom: isMobile ? 'calc(32px + env(safe-area-inset-bottom))' : '16px',
        color: '#eee',
        zIndex: 2500, 
        boxShadow: isMobile ? '0 -8px 32px rgba(0,0,0,0.8)' : '0 8px 32px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
    };
    
    return (
        <div ref={panelRef} style={{ ...panelStyle }}>
            {/* Help Slide-down */}
            <OptimizationHelp showHelp={showHelp} setShowHelp={setShowHelp} results={results} />

            {/* Mobile Grab Handle */}
            {isMobile && (
                <div 
                    onClickCapture={() => setIsMinimized(!isMinimized)}
                    style={{
                        padding: '8px 0',
                        cursor: 'pointer',
                        width: '100%',
                        flexShrink: 0
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '4px',
                        background: '#666',
                        borderRadius: '2px',
                        margin: '0 auto',
                    }} />
                </div>
            )}

            {/* Header */}
            <div 
                onClickCapture={isMobile ? () => setIsMinimized(!isMinimized) : undefined}
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    cursor: isMobile ? 'pointer' : 'default',
                    flexShrink: 0
                }}
            >
                <h3 style={{ margin: 0, fontSize: '1.2em', fontWeight: 600, color: '#00f2ff' }}>
                    Top {results.length} Best Links
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                        onClickCapture={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                        style={{ 
                            cursor: 'pointer', 
                            color: '#00f2ff', 
                            fontSize: '14px', 
                            padding: '4px 8px',
                            background: showHelp ? 'rgba(0, 242, 255, 0.15)' : 'rgba(0, 242, 255, 0.05)',
                            borderRadius: '4px',
                            border: '1px solid rgba(0, 242, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Help</span>
                    </div>
                    {!isMobile && (
                        <button 
                            onClickCapture={(e) => {
                                e.stopPropagation();
                                setIsMinimized(!isMinimized);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '1em',
                                padding: '0 4px',
                                lineHeight: 1
                            }}
                            onMouseOver={e => e.target.style.color = '#fff'}
                            onMouseOut={e => e.target.style.color = '#666'}
                            title={isMinimized ? "Expand" : "Minimize"}
                        >
                            {isMinimized ? '▼' : '▲'}
                        </button>
                    )}
                    {isMobile && (
                        <span style={{ 
                            fontSize: '0.8em', 
                            color: '#666', 
                            transform: isMinimized ? 'rotate(0deg)' : 'rotate(180deg)', 
                            transition: 'transform 0.3s' 
                        }}>
                            ▼
                        </span>
                    )}
                </div>
            </div>

            {/* Scoring Weights Section */}
            <ScoringWeights weights={weights} isMinimized={isMinimized} />

            {/* Results List - Only show if not minimized or on desktop */}
            <div style={{ 
                overflowY: 'auto', 
                flexGrow: 1, 
                paddingRight: '4px',
                opacity: isMinimized ? 0 : 1,
                pointerEvents: isMinimized ? 'none' : 'auto',
                transition: 'opacity 0.2s'
            }}>
                {results.map((node, index) => (
                    <ResultRow
                        key={index}
                        node={node}
                        index={index}
                        onCenter={onCenter}
                    />
                ))}
            </div>

            <div style={{ 
                marginTop: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                alignItems: 'center',
                opacity: isMinimized ? 0 : 1,
                pointerEvents: isMinimized ? 'none' : 'auto',
                transition: 'opacity 0.2s',
                flexShrink: 0
            }}>
                 <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                        onClickCapture={() => {
                            import('../../utils/rfService').then(({ exportResults }) => {
                                exportResults(results, 'csv');
                            });
                        }}
                        style={{
                            flex: 1, padding: '8px', 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            color: '#ccc', border: '1px solid #444', 
                            borderRadius: '8px', cursor: 'pointer', fontSize: '0.85em'
                        }}
                        title="Download CSV"
                        onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        Export CSV
                    </button>
                    <button 
                        onClickCapture={() => {
                            import('../../utils/rfService').then(({ exportResults }) => {
                                exportResults(results, 'kml');
                            });
                        }}
                        style={{
                            flex: 1, padding: '8px', 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            color: '#ccc', border: '1px solid #444', 
                            borderRadius: '8px', cursor: 'pointer', fontSize: '0.85em'
                        }}
                        title="Download KML (Google Earth)"
                        onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        Export KML
                    </button>
                 </div>

                 {/* Recalculate Button */}
                 <button 
                    onClickCapture={onRecalculate}
                    style={{
                        padding: '8px 24px', 
                        background: 'rgba(0, 242, 255, 0.15)', 
                        color: '#00f2ff', 
                        border: '1px solid rgba(0, 242, 255, 0.3)', 
                        borderRadius: '20px', 
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        fontWeight: '600'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = 'rgba(0, 242, 255, 0.25)';
                        e.target.style.borderColor = 'rgba(0, 242, 255, 0.5)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = 'rgba(0, 242, 255, 0.15)';
                        e.target.style.borderColor = 'rgba(0, 242, 255, 0.3)';
                    }}
                 >
                    Recalculate Area
                 </button>

                 <button 
                    onClickCapture={onReset}
                    style={{
                        padding: '8px 24px', 
                        background: 'rgba(255, 50, 50, 0.15)', 
                        color: '#ff4d4d', 
                        border: '1px solid rgba(255, 50, 50, 0.3)', 
                        borderRadius: '20px', 
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        transition: 'all 0.2s ease',
                        width: '100%'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = 'rgba(255, 50, 50, 0.25)';
                        e.target.style.borderColor = 'rgba(255, 50, 50, 0.5)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = 'rgba(255, 50, 50, 0.15)';
                        e.target.style.borderColor = 'rgba(255, 50, 50, 0.3)';
                    }}
                 >
                    Clear Results
                 </button>
            
                 <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Click a spot to center map
                 </div>
            </div>
        </div>
    );
};

export default OptimizationResultsPanel;
