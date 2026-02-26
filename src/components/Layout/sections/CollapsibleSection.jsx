import React from 'react';

const CollapsibleSection = ({ title, isOpen, onToggle, children, isShared = false, isITM = false, alwaysVisible = null, collapsible = true }) => (
    <div style={{
        marginBottom: 'var(--spacing-xs)', // Reduced from md to bring next section closer
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: (isOpen || !collapsible) ? 'var(--spacing-sm)' : '4px'
    }}>
        <h3
            onClick={collapsible ? onToggle : undefined}
            style={{
                fontSize: '1rem',
                color: '#fff',
                margin: '0 0 var(--spacing-sm) 0',
                cursor: collapsible ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none'
            }}
        >
            <div>
                {title}
                {isShared && <span style={{fontSize: '0.8em', color: '#888', fontWeight: 'normal', marginLeft: '6px'}}>(Shared)</span>}
                {isITM && <span style={{fontSize: '0.8em', color: '#888', fontWeight: 'normal', marginLeft: '6px'}}>(ITM)</span>}
            </div>
            {collapsible && (
                <span style={{fontSize: '0.8em', color: '#888', display: 'flex', alignItems: 'center'}}>
                    {isOpen ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    )}
                </span>
            )}
        </h3>

        {alwaysVisible && (
            <div style={{ marginBottom: (isOpen || !collapsible) ? '12px' : '8px' }}> {/* Added margin when closed */}
                {alwaysVisible}
            </div>
        )}

        {(isOpen || !collapsible) && (
            <div style={{ animation: 'fadeOnly 0.2s ease-in-out' }}>
                {children}
            </div>
        )}
    </div>
);

export default CollapsibleSection;
