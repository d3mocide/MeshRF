import React from 'react';

const NodeListTable = ({ nodes, onRemove }) => {
    const styles = {
        nodeList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
            maxHeight: '180px',
            overflowY: 'auto',
            paddingRight: '8px' // Space for scrollbar
        },
        nodeItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #333'
        },
        removeBtn: {
            color: '#ff4444',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '0 8px',
            opacity: 0.8,
            transition: 'opacity 0.2s'
        }
    };

    return (
        <div style={styles.nodeList} className="node-list-scroll">
            {nodes.length === 0 && (
                <div style={{textAlign: 'center', color: '#555', padding: '16px', border: '1px dashed #333', borderRadius: '4px', fontSize: '0.85em'}}>
                    No candidate points added
                </div>
            )}

            {nodes.map((node) => (
                <div key={node.id} style={styles.nodeItem}>
                    <div>
                        <div style={{fontWeight: '600', fontSize: '0.8rem', color: '#fff'}}>{node.name}</div>
                        <div style={{fontSize: '0.7rem', color: '#00f2ff', fontFamily: 'monospace'}}>{node.lat.toFixed(4)}, {node.lon.toFixed(4)}</div>
                    </div>
                    <button onClick={() => onRemove(node.id)} style={styles.removeBtn}>×</button>
                </div>
            ))}
        </div>
    );
};

export default NodeListTable;
