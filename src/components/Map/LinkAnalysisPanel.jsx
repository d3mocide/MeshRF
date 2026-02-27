import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import LinkProfileChart from "./LinkProfileChart";
import { calculateBullingtonDiffraction } from "../../utils/rfMath";
import { useRF } from "../../context/RFContext";
import { useDraggablePanel } from "../../hooks/useDraggablePanel";

import LinkStatusIndicator from "./UI/LinkStatusIndicator";
import LinkBudgetDisplay from "./UI/LinkBudgetDisplay";
import ModelComparisonTable from "./UI/ModelComparisonTable";

const LinkAnalysisPanel = ({
  nodes,
  linkStats,
  budget,
  distance,
  units,
  propagationSettings,
  setPropagationSettings,
}) => {
  const { nodeConfigs, freq } = useRF();
  const h1 = parseFloat(nodeConfigs.A.antennaHeight);
  const h2 = parseFloat(nodeConfigs.B.antennaHeight);

  // Draggable hook
  const { isMobile, panelSize, isResizing, handleMouseDown } =
    useDraggablePanel();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showModelHelp, setShowModelHelp] = useState(false);
  const panelRef = useRef(null);

  // Disable map click/scroll propagation on the floating panel
  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, [nodes.length]); // Re-run if panel mounts/unmounts

  if (nodes.length !== 2) return null;

  // Conversions
  const isImperial = units === "imperial";
  const distDisplay = isImperial
    ? (distance * 0.621371).toFixed(2) + " mi"
    : distance.toFixed(2) + " km";
  const clearanceVal = linkStats.minClearance;
  const clearanceDisplay = isImperial
    ? (clearanceVal * 3.28084).toFixed(1) + " ft"
    : clearanceVal + " m";

  // Calculate Diffraction Loss
  let diffractionLoss = 0;
  if (linkStats.profileWithStats) {
    diffractionLoss = calculateBullingtonDiffraction(
      linkStats.profileWithStats,
      freq,
      h1,
      h2,
    );
  }
  let margin = budget ? budget.margin : 0;

  // Determine RF Status
  const quality = linkStats.linkQuality || "Obstructed (-)";
  let rfColor = "#ff0000";
  let rfText = "NO SIGNAL";

  if (margin >= 10) {
    rfColor = "#00ff41";
    rfText = "EXCELLENT +++";
  } else if (margin >= 5) {
    rfColor = "#00ff41";
    rfText = "GOOD ++";
  } else if (margin >= 0) {
    rfColor = "#eeff00";
    rfText = "FAIR +";
  } else if (margin >= -10) {
    rfColor = "#ffbf00";
    rfText = "MARGINAL -+";
  } else if (margin < -10) {
    rfColor = "#ff0000";
    rfText = "NO SIGNAL -";
  }

  let statusColor = rfColor;
  let statusText = rfText;

  if (quality.includes("Obstructed")) {
    statusColor = "#ff0000";
    statusText = "OBSTRUCTED (LOS)";
  } else if (diffractionLoss > 10) {
    statusColor = "#ff0000";
    statusText = "Diffraction Limited";
  }

  // Calculate Dimensions directly (Derived State)
  let layoutOffset = 380;
  if (
    propagationSettings &&
    propagationSettings.model === "hata" &&
    (h1 < 30 || distance < 1 || distance > 20 || freq < 150 || freq > 1500)
  ) {
    layoutOffset += 60;
  }
  if (diffractionLoss > 0) {
    layoutOffset += 70;
  }

  const dimensions = {
    width: Math.max(270, panelSize.width - 48),
    height: Math.max(100, panelSize.height - layoutOffset),
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: isMobile ? "auto" : "20px",
        bottom: isMobile ? "0" : "auto",
        right: isMobile ? "0" : "20px",
        left: isMobile ? "0" : "auto",
        width: isMobile ? "100%" : `${panelSize.width}px`,
        height: isMobile ? "auto" : `${panelSize.height}px`,
        maxHeight: isMobile ? (isMinimized ? "72px" : "85dvh") : "none",
        background: "rgba(10, 10, 15, 0.98)",
        backdropFilter: "blur(16px)",
        border: isMobile ? "none" : "1px solid #00f2ff33",
        borderTop: isMobile ? "1px solid #00f2ff55" : "1px solid #00f2ff33",
        borderRadius: isMobile ? "20px 20px 0 0" : "12px",
        padding: "24px",
        paddingBottom: isMobile
          ? "calc(24px + env(safe-area-inset-bottom))"
          : "24px",
        color: "#eee",
        zIndex: 1000,
        boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        transition: isResizing
          ? "none"
          : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {showModelHelp && (
        <ModelComparisonTable
          onClose={() => setShowModelHelp(false)}
          propagationSettings={propagationSettings}
        />
      )}

      <LinkStatusIndicator
        isMobile={isMobile}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        statusColor={statusColor}
        statusText={statusText}
        margin={margin}
      />

      {!isMinimized && (
        <>
          {/* Custom Bottom-Left Resize Handle - Only on Desktop */}
          {!isMobile && (
            <div
              onMouseDown={handleMouseDown}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "24px",
                height: "24px",
                cursor: "sw-resize",
                zIndex: 1001,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 4px,
                                rgba(255, 255, 255, 0.5) 4px,
                                rgba(255, 255, 255, 0.5) 5px
                            )`,
                clipPath: "polygon(0 100%, 100% 100%, 0 0)",
                borderBottomLeftRadius: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.05)")
              }
              title="Resize Panel"
            ></div>
          )}

          {/* Propagation Configuration */}
          {propagationSettings && (
            <div
              style={{
                padding: "12px",
                background: "rgba(0, 242, 255, 0.03)",
                border: "1px solid rgba(0, 242, 255, 0.15)",
                borderRadius: "8px",
                marginBottom: "16px",
                position: "relative",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {/* Row 1: Model & Help */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75em",
                        color: "#888",
                        minWidth: "40px",
                      }}
                      htmlFor="prop-model"
                    >
                      Model:
                    </label>
                    <select
                      id="prop-model"
                      name="prop-model"
                      value={propagationSettings.model || "itm"}
                      onChange={(e) =>
                        setPropagationSettings((prev) => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                      style={{
                        background: "#222",
                        color: "#00f2ff",
                        border: "1px solid #444",
                        padding: "4px",
                        borderRadius: "4px",
                        fontSize: "0.8em",
                        fontWeight: "bold",
                      }}
                    >
                      <option value="itm_wasm">Longley-Rice ITM (Full)</option>
                      <option value="fspl">Free Space (Optimistic)</option>
                      <option value="bullington">
                        Bullington (Terrain Helper)
                      </option>
                      <option value="hata">Okumura-Hata (Statistical)</option>
                    </select>
                  </div>

                  {/* Model Info Tooltip */}
                  <div
                    onClick={() => setShowModelHelp(!showModelHelp)}
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      color: "#00f2ff",
                      fontSize: "0.85em",
                      display: "flex",
                      alignItems: "center",
                      padding: "4px",
                      background: showModelHelp
                        ? "rgba(0, 242, 255, 0.1)"
                        : "transparent",
                      borderRadius: "4px",
                      gap: "4px",
                    }}
                    title="Click for Model Comparison Guide"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span style={{ fontSize: "0.8em", whiteSpace: "nowrap" }}>
                      {showModelHelp
                        ? "Hide Info"
                        : propagationSettings.model === "bullington"
                          ? "Bullington Info"
                          : propagationSettings.model === "hata"
                            ? "Hata Info"
                            : propagationSettings.model === "itm_wasm"
                              ? "ITM Info"
                              : propagationSettings.model === "fspl"
                                ? "LOS Info"
                                : "Model Info"}
                    </span>
                  </div>
                </div>

                {/* Row 2: Env Selector */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    opacity: propagationSettings.model === "hata" ? 1 : 0.4,
                    transition: "opacity 0.2s",
                    filter:
                      propagationSettings.model === "hata"
                        ? "none"
                        : "grayscale(100%)",
                  }}
                  title={
                    propagationSettings.model !== "hata"
                      ? "Environment settings only apply to the Okumura-Hata statistical model."
                      : "Select clutter environment"
                  }
                >
                  <label
                    style={{
                      fontSize: "0.75em",
                      color: "#888",
                      minWidth: "40px",
                    }}
                    htmlFor="prop-env"
                  >
                    Env:
                  </label>
                  <select
                    id="prop-env"
                    name="prop-env"
                    value={propagationSettings.environment}
                    onChange={(e) =>
                      setPropagationSettings((prev) => ({
                        ...prev,
                        environment: e.target.value,
                      }))
                    }
                    disabled={propagationSettings.model !== "hata"}
                    style={{
                      background: "#222",
                      color: "#fff",
                      border: "1px solid #444",
                      padding: "4px",
                      borderRadius: "4px",
                      fontSize: "0.8em",
                      flexGrow: 1,
                      cursor:
                        propagationSettings.model === "hata"
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <option value="urban_small">Urban (Small/Medium)</option>
                    <option value="urban_large">Urban (Large)</option>
                    <option value="suburban">Suburban</option>
                    <option value="rural">Rural / Open</option>
                  </select>
                </div>

                {/* Hata Validity Warnings */}
                {propagationSettings.model === "hata" && (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "6px",
                      background: "rgba(255, 191, 0, 0.08)",
                      borderRadius: "4px",
                      border: "1px solid rgba(255, 191, 0, 0.2)",
                      fontSize: "0.7em",
                      maxHeight: "60px",
                      overflowY: "auto",
                    }}
                  >
                    {(distance < 1 || distance > 20) && (
                      <div
                        style={{
                          color: "#ffbf00",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>⚠</span>
                        <span>Dist {distance.toFixed(1)}km (Limit 1-20km)</span>
                      </div>
                    )}
                    {h1 < 30 && (
                      <div
                        style={{
                          color: "#ffbf00",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>⚠</span>
                        <span>TX {h1}m &lt; 30m (Hata Min)</span>
                      </div>
                    )}
                    {(freq < 150 || freq > 1500) && (
                      <div
                        style={{
                          color: "#ffbf00",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>⚠</span>
                        <span>Freq {freq}MHz (Limit 150-1500)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <LinkBudgetDisplay
            distDisplay={distDisplay}
            margin={margin}
            statusColor={statusColor}
            budget={budget}
            clearanceDisplay={clearanceDisplay}
            diffractionLoss={diffractionLoss}
          />

          {/* Profile Chart - Flexible Height */}
          <div
            style={{
              borderTop: "1px solid #333",
              paddingTop: "12px",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{ color: "#888", fontSize: "0.85em", marginBottom: "4px" }}
            >
              Terrain & Path Profile
            </div>
            {linkStats.loading ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                Loading Elevation Data...
              </div>
            ) : (
              <div style={{ flexGrow: 1, minHeight: "160px" }}>
                <LinkProfileChart
                  profileWithStats={linkStats.profileWithStats}
                  width={dimensions.width}
                  height={dimensions.height}
                  units={units}
                  margin={margin}
                  losColor={statusColor}
                />
              </div>
            )}
          </div>

          {/* Legend / Info */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "10px",
              display: "flex",
              gap: "10px",
              fontSize: "0.75em",
              color: "#666",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#00ff41",
                }}
              ></div>
              <span>LOS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#5d4037",
                }}
              ></div>
              <span>Terrain</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "1px dashed #00f2ff",
                }}
              ></div>
              <span>Fresnel</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

LinkAnalysisPanel.propTypes = {
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }),
  ).isRequired,
  linkStats: PropTypes.shape({
    isObstructed: PropTypes.bool,
    minClearance: PropTypes.number,
    linkQuality: PropTypes.string,
    profileWithStats: PropTypes.array,
    loading: PropTypes.bool,
  }).isRequired,
  budget: PropTypes.object,
  distance: PropTypes.number.isRequired,
  units: PropTypes.oneOf(["metric", "imperial"]),
  propagationSettings: PropTypes.shape({
    model: PropTypes.string,
    environment: PropTypes.string,
  }),
  setPropagationSettings: PropTypes.func,
};

export default LinkAnalysisPanel;
