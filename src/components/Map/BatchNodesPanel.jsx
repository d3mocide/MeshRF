import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import BatchNodesList from './UI/BatchNodesList';

const BatchNodesPanel = ({ nodes, selectedNodes = [], onCenter, onClear, onNodeSelect, forceMinimized = false }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const panelRef = useRef(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (forceMinimized) setIsMinimized(true);
    }, [forceMinimized]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent map zoom when scrolling inside the panel
    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const handleWheel = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const scrollableDiv = panel.querySelector('.batch-nodes-scrollable');
            if (scrollableDiv) scrollableDiv.scrollTop += e.deltaY;
        };

        panel.addEventListener('wheel', handleWheel, { passive: false });
        L.DomEvent.disableClickPropagation(panel);
        L.DomEvent.disableScrollPropagation(panel);
        
        return () => panel.removeEventListener('wheel', handleWheel);
    }, []);

    if (isMinimized) {
        return (
            <div 
                ref={panelRef}
                data-batch-panel="true"
                onWheel={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute',
                    top: isMobile ? '125px' : 'auto',
                    bottom: isMobile ? 'auto' : '25px',
                    left: '60px',
                    background: '#222',
                    backdropFilter: 'none',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    padding: '0 12px',
                    height: '36px',
                    color: '#eee',
                    zIndex: 1100,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}
            onClickCapture={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
            }}
            >
                <span style={{ fontSize: '0.9em', fontWeight: 600, color: '#00f2ff' }}>
                    Batch Nodes ({nodes.length})
                </span>
                <span style={{ fontSize: '0.8em', color: '#666' }}>▲</span>
            </div>
        );
    }

    return (
        <div 
            ref={panelRef}
            data-batch-panel="true"
            onWheel={(e) => e.stopPropagation()}
            style={{
                position: 'absolute',
                top: isMobile ? '125px' : 'auto',
                bottom: isMobile ? 'auto' : '25px',
                left: '60px',
                width: isMobile ? 'calc(100% - 140px)' : '320px', 
                maxWidth: '340px',
                maxHeight: isMobile ? '35vh' : '500px',
                background: 'rgba(10, 10, 15, 0.98)',
                backdropFilter: 'blur(15px)',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '16px',
                color: '#eee',
                zIndex: 1100, 
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
            }}>

            {showHelp && (
                <div style={{
                    position: 'absolute',
                    top: '0', left: '0', right: '0', bottom: '0',
                    background: 'rgba(10, 10, 15, 0.98)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid #00f2ff44',
                    borderRadius: '8px',
                    padding: '24px',
                    zIndex: 3000, 
                    boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div style={{ color: '#00f2ff', fontWeight: 'bold', marginBottom: '16px', fontSize: '1.2em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Batch Analysis Guide
                    </div>
                    <div style={{ color: '#ccc', marginBottom: '16px' }}>
                        Manage and visualize your imported node collection and select sites for pair-wise analysis.
                    </div>
                    <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0', color: '#bbb', flexGrow: 1 }}>
                        <li style={{ marginBottom: '10px' }}><strong>Toggle:</strong> Click a node card to select it for Link Analysis.</li>
                        <li style={{ marginBottom: '10px' }}><strong>Role:</strong> First selection is TX (Green), second is RX (Red).</li>
                        <li style={{ marginBottom: '10px' }}><strong>Navigate:</strong> Click a name to center the map on that site.</li>
                    </ul>
                    <button 
                        onClickCapture={() => setShowHelp(false)}
                        style={{ 
                            marginTop: 'auto', 
                            width: '100%', 
                            background: 'rgba(0, 242, 255, 0.1)', 
                            border: '1px solid #00f2ff66', 
                            color: '#00f2ff', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold'
                        }}
                    >
                        Got it
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 600, color: '#00f2ff' }}>
                    Batch Nodes ({nodes.length})
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
                        <span>Help</span>
                    </div>
                    <button 
                        onClickCapture={(e) => {
                            e.stopPropagation();
                            setIsMinimized(true);
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
                        title="Minimize"
                    >
                        ▼
                    </button>
                </div>
            </div>

            <BatchNodesList
                nodes={nodes}
                selectedNodes={selectedNodes}
                onNodeSelect={onNodeSelect}
                onCenter={onCenter}
            />
            
            <button
                onClickCapture={(e) => {
                    e.stopPropagation();
                    onClear();
                }}
                style={{
                    background: 'rgba(255, 50, 50, 0.2)',
                    border: '1px solid rgba(255, 50, 50, 0.4)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#ff6666',
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                }}
            >
                Clear All Nodes
            </button>
        </div>
    );
};

export default BatchNodesPanel;
