import React from 'react';
import PropTypes from 'prop-types';

const LinkStatusIndicator = ({ isMobile, isMinimized, setIsMinimized, statusColor, statusText, margin }) => {
    return (
        <>
            {/* Mobile Grab Handle & Clickable Header Area */}
            {isMobile && (
                <div
                    onClick={() => setIsMinimized(!isMinimized)}
                    style={{
                        padding: '12px 0 8px 0',
                        cursor: 'pointer',
                        width: '100%',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    title={isMinimized ? "Expand" : "Minimize"}
                >
                    <div style={{
                        width: '36px',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                    }} />

                    {isMinimized && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                             <span style={{ fontSize: '0.85em', fontWeight: 700, color: statusColor }}>
                                {statusText}
                            </span>
                            <span style={{ fontSize: '0.85em', color: '#888' }}>|</span>
                            <span style={{ fontSize: '0.9em', fontWeight: 600 }}>
                                {margin} dB Margin
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Header - Also clickable on mobile to toggle */}
            <div
                onClick={isMobile ? () => setIsMinimized(!isMinimized) : undefined}
                style={{
                    display: isMinimized && isMobile ? 'none' : 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    cursor: isMobile ? 'pointer' : 'default',
                    flexShrink: 0
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2em', fontWeight: 600, color: '#00f2ff' }}>Link Analysis</h3>
                    {isMobile && (
                        <span style={{ fontSize: '0.8em', color: '#666', transform: isMinimized ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
                            ▼
                        </span>
                    )}
                </div>
                <span style={{
                    fontSize: '0.8em',
                    fontWeight: 800,
                    color: '#000',
                    background: statusColor,
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {statusText}
                </span>
            </div>
        </>
    );
};

LinkStatusIndicator.propTypes = {
    isMobile: PropTypes.bool.isRequired,
    isMinimized: PropTypes.bool.isRequired,
    setIsMinimized: PropTypes.func.isRequired,
    statusColor: PropTypes.string.isRequired,
    statusText: PropTypes.string.isRequired,
    margin: PropTypes.number.isRequired
};

export default LinkStatusIndicator;
