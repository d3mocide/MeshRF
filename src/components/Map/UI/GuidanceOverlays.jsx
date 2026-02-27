import React from 'react';
import { HELP_CONTENT } from '../../../data/helpContent';

const GuidanceOverlays = ({ 
    toolMode, 
    nodes, 
    optimizeState, 
    isMobile,
    viewshedObserver,
    rfObserver,
    siteAnalysisMode,
    // Help Toggles
    linkHelp, setLinkHelp,
    elevationHelp, setElevationHelp,
    viewshedHelp, setViewshedHelp,
    rfHelp, setRFHelp,
    isResultsVisible
}) => {
    if (isResultsVisible) return null;

    const overlayStyle = {
        position: 'absolute',
        top: isMobile ? '120px' : 'auto',
        bottom: isMobile ? 'auto' : 'calc(40px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid #00f2ff88',
        borderRadius: '12px',
        padding: '12px 24px',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        animation: 'slideUp 0.3s ease-out',
        minWidth: '280px',
        maxWidth: '90vw'
    };

    const renderHelpContent = (contentKey, isOpen, toggleHelp, titleColor = '#00f2ff') => {
        const content = HELP_CONTENT[contentKey];
        if (!content) return null;

        return (
            <div style={{width: '100%'}}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: titleColor }}>
                        {content.title}
                    </div>
                    <div 
                      onClick={() => toggleHelp(!isOpen)}
                      style={{ 
                          cursor: 'pointer', 
                          color: titleColor,
                          fontSize: '14px', 
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                      }}
                    >
                        <span>{isOpen ? 'Hide' : 'Help'}</span>
                    </div>
                </div>
                
                {!isOpen && (
                  <div style={{ fontSize: '14px', color: '#ccc', textAlign: 'center' }}>
                      {content.summary}
                  </div>
                )}
    
                {isOpen && (
                    <div style={{ 
                        marginTop: '12px', 
                        fontSize: '0.85em', 
                        color: '#ddd', 
                        borderTop: '1px solid rgba(255,255,255,0.1)', 
                        paddingTop: '12px',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        width: '100%'
                    }}>
                        <div style={{ fontWeight: 'bold', color: titleColor, marginBottom: '4px' }}>{content.title}</div>
                        <div style={{ marginBottom: '8px' }}>{content.summary}</div>
                        <ul style={{ paddingLeft: '18px', margin: 0, color: '#bbb' }}>
                            {content.steps.map((step, idx) => (
                                <li key={idx}><strong>{step}</strong></li>
                            ))}
                            {content.extra && (
                                <li style={{ marginTop: '4px', color: titleColor }}>{content.extra}</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
        {/* Contextual Guidance Overlays */}
        {toolMode === 'link' && nodes.length < 2 && (
            <div style={{ ...overlayStyle, border: '1px solid #00ff4188' }}>
                {renderHelpContent('link', linkHelp, setLinkHelp, '#00ff41')}
            </div>
        )}
    
        {/* Elevation Scan (Auto Mode) */}
        {toolMode === 'optimize' && siteAnalysisMode === 'auto' && !optimizeState.loading && optimizeState.ghostNodes?.length === 0 && (
            <div style={overlayStyle}>
                {renderHelpContent('coverage', elevationHelp, setElevationHelp, '#00f2ff')}
            </div>
        )}

        {/* Multi-Site Manager (Manual Mode) */}
        {toolMode === 'optimize' && siteAnalysisMode === 'manual' && (
            <div style={overlayStyle}>
                {renderHelpContent('multiSite', elevationHelp, setElevationHelp, '#00f2ff')}
            </div>
        )}
    
        {((toolMode === 'viewshed' && !viewshedObserver) || (toolMode === 'rf_coverage' && !rfObserver)) && (
            <div style={{
                ...overlayStyle,
                border: toolMode === 'viewshed' ? '1px solid #a855f788' : '1px solid #ff6b0088',
            }}>
                {toolMode === 'viewshed'
                    ? renderHelpContent('viewshed', viewshedHelp, setViewshedHelp, '#a855f7')
                    : renderHelpContent('rfSimulator', rfHelp, setRFHelp, '#ff6b00')
                }
            </div>
        )}
        </>
    );
};

export default GuidanceOverlays;
