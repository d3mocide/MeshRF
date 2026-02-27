import React, { useState, useRef } from 'react';
import useSimulationStore from '../../../store/useSimulationStore';
import { Upload } from 'lucide-react';
import { parseNodeCSV, downloadNodeTemplate } from '../../../utils/csvImportExport';
import NodeListTable from './NodeListTable';
import AddNodeForm from './AddNodeForm';

const NodeManager = ({ selectedLocation }) => {
    const { nodes: simNodes, addNode, removeNode, startScan, isScanning, scanProgress, setNodes } = useSimulationStore();
    const fileInputRef = useRef(null);
    const [isGreedy, setIsGreedy] = useState(false);
    const [targetCount, setTargetCount] = useState(3);

    const handleCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const importedNodes = parseNodeCSV(text);
            if (importedNodes.length > 0) {
                setNodes(importedNodes);
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const handleAdd = (lat, lon) => {
        addNode({ 
            lat,
            lon,
            height: 10,
            name: `Node ${simNodes.length + 1}`
        });
    };

    const handleRunScan = () => {
        startScan(isGreedy ? targetCount : null);
    };

    const styles = {
        container: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, sans-serif'
        },
        header: {
            fontWeight: 'bold',
            fontSize: '1em',
            marginBottom: '12px',
            color: '#00f2ff', 
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: '1px solid #00f2ff33',
            paddingBottom: '8px',
            flexShrink: 0
        },
        actionButton: {
            width: '100%',
            padding: '10px 0',
            borderRadius: '4px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            letterSpacing: '1px'
        },
        scanBarContainer: {
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '2px',
            height: '6px',
            marginTop: '8px',
            overflow: 'hidden'
        },
        scanBarFill: {
            height: '100%',
            backgroundColor: '#00f2ff',
            boxShadow: '0 0 10px #00f2ff',
            transition: 'width 0.3s ease'
        },
        optContainer: {
            marginBottom: '10px'
        },
        bulkHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '0 4px'
        },
        bulkButton: {
            flex: 1,
            padding: '8px',
            background: 'rgba(0, 242, 255, 0.05)',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            borderRadius: '6px',
            color: '#00f2ff',
            fontSize: '0.85em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
        },
        templateLink: {
            color: '#888',
            fontSize: '0.75em',
            textDecoration: 'underline',
            cursor: 'pointer',
            marginLeft: '10px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>Multi-Site Analysis</div>
            
            <AddNodeForm selectedLocation={selectedLocation} onAdd={handleAdd} />

            <div style={{ padding: '0 12px', marginBottom: '20px' }}>
                <div style={styles.bulkHeader}>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        style={styles.bulkButton}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(0, 242, 255, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.4)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(0, 242, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.2)';
                        }}
                    >
                        <Upload size={14} />
                        Bulk Import (CSV)
                    </button>
                    <div 
                        onClick={downloadNodeTemplate}
                        style={styles.templateLink}
                    >
                        Get Template
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".csv"
                    onChange={handleCSVImport}
                    aria-label="Import CSV File"
                />
            </div>

            <NodeListTable nodes={simNodes} onRemove={removeNode} />

            <div style={styles.optContainer}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isGreedy ? '8px' : '0'}}>
                    <input 
                        type="checkbox" 
                        checked={isGreedy} 
                        onChange={(e) => setIsGreedy(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        style={{accentColor: '#00f2ff', cursor: 'pointer', width: '14px', height: '14px'}}
                        aria-label="Toggle Greedy Optimization"
                    />
                    <span style={{color: isGreedy ? '#00f2ff' : '#888', fontSize: '0.8em', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer'}} onClick={() => setIsGreedy(!isGreedy)}>
                        Greedy Optimization
                    </span>
                </div>
                
                {isGreedy && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.7em', color: '#888'}}>
                            <span>Target Node Count</span>
                            <span style={{color: '#00f2ff', fontWeight: 'bold'}}>{targetCount}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max={Math.max(1, simNodes.length)} step="1"
                            value={targetCount}
                            onChange={(e) => setTargetCount(parseInt(e.target.value))}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                '--range-progress': `${simNodes.length > 1 ? ((targetCount - 1) / (simNodes.length - 1)) * 100 : 0}%` 
                            }}
                            aria-label="Target Node Count"
                        />
                    </div>
                )}
            </div>

            {isScanning ? (
                <div>
                    <div style={{fontSize: '0.8rem', color: '#00f2ff', fontFamily: 'monospace', marginBottom: '6px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>SCANNING...</span>
                        <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div style={styles.scanBarContainer}>
                        <div style={{...styles.scanBarFill, width: `${scanProgress}%`}}></div>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={handleRunScan}
                    disabled={simNodes.length < (isGreedy ? 1 : 2)}
                    style={{
                        ...styles.actionButton,
                        backgroundColor: (simNodes.length < (isGreedy ? 1 : 2)) ? 'rgba(255,255,255,0.05)' : 'rgba(0, 242, 255, 0.15)',
                        border: (simNodes.length < (isGreedy ? 1 : 2)) ? '1px solid #333' : '1px solid #00f2ff',
                        color: (simNodes.length < (isGreedy ? 1 : 2)) ? '#555' : '#00f2ff',
                        cursor: (simNodes.length < (isGreedy ? 1 : 2)) ? 'not-allowed' : 'pointer',
                        boxShadow: (simNodes.length < (isGreedy ? 1 : 2)) ? 'none' : '0 0 15px rgba(0, 242, 255, 0.2)'
                    }}
                >
                    Run Site Analysis
                </button>
            )}
        </div>
    );
};

export default NodeManager;
