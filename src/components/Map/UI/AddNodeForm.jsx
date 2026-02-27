import React, { useState, useEffect } from 'react';

const AddNodeForm = ({ selectedLocation, onAdd }) => {
    const [manualLat, setManualLat] = useState('');
    const [manualLon, setManualLon] = useState('');

    useEffect(() => {
        if (selectedLocation) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setManualLat(selectedLocation.lat.toFixed(6));
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setManualLon(selectedLocation.lng.toFixed(6));
        }
    }, [selectedLocation]);

    const handleAddClick = () => {
        if (manualLat && manualLon) {
            onAdd(parseFloat(manualLat), parseFloat(manualLon));
            setManualLat('');
            setManualLon('');
        }
    };

    const styles = {
        inputGroup: {
            display: 'flex',
            gap: '8px',
            marginBottom: '16px'
        },
        input: {
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '0.875rem',
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'monospace'
        },
        addButton: {
            backgroundColor: 'rgba(0, 242, 255, 0.1)',
            color: '#00f2ff',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: '1px solid #00f2ff66',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.2s'
        },
        styleSheet: `
            input[type=number]::-webkit-inner-spin-button,
            input[type=number]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            input[type=number] {
                -moz-appearance: textfield;
                position: relative;
            }
            .input-with-arrows {
                position: relative;
                display: flex;
                align-items: center;
            }
            .custom-arrows {
                position: absolute;
                right: 5px;
                display: flex;
                flex-direction: column;
                gap: 2px;
                pointer-events: none;
                opacity: 0.6;
            }
            .arrow-up {
                width: 0; height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 5px solid #00f2ff;
            }
            .arrow-down {
                width: 0; height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-top: 5px solid #00f2ff;
            }
        `
    };

    return (
        <div style={styles.inputGroup}>
            <style>{styles.styleSheet}</style>
            <div className="input-with-arrows" style={{ width: '33%' }}>
                <input
                    type="number"
                    placeholder="Lat"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    style={styles.input}
                />
                <div className="custom-arrows">
                    <div className="arrow-up"></div>
                    <div className="arrow-down"></div>
                </div>
            </div>
            <div className="input-with-arrows" style={{ width: '33%' }}>
                <input
                    type="number"
                    placeholder="Lon"
                    value={manualLon}
                    onChange={(e) => setManualLon(e.target.value)}
                    style={styles.input}
                />
                <div className="custom-arrows">
                    <div className="arrow-up"></div>
                    <div className="arrow-down"></div>
                </div>
            </div>
            <button
                onClick={handleAddClick}
                style={styles.addButton}
            >
                Add
            </button>
        </div>
    );
};

export default AddNodeForm;
