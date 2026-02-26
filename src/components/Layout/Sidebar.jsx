import React, { useState, useEffect } from 'react';
import BatchProcessing from '../Map/BatchProcessing';
import HardwareSection from './sections/HardwareSection';
import EnvironmentSection from './sections/EnvironmentSection';
import LoRaBandSection from './sections/LoRaBandSection';
import SettingsSection from './sections/SettingsSection';
import { useUI } from '../../context/UIContext';
import { useHardware } from '../../context/HardwareContext';

const Sidebar = () => {
    const {
        sidebarIsOpen, setSidebarIsOpen,
        isMobile
    } = useUI();
    const { editMode, setEditMode } = useHardware();

    const [sections, setSections] = useState({
        hardware: true,
        radio: false,
        environment: true
    });

    const toggleSection = (section) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Auto-close sidebar on mobile
    useEffect(() => {
        if (isMobile && sidebarIsOpen) setSidebarIsOpen(false);
    }, [isMobile]); // Trigger on mount or mobile switch

    return (
        <>
            <button
                onClick={() => setSidebarIsOpen(!sidebarIsOpen)}
                title={sidebarIsOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    top: 'calc(var(--safe-area-top, 0px) + 76px)',
                    left: sidebarIsOpen ? '330px' : '15px',
                    zIndex: 2010,
                    background: 'var(--color-primary)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '10px'
                }}
            >
                {sidebarIsOpen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                )}
            </button>

            <aside style={{
                width: sidebarIsOpen ? '320px' : '0px',
                background: 'var(--color-bg-panel)',
                borderRight: '1px solid var(--color-border)',
                height: '100dvh',
                paddingTop: sidebarIsOpen ? 'calc(var(--safe-area-top, 0px) + var(--spacing-md))' : '0px',
                paddingLeft: sidebarIsOpen ? 'var(--spacing-md)' : '0px',
                paddingRight: sidebarIsOpen ? 'calc(var(--spacing-md) + 4px)' : '0px',
                paddingBottom: sidebarIsOpen ? 'calc(var(--safe-area-bottom, 0px) + var(--spacing-md))' : '0px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2000,
                position: isMobile ? 'fixed' : 'relative',
                overflowY: 'auto',
                overflowX: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                opacity: sidebarIsOpen ? 1 : 0,
                boxShadow: isMobile && sidebarIsOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none'
            }}>
                <h2 style={{
                    color: 'var(--color-primary)',
                    margin: '0 0 var(--spacing-lg) 0',
                    fontSize: '1.2rem',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    <img src="/icon.svg" alt="App Icon" style={{ height: '24px', width: '24px' }} /> meshRF
                </h2>

                {/* EDIT MODE BANNER */}
                {editMode !== 'GLOBAL' && (
                    <div style={{
                        background: editMode === 'A' ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 50, 50, 0.1)',
                        borderLeft: `3px solid ${editMode === 'A' ? '#00ff41' : '#ff0000'}`,
                        padding: '8px 12px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{fontSize: '0.7em', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1'}}>
                                Editing Config
                            </div>
                            <div style={{
                                color: editMode === 'A' ? '#00ff41' : '#ff4444',
                                fontWeight: '700',
                                fontSize: '0.95em',
                                marginTop: '4px'
                            }}>
                                {editMode === 'A' ? 'NODE A (TX)' : 'NODE B (RX)'}
                            </div>
                        </div>

                        <button
                            onClick={() => setEditMode('GLOBAL')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#ddd',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.75em',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>Done</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}

                <HardwareSection isOpen={sections.hardware} onToggle={() => toggleSection('hardware')} />

                <EnvironmentSection isOpen={sections.environment} onToggle={() => toggleSection('environment')} />

                <LoRaBandSection isOpen={sections.radio} onToggle={() => toggleSection('radio')} />

                {/* BATCH PROCESSING */}
                <div style={{ marginTop: '0', paddingTop: 'var(--spacing-md)' }}>
                    <BatchProcessing />
                </div>

                <SettingsSection />

                {/* Footer */}
                <div style={{marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #333', textAlign: 'center'}}>
                    <a
                        href="https://github.com/d3mocide/MeshRF/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{color: '#666', fontSize: '0.75em', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}
                    >
                        <svg height="16" viewBox="0 0 16 16" width="16" style={{fill: '#666'}}>
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                        d3mocide/MeshRF
                    </a>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
