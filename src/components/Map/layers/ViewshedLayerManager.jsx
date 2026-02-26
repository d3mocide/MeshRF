import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import ViewshedControl from '../Controls/ViewshedControl';

const ViewshedLayerManager = ({
    active,
    observer, setObserver,
    runAnalysis,
    isCalculating,
    progress,
    maxDist, setMaxDist,
    clear,
    isMobile
}) => {
    if (!active) return null;

    const debugRadiusCircle = observer && maxDist ? { center: observer, radius: maxDist } : null;

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
                            // Preserve antenna height on drag
                            const currentHeight = observer?.height || 2.0;
                            setObserver({ lat, lng, height: currentHeight });
                            runAnalysis({ lat, lng, height: currentHeight }, maxDist);
                        },
                    }}
                >
                    <Popup>Viewshed Transmitter</Popup>
                </Marker>
            )}

            {debugRadiusCircle && (
                <Circle
                    center={debugRadiusCircle.center}
                    radius={debugRadiusCircle.radius}
                    pathOptions={{ color: '#00f2ff', weight: 1, dashArray: '5, 5', fill: false }}
                />
            )}

            <ViewshedControl
                maxDist={maxDist}
                setMaxDist={setMaxDist}
                isCalculating={isCalculating}
                progress={progress}
                onRecalculate={() => {
                  if (observer) {
                    runAnalysis(observer, maxDist);
                  }
                }}
                isMobile={isMobile}
            />

            {/* Clear Viewshed Button */}
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
                    Clear Viewshed
                  </button>
                </div>
            )}
        </>
    );
};

export default ViewshedLayerManager;
