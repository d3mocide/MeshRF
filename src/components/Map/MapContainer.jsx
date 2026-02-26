import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  Marker,
  Popup,
  ImageOverlay,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ScatterplotLayer } from "@deck.gl/layers";
import * as turf from "@turf/turf";

// Context & Stores
import { useRF } from "../../context/RFContext";
import useSimulationStore from "../../store/useSimulationStore";

// Hooks
import { useLinkTool } from "./hooks/useLinkTool";
import { useViewshedTool } from "../../hooks/useViewshedTool";
import { useRFCoverageTool } from "../../hooks/useRFCoverageTool";
import { useMapEventHandlers } from "./hooks/useMapEventHandlers";

// Layers & Managers
import DeckGLOverlay from "./DeckGLOverlay";
import WasmViewshedLayer from "./WasmViewshedLayer";
import LinkLayerManager from "./layers/LinkLayerManager";
import ViewshedLayerManager from "./layers/ViewshedLayerManager";
import CoverageLayerManager from "./layers/CoverageLayerManager";
import OptimizationLayerManager from "./layers/OptimizationLayerManager";

// Controls & UI
import LocateControl from "./Controls/LocateControl";
import MapToolbar from "./UI/MapToolbar";
import GuidanceOverlays from "./UI/GuidanceOverlays";
import SiteAnalysisPanel from "./UI/SiteAnalysisPanel";
import SiteAnalysisResultsPanel from "./UI/SiteAnalysisResultsPanel";
import BatchNodesPanelWrapper from "./Controls/BatchNodesPanelWrapper";

// Custom SVG marker icon
const customMarkerIcon = L.divIcon({
  html: `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="#00f2ff" stroke="#0a0a0f" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="5" fill="#0a0a0f"/>
    </svg>
  `,
  className: 'custom-marker-icon',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
});

L.Marker.prototype.options.icon = customMarkerIcon;

// Helper component to capture map instance
const MapInstanceTracker = ({ setMap }) => {
    const map = useMap();
    useEffect(() => {
        if (map) setMap(map);
    }, [map, setMap]);
    return null;
};

