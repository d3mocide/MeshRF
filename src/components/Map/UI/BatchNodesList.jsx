import React from 'react';

const BatchNodesList = ({ nodes, selectedNodes, onNodeSelect, onCenter }) => {
    return (
        <div
            style={{
                overflowY: 'auto',
                maxHeight: '320px',
                flexGrow: 1,
                paddingRight: '4px',
                marginBottom: '12px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#00f2ff #1a1a1f'
            }}
            className="batch-nodes-scrollable"
            onWheel={(e) => {
                e.stopPropagation();
            }}
        >
            {nodes.map((node) => {
                const selection = selectedNodes?.find(s => s?.id === node.id);
                const isSelected = !!selection;
                const role = selection?.role;

                return (
                    <div
                        key={node.id}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            background: isSelected ? 'rgba(0, 242, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '1px solid rgba(0, 242, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            if (onNodeSelect) {
                                onNodeSelect(node);
                            } else {
                                onCenter(node);
                            }
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(0, 242, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.3)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = isSelected ? 'rgba(0, 242, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = isSelected ? 'rgba(0, 242, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        {isSelected && (
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: role === 'TX' ? 'rgba(0, 255, 65, 0.9)' : 'rgba(255, 0, 0, 0.9)',
                                color: '#000',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7em',
                                fontWeight: 700,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                {role}
                            </div>
                        )}

                        <div style={{ fontSize: '0.95em', color: '#fff', fontWeight: 600, marginBottom: '4px', paddingRight: isSelected ? '40px' : '0' }}>
                            {node.name}
                        </div>

                        <div style={{ fontSize: '0.75em', color: '#888', fontFamily: 'monospace' }}>
                            {node.lat.toFixed(5)}, {node.lng.toFixed(5)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BatchNodesList;
