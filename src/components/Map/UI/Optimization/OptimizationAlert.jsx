import React, { useEffect } from 'react';

const OptimizationAlert = ({ notification, setNotification, setShowResults }) => {

    useEffect(() => {
        if (notification && notification.transient) {
            const timer = setTimeout(() => { setNotification(null); }, 1000);
            return () => clearTimeout(timer);
        }
    }, [notification, setNotification]);

    if (!notification) return null;

    return (
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 10, 15, 0.85)',
            color: notification.type === 'success' ? '#4ade80' : '#f87171',
            padding: '40px 60px',
            borderRadius: '24px',
            border: notification.type === 'success' ? '1px solid rgba(50, 255, 100, 0.3)' : '1px solid rgba(255, 50, 50, 0.3)',
            boxShadow: notification.type === 'success'
                ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(50, 255, 100, 0.1)'
                : '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 50, 50, 0.1)',
            zIndex: 2000,
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            minWidth: '320px',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }
            `}</style>

            <div style={{
                width: '64px', height: '64px',
                borderRadius: '50%',
                background: notification.type === 'success' ? 'rgba(50, 255, 100, 0.1)' : 'rgba(255, 50, 50, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: notification.type === 'success' ? '2px solid rgba(50, 255, 100, 0.2)' : '2px solid rgba(255, 50, 50, 0.2)',
                marginBottom: '4px'
            }}>
                {notification.type === 'success' ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '1.4em', fontWeight: '700', letterSpacing: '0.5px', color: '#fff' }}>
                    {notification.type === 'success' ? 'SCAN COMPLETE' : 'ANALYSIS FAILED'}
                </div>
                <div style={{ fontSize: '1em', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '280px', lineHeight: '1.5' }}>
                    {notification.message}
                </div>
            </div>

            {!notification.transient && (
                <button
                    onClick={() => {
                        if (notification.type === 'success') {
                            setShowResults(true);
                            setNotification(null);
                        } else {
                            setNotification(null);
                        }
                    }}
                    style={{
                        marginTop: '12px',
                        padding: '12px 32px',
                        background: notification.type === 'success'
                            ? 'linear-gradient(90deg, rgba(50, 255, 100, 0.2), rgba(50, 255, 100, 0.1))'
                            : 'linear-gradient(90deg, rgba(255, 50, 50, 0.2), rgba(255, 50, 50, 0.1))',
                        border: notification.type === 'success' ? '1px solid rgba(50, 255, 100, 0.4)' : '1px solid rgba(255, 50, 50, 0.4)',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '1em',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = notification.type === 'success'
                            ? '0 0 15px rgba(50, 255, 100, 0.3)'
                            : '0 0 15px rgba(255, 50, 50, 0.3)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    {notification.type === 'success' ? 'VIEW RESULTS' : 'CLOSE'}
                </button>
            )}
        </div>
    );
};

export default OptimizationAlert;