const MapComponent = () => {
  // 1. Context & Global State
  const {
    isMobile,
    toolMode, setToolMode,
    mapStyle,
    units,
    viewshedMaxDist, setViewshedMaxDist,
    batchNodes, setBatchNodes, showBatchPanel, setShowBatchPanel,
    setEditMode,
    nodeConfigs
  } = useRF();

  const {
    nodes: simNodes,
    results: simResults,
    compositeOverlay,
    interNodeLinks,
    totalUniqueCoverageKm2
  } = useSimulationStore();

  // 2. Local State
  const [map, setMap] = useState(null);

  // Viewshed State
  const [viewshedObserver, setViewshedObserver] = useState(null);
  const {
    runAnalysis: runViewshedAnalysis,
    resultLayer: viewshedLayer,
    isCalculating: isViewshedCalculating,
    progress: viewshedProgress,
    clear: clearViewshed
  } = useViewshedTool(toolMode === 'viewshed');

  // RF Coverage State
  const [rfObserver, setRfObserver] = useState(null);
  const {
    runAnalysis: runRFAnalysis,
    resultLayer: rfResultLayer,
    isCalculating: isRFCalculating,
    clear: clearRFCoverage,
  } = useRFCoverageTool(toolMode === "rf_coverage");

  // Optimization State
  const [optimizeState, setOptimizeState] = useState({
    startPoint: null,
    endPoint: null,
    ghostNodes: [],
    loading: false,
  });
  const [siteAnalysisMode, setSiteAnalysisMode] = useState('auto');
  const [lastClickedLocation, setLastClickedLocation] = useState(null);
  const [siteSelectionWeights, setSiteSelectionWeights] = useState({
    elevation: 0.5,
    prominence: 0.3,
    fresnel: 0.2
  });
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);

  // Link Tool Hook
  const {
      nodes, setNodes,
      linkStats, setLinkStats,
      coverageOverlay, setCoverageOverlay,
      isLinkLocked, setIsLinkLocked,
      selectedBatchNodes, setSelectedBatchNodes,
      propagationSettings, setPropagationSettings,
      budget, distance,
      handleNodeSelect,
      reset: resetLinkTool
  } = useLinkTool();

  // Guidance Help State
  const [viewshedHelp, setViewshedHelp] = useState(false);
  const [rfHelp, setRFHelp] = useState(false);
  const [linkHelp, setLinkHelp] = useState(false);
  const [elevationHelp, setElevationHelp] = useState(false);

  // 3. Effects & handlers

  // Auto-show results
  useEffect(() => {
    if (simResults && simResults.length > 0) {
      setShowAnalysisResults(true);
    }
  }, [simResults]);

  const resetToolState = () => {
    resetLinkTool();
    setViewshedObserver(null);
    setRfObserver(null);
    setLastClickedLocation(null);
    useSimulationStore.getState().reset();
    setShowAnalysisResults(false);
    setEditMode("GLOBAL");
  };

  const handleOptimizationStateUpdate = React.useCallback((state) => {
    setOptimizeState(state);
    if (state.showResults !== undefined) {
      setShowAnalysisResults(state.showResults);
    }
  }, []);

  // Map Configs
  const MAP_STYLES = {
    dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' },
    dark_green: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>', className: "dark-mode-tiles" },
    light: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' },
    topo: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community" },
    topo_dark: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community", className: "dark-mode-tiles" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community" },
  };
  const currentStyle = MAP_STYLES[mapStyle] || MAP_STYLES.dark_green;

  // DeckGL Layers Preparation
  const deckLayers = useMemo(() => {
      const layers = [];

      // Viewshed
      if (toolMode === "viewshed" && viewshedLayer?.data) {
        const { width, height, data, bounds } = viewshedLayer;
        const rgbaData = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < width * height; i++) {
          const val = data[i];
          rgbaData[i * 4] = val;
          rgbaData[i * 4 + 1] = 0;
          rgbaData[i * 4 + 2] = 0;
          rgbaData[i * 4 + 3] = 255;
        }
        layers.push(
          new WasmViewshedLayer({
            id: "wasm-viewshed-layer-stitched",
            image: new ImageData(rgbaData, width, height),
            bounds: [bounds.west, bounds.south, bounds.east, bounds.north],
            opacity: 0.6,
            showShadows: false,
            observer: viewshedLayer.observerCoords
                ? [viewshedLayer.observerCoords.x / width, 1.0 - (viewshedLayer.observerCoords.y / height)]
                : [0.5, 0.5],
            radius: viewshedLayer.radiusPixels ? (viewshedLayer.radiusPixels / width) : 0.0,
          }),
        );
      }

      // RF Coverage
      if (toolMode === "rf_coverage" && rfResultLayer?.data) {
        const { width, height, data, rfParams, bounds } = rfResultLayer;
        const { west, south, east, north } = bounds;
        const points = [];
        const latStep = (north - south) / height;
        const lonStep = (east - west) / width;
        const bwHz = (rfParams?.bw || 125) * 1000;
        const noiseFloor = -174 + 10 * Math.log10(bwHz);
        const sensitivity = rfParams?.rxSensitivity || -120;
        const NO_DATA = -999.0;

        for (let i = 0; i < data.length; i++) {
          const rssi = data[i];
          const isBackground = rssi <= NO_DATA + 1;
          if (isBackground) continue;

          const y = Math.floor(i / width);
          const x = i % width;
          const pLat = north - (y + 0.5) * latStep;
          const pLon = west + (x + 0.5) * lonStep;

          points.push({
            position: [pLon, pLat],
            rssi,
            snr: rssi - noiseFloor,
            isBackground,
          });
        }

        layers.push(
          new ScatterplotLayer({
            id: "rf-coverage-dots",
            data: points,
            pickable: true,
            opacity: 0.6,
            stroked: false,
            filled: true,
            radiusScale: 1,
            radiusMinPixels: 2,
            radiusMaxPixels: 6,
            getPosition: (d) => d.position,
            getFillColor: (d) => {
              const relativeStrength = d.rssi - sensitivity;
              if (relativeStrength > 20) return [0, 255, 65, 200];
              if (relativeStrength > 10) return [100, 255, 0, 200];
              if (relativeStrength > 5) return [255, 255, 0, 200];
              if (relativeStrength > 0) return [255, 120, 0, 180];
              return [100, 0, 255, 120];
            },
          }),
        );
      }
      return layers;
  }, [toolMode, viewshedLayer, rfResultLayer]);


  const defaultPosition = [45.5152, -122.6784];

  // Pass RF context explicitly to handler to avoid stale closures in event loop
  const rfContextFacade = useRF();

  return (
    <div style={{ flex: 1, height: "100%", position: "relative" }}>
      <MapContainer
        center={defaultPosition}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#0a0a0f" }}
        zoomControl={false}
      >
        <MapInstanceTracker setMap={setMap} />
        <ZoomControl position={isMobile ? "topright" : "bottomright"} />
        <LocateControl />

        {/* Map Click Handler */}
        <HandlerWrapper
            toolMode={toolMode}
            viewshed={{ runAnalysis: runViewshedAnalysis, setObserver: setViewshedObserver, maxDist: viewshedMaxDist }}
            rfCoverage={{ runAnalysis: runRFAnalysis, setObserver: setRfObserver }}
            rfContext={rfContextFacade}
        />

        <TileLayer
          key={mapStyle}
          attribution={currentStyle.attribution}
          url={currentStyle.url}
          className={currentStyle.className}
        />
        <DeckGLOverlay layers={deckLayers} />

        <LinkLayerManager
            active={toolMode === 'link'}
            locked={isLinkLocked}
            nodes={nodes} setNodes={setNodes}
            linkStats={linkStats} setLinkStats={setLinkStats}
            coverageOverlay={coverageOverlay} setCoverageOverlay={setCoverageOverlay}
            propagationSettings={propagationSettings} setPropagationSettings={setPropagationSettings}
            budget={budget} distance={distance} units={units}
            onManualClick={(e) => handleNodeSelect({ lat: e.latlng.lat, lng: e.latlng.lng }, false)}
        />

        <ViewshedLayerManager
            active={toolMode === 'viewshed'}
            observer={viewshedObserver} setObserver={setViewshedObserver}
            runAnalysis={runViewshedAnalysis}
            isCalculating={isViewshedCalculating}
            progress={viewshedProgress}
            maxDist={viewshedMaxDist} setMaxDist={setViewshedMaxDist}
            clear={clearViewshed}
            isMobile={isMobile}
        />

        <CoverageLayerManager
            active={toolMode === 'rf_coverage'}
            observer={rfObserver} setObserver={setRfObserver}
            runAnalysis={runRFAnalysis}
            isCalculating={isRFCalculating}
            clear={clearRFCoverage}
            bounds={rfResultLayer?.bounds ? [
                [rfResultLayer.bounds.south, rfResultLayer.bounds.west],
                [rfResultLayer.bounds.north, rfResultLayer.bounds.east]
            ] : null}
        />

        <OptimizationLayerManager
            active={toolMode === 'optimize'}
            setActive={(active) => setToolMode(active ? "optimize" : "none")}
            siteAnalysisMode={siteAnalysisMode}
            lastClickedLocation={lastClickedLocation}
            setLastClickedLocation={setLastClickedLocation}
            onStateUpdate={handleOptimizationStateUpdate}
            weights={siteSelectionWeights}
            simNodes={simNodes}
            simResults={simResults}
            interNodeLinks={interNodeLinks}
            compositeOverlay={compositeOverlay}
            units={units}
        />

        {/* Batch Nodes Rendering */}
        {batchNodes.length > 0 && batchNodes.map((node) => {
            const isTX = selectedBatchNodes[0]?.id === node.id;
            const isRX = selectedBatchNodes[1]?.id === node.id;
            const isSelected = isTX || isRX;

            let className = "batch-node-icon";
            let bgColor = "#00f2ff";
            let boxShadow = "0 0 8px rgba(0, 242, 255, 0.6)";

            if (isSelected) {
              if (isTX) { bgColor = "#00ff41"; boxShadow = "0 0 12px rgba(0, 255, 65, 0.8)"; }
              else if (isRX) { bgColor = "#ff0000"; boxShadow = "0 0 12px rgba(255, 0, 0, 0.8)"; }
            }

            return (
              <Marker
                key={`batch-${node.id}`}
                position={[node.lat, node.lng]}
                icon={L.divIcon({
                  className: className,
                  html: `<div style="background-color: ${bgColor}; width: 12px; height: 12px; border-radius: 50%; opacity: 0.9; border: 2px solid white; box-shadow: ${boxShadow};"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6],
                })}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    handleNodeSelect(node, true);
                  },
                }}
              >
                <Popup>{node.name}</Popup>
              </Marker>
            );
        })}

        {/* Batch Nodes Panel */}
        {showBatchPanel && batchNodes.length > 0 && (
          <BatchNodesPanelWrapper
            nodes={batchNodes}
            selectedNodes={selectedBatchNodes}
            onClear={() => {
              setBatchNodes([]);
              setShowBatchPanel(false);
              resetToolState();
            }}
            onNodeSelect={(node) => handleNodeSelect(node, true)}
            forceMinimized={isMobile && nodes.length === 2}
          />
        )}

      </MapContainer>

      <SiteAnalysisPanel 
          active={toolMode === 'optimize'}
          isResultsVisible={showAnalysisResults}
          mode={siteAnalysisMode}
          setMode={setSiteAnalysisMode}
          weights={siteSelectionWeights}
          setWeights={setSiteSelectionWeights}
          selectedLocation={lastClickedLocation}
      />

      <MapToolbar
        toolMode={toolMode}
        setToolMode={setToolMode}
        resetToolState={resetToolState}
      />

      <GuidanceOverlays
          toolMode={toolMode}
          siteAnalysisMode={siteAnalysisMode}
          nodes={nodes}
          optimizeState={optimizeState}
          isResultsVisible={showAnalysisResults}
          isMobile={isMobile}
          viewshedObserver={viewshedObserver}
          rfObserver={rfObserver}
          linkHelp={linkHelp} setLinkHelp={setLinkHelp}
          elevationHelp={elevationHelp} setElevationHelp={setElevationHelp}
          viewshedHelp={viewshedHelp} setViewshedHelp={setViewshedHelp}
          rfHelp={rfHelp} setRFHelp={setRFHelp}
      />

      {/* Clear Link Button */}
      {nodes.length > 0 && (
        <div style={{ position: "absolute", top: 72, left: 60, zIndex: 1000, display: "flex", gap: "12px" }}>
          <button
            onClick={() => setIsLinkLocked(!isLinkLocked)}
            style={{
              background: isLinkLocked ? "#00f2ff" : "rgba(0, 0, 0, 0.6)",
              color: isLinkLocked ? "#000" : "#fff",
              border: "1px solid #00f2ff",
              padding: "0 12px",
              height: "36px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isLinkLocked ? <><span style={{ fontSize: "1em" }}>🔒</span> Locked</> : <><span style={{ fontSize: "1em" }}>🔓</span> Lock</>}
          </button>

          <button
            onClick={() => {
                resetLinkTool();
            }}
            style={{
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
            }}
          >
            Clear Link
          </button>
        </div>
      )}

      {/* Site Analysis Results Panel */}
      {showAnalysisResults && simResults && simResults.length > 0 && (
        <SiteAnalysisResultsPanel
          results={simResults}
          interNodeLinks={interNodeLinks}
          totalUniqueCoverageKm2={totalUniqueCoverageKm2}
          units={units}
          onCenter={(res) => {
              if (map) map.flyTo([res.lat, res.lon], 15);
          }}
          onClear={() => {
              setShowAnalysisResults(false);
              useSimulationStore.getState().reset();
          }}
          onRunNew={() => {
              setShowAnalysisResults(false);
              setToolMode('optimize');
              setSiteAnalysisMode('manual');
          }}
        />
      )}

    </div>
  );
};

// Wrapper to allow hook usage inside MapContainer
const HandlerWrapper = (props) => {
    useMapEventHandlers(props);
    return null;
}

export default MapComponent;
