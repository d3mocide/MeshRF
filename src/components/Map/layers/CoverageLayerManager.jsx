import React, { useEffect } from 'react';
import { Marker, Popup, Rectangle } from 'react-leaflet';
import { useRF } from '../../../context/RFContext';
import { GROUND_TYPES, toVariabilityParams } from '../../../context/EnvironmentContext';

const CoverageLayerManager = ({
    active,
    observer, setObserver,
    runAnalysis,
    isCalculating,
    clear,
    bounds
}) => {
    const {
        freq,
        txPower,
        antennaGain,
        cableLoss,
        nodeConfigs,
        calculateSensitivity,
        bw, sf, cr,
        rxHeight,
        groundType,
        climate,
        variability,
        antennaHeight,
        recalcTimestamp // Recalc signal
    } = useRF();

    // Trigger RF Recalculation on Parameter Change.
    // Intentionally keyed only on recalcTimestamp: the effect closes over whatever
    // RF params were current at the last render, so bumping the timestamp is what
    // fires a recalc, not a change to any individual param.
    useEffect(() => {
        if (recalcTimestamp && active && observer) {
            const { lat, lng } = observer;
            // Use current context height
            const h = antennaHeight || 5.0;
            const currentSensitivity = calculateSensitivity();
            const ground = GROUND_TYPES[groundType] || GROUND_TYPES['Average Ground'];

            const rfParams = {
                freq,
                txPower,
                txGain: antennaGain,
                txLoss: cableLoss,
                rxLoss: 0,
                rxGain: nodeConfigs.B.antennaGain || 2.15,
                rxSensitivity: currentSensitivity,
                bw, sf, cr,
                rxHeight,
                epsilon: ground.epsilon,
                sigma: ground.sigma,
                climate: climate,
                // ITM statistical variability (ROADMAP P4-6)
                ...toVariabilityParams(variability),
            };

            runAnalysis(lat, lng, h, 25000, rfParams);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recalcTimestamp]);

    if (!active) return null;

    const buttonStyle = {
        background: "rgba(255, 50, 50, 0.9)",
        color: "#fff",
        border: "1px solid rgba(255, 100, 100, 0.5)",
        padding: "0 12px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
        transition: "all 0.2s ease",
    };

    return (
        <>
            {observer && (
                <Marker
                    position={observer}
                    draggable={true}
                    eventHandlers={{
                        dragend: (e) => {
                            const { lat, lng } = e.target.getLatLng();

                            // Update position and recalculate
                            fetch("/api/get-elevation", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ lat, lon: lng }),
                            })
                            .then((res) => res.json())
                            .then(() => {
                                const h = antennaHeight || 5.0; // Keep relative height from ground

                                setObserver({ lat, lng, height: h });

                                const currentSensitivity = calculateSensitivity();
                                const dragGround = GROUND_TYPES[groundType] || GROUND_TYPES['Average Ground'];

                                const rfParams = {
                                    freq,
                                    txPower,
                                    txGain: antennaGain,
                                    txLoss: cableLoss,
                                    rxLoss: 0,
                                    rxGain: nodeConfigs.B.antennaGain || 2.15,
                                    rxSensitivity: currentSensitivity,
                                    bw, sf, cr,
                                    rxHeight,
                                    epsilon: dragGround.epsilon,
                                    sigma: dragGround.sigma,
                                    climate: climate,
                                    // ITM statistical variability (ROADMAP P4-6)
                                    ...toVariabilityParams(variability),
                                };

                                runAnalysis(lat, lng, h, 25000, rfParams);
                            });
                        },
                    }}
                >
                    <Popup>RF Transmitter</Popup>
                </Marker>
            )}

            {bounds && (
                <Rectangle
                    bounds={bounds}
                    pathOptions={{
                        color: "orange",
                        dashArray: "5, 5",
                        fill: false,
                        weight: 2,
                    }}
                />
            )}

            {/* Clear RF Coverage Button */}
            {observer && (
                <div style={{ position: "absolute", top: 72, left: 60, zIndex: 1000 }}>
                    <button
                        onClick={() => {
                            setObserver(null);
                            clear();
                        }}
                        style={buttonStyle}
                        onMouseOver={(e) => (e.target.style.background = "rgba(255, 50, 50, 1)")}
                        onMouseOut={(e) => (e.target.style.background = "rgba(255, 50, 50, 0.9)")}
                    >
                        Clear RF Coverage
                    </button>
                </div>
            )}

            {/* RF Coverage Loading Status */}
            {isCalculating && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(10, 10, 15, 0.75)",
                        color: "#ff6b00",
                        padding: "40px 60px",
                        borderRadius: "24px",
                        border: "1px solid rgba(255, 107, 0, 0.2)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 107, 0, 0.1)",
                        zIndex: 2000,
                        textAlign: "center",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                        minWidth: "300px",
                    }}
                >
                    <div
                        className="spinner"
                        style={{
                            width: "48px",
                            height: "48px",
                            border: "3px solid rgba(255, 107, 0, 0.1)",
                            borderTop: "3px solid #ff6b00",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            boxShadow: "0 0 15px rgba(255, 107, 0, 0.3)",
                        }}
                    ></div>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.7); } }
                    `}</style>
                    <div
                        style={{
                            fontSize: "1.2em",
                            fontWeight: "600",
                            letterSpacing: "1px",
                            animation: "pulse-text 2s ease-in-out infinite",
                        }}
                    >
                        CALCULATING RF COVERAGE
                    </div>
                    <div style={{ fontSize: "0.9em", color: "rgba(255, 255, 255, 0.6)" }}>
                        Running ITM propagation model...
                    </div>
                </div>
            )}
        </>
    );
};

export default CoverageLayerManager;
