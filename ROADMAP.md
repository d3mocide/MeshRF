# MeshRF Propagation Engine Roadmap

**Last Updated:** 2026-07-27

---

## Completed

### Phase 1: Critical Bug Fixes

- [x] **P1-1** Fixed backend `/calculate-link` crash -- removed duplicate `req.rx_height` positional argument in `server.py:68-78` that caused `TypeError` on every call. Hata, Bullington, and FSPL models via the backend now work.
- [x] **P1-2** Wired `groundType`, `climate`, and `calculateSensitivity` to `CoverageClickHandler` via the `rfContext` prop in `MapContainer.jsx`. User's ground type and climate zone selections now flow to initial RF coverage calculations.
- [x] **P1-3** Added `epsilon`, `sigma`, and `climate` to the RF coverage recalculation path (`MapContainer.jsx` recalcTimestamp effect). The "Update Calculation" button now respects environment settings.
- [x] **P1-4** Fixed RF observer drag handler to include `txLoss` (cable loss), `epsilon`, `sigma`, `climate`, and use `nodeConfigs.B.antennaGain` instead of hardcoded `2.15` for rxGain.

### Phase 2: Consistency & Accuracy

- [x] **P2-1** Unified sensitivity calculation -- created canonical `calculateLoRaSensitivity(sf, bw)` in `rfMath.js` using SX1262 per-SF lookup table. Both `calculateLinkBudget` and `RFContext.calculateSensitivity` now delegate to this single function. Eliminated the 1.5 dB discrepancy between link analysis and coverage tools.
- [x] **P2-2** Updated LoRa sensitivity to SX1262 datasheet values. Per-SF lookup table at 125kHz: SF7=-124, SF8=-127, SF9=-130, SF10=-133, SF11=-135.5, SF12=-137 dBm. Replaces the old `-123 + 2.5*step` approximation.
- [x] **P2-3** Harmonized FSPL constant to `32.45` across `rfMath.js` and `rf_physics.py`, matching ITU-R P.525-4 (exact speed of light) and the C++ ITM vendor code.
- [x] **P2-4** Batch processing now uses per-node A/B configs (antenna height, gain, device loss) instead of GLOBAL proxy values. Fade margin is now included in batch link budgets. Bullington diffraction is applied for terrain-aware path loss instead of pure FSPL.

### Phase 5 Implementation (Feb 2026)

- [x] **P5-1** True LOS Viewshed: Implemented Fresnel zone analysis and LOS checks in backend `optimize_location`.
- [x] **P5-3** Adaptive Grid & Heatmap: Replaced fixed grid with dynamic density scan and added Heatmap visualization overlay in `OptimizationLayer`.
- [x] **P5-7** Export Capabilities: Added CSV and KML export for optimized site candidates via `/export-results` endpoint.

### Phase 3: Full Model Switching (Jul 2026)

- [x] **P3-1** Client-Side Hata/FSPL Models. Ported Okumura-Hata to JavaScript (`src/utils/math/hata.js`), mirroring `rf_physics.calculate_hata_loss` term-for-term so client and server agree to 4 decimal places. Added a dispatcher (`src/utils/math/pathLoss.js`) and wired `LinkLayer.jsx` to resolve `fspl` and `hata` locally -- these models now work with no backend, including offline/PWA. `bullington` and server `itm` deliberately stay on the backend, which applies `clutter_height` and `k_factor` to the terrain profile in ways the current JS Bullington does not.
- [x] **P3-3** WASM ITM for Batch Processing. `BatchProcessing.jsx` gained a propagation-model selector; choosing ITM runs the same WASM engine as Link Analysis over a denser 100-point profile (vs 20 for Bullington), honouring Ground Type and Climate Zone. The module loads lazily on selection, and an individual link that fails ITM falls back to Bullington rather than failing the report. The `Model` column records which model produced each row.
- [x] **P3-4** Per-Node Configs in Batch CSV. `csvParser.js` now reads optional `Antenna_Height`, `Antenna_Gain`, `TX_Power`, `Device` and `Antenna` columns (with aliases and loose preset-name matching); `nodeConfig.js` merges them over the global A/B config field-by-field. Blank cells and three-column files behave exactly as before. Mesh reports also export the per-node params used.

---

## Phase 3: Remaining

### P3-2: Model Selection for RF Coverage

Currently the RF coverage tool is hardwired to WASM ITM. Add a model dispatch in `useRFCoverageTool.js` that supports FSPL-only or Hata for faster coverage maps when full ITM precision isn't needed. ITM remains the default. Now that `calculateClientPathLoss` exists (P3-1), the remaining work is a JS raster path over the stitched elevation grid.

**Files:** `src/hooks/useRFCoverageTool.js`, `src/components/Map/Controls/CoverageClickHandler.jsx`

---

## Phase 4: Advanced Integration (Long-term)

### P4-1: Server-Side ITM via itmlogic

`itmlogic` was previously listed in `requirements.txt` but never imported, so it was dropped as a dead dependency (2026-07). Re-add it when this is implemented as a true Python ITM fallback for server-side batch processing and environments where WASM isn't available. Enables Celery workers to run ITM asynchronously.

**Files:** `rf-engine/rf_physics.py`, `rf-engine/tasks/`

### P4-3: Clutter / Land-Use Integration

Current clutter model applies a uniform height everywhere. Integrating land cover data (NLCD for US, Corine for EU) would enable per-pixel clutter classification: forest canopy height, urban building density, open field. This would significantly improve coverage accuracy in mixed environments.

**Dependencies:** Land cover tile server, clutter height lookup table

### P4-4: Antenna Pattern Support

All models currently assume omnidirectional antennas. The Yagi preset has 11 dBi gain but no directional pattern. Adding azimuth/elevation radiation patterns would enable:

- Directional link predictions
- Coverage maps with beam patterns
- Tilt optimization for hilltop sites

**Data needed:** Antenna pattern files (CSV or NEC2 format)

### P4-5: Multi-Hop Mesh Analysis

Current tools analyze point-to-point links only. A mesh planner would:

- Calculate end-to-end connectivity through relay chains
- Identify single points of failure
- Suggest optimal relay placement
- Estimate end-to-end latency and throughput

Could build on the batch processing infrastructure with graph analysis (Dijkstra/Floyd-Warshall for optimal paths).

### P4-6: Statistical Coverage Contours (Remaining)

Variability percentages are now user-selectable (see Recently Completed below). The remaining piece is *visualizing* the spread rather than picking a single operating point: rendering probability-of-reception contours by running the coverage grid at several percentages and shading the delta between them.

---

### High Priority Bugs (Immediate)

- [x] **Viewshed Shadow Regression**: Purple shadows are not rendering correctly in `WasmViewshedLayer`. Fixed in v1.14.2 via explicit shader state management.

## Current Focus: Elevation Scan & Coverage Analysis (v1.14.x)

### Global Improvements (All Tools)

#### P5-1: True LOS Viewshed (Completed)

**Status:** ✅ Implemented in Phase 5.

#### P5-2: High-Resolution Data Support

**Problem:** Limited to 10m/30m NED/SRTM.
**Solution:** Support LiDAR DSM (1-2m) and local tile stitching.
**Impact:** Urban canyon accuracy and precise vegetation blocking.

### Tool-Specific: Coverage Analysis (formerly Elevation Scan)

#### P5-3: Adaptive Grid & Heatmap (Completed)

**Status:** ✅ Implemented in Phase 5.
**Features:** Radial Scan, Density-based Grid, Heatmap Overlay.

#### P5-4: Advanced Prominence

**Problem:** Simple peak-minus-mean misses ridgelines.
**Solution:** Multi-scale prominence (1km, 5km rings) + Isolation metric.

### Tool-Specific: Site Manager (Manual Mode)

#### P5-5: True Marginal Gain Optimization (Completed)

**Status:** ✅ Implemented in v1.14.0/1.14.3.
**Features:** Multi-Site Analysis now computes unique coverage per site and marginal gain contribution.

#### P5-6: Pareto Frontier Analysis

**Problem:** Single score hides trade-offs.
**Solution:** Compute and visualize the Pareto frontier for multi-objective optimization (Elevation vs Coverage vs Access).

#### P5-7: Export Capabilities (Completed)

**Status:** ✅ Implemented in Phase 5 (CSV/KML).

## Recently Completed

### P4-6: Probabilistic / Variability Modes (Completed)

**Status:** ✅ Implemented 2026-07-27.
**Problem:** ITM's time/location/situation variability was hardcoded to 50/50/50 in `libmeshrf/src/meshrf_itm.cpp`, so every prediction was the median forecast with no way to plan for worst case.
**Solution:** Added `time_pct`, `loc_pct`, `sit_pct` and `mdvar` to `LinkParameters` (`libmeshrf/include/meshrf_itm.h`), exposed them through Embind (`src/bindings.cpp`), and threaded them into the coverage path (`calculate_rf_coverage` gained three trailing arguments). A **Reliability** selector in the Environment sidebar offers Best Case (10/10/10), Typical (50/50/50, default) and Reliable (90/90/90); the mode flows into Link Analysis, RF Coverage and batch ITM reports, and batch rows record which mode produced them.

All new fields are defaulted to the previous hardcoded values, so any caller that ignores them is unchanged -- verified against the built module: a call that never sets the new fields returns a bit-identical result to an explicit 50/50/50.

**Requires a WASM rebuild.** `public/meshrf.wasm`, `libmeshrf/js/meshrf.wasm` and `libmeshrf/js/meshrf.js` are regenerated artifacts and must be rebuilt whenever `libmeshrf/` C++ changes:

```sh
docker run --rm -v "$PWD/libmeshrf":/app -w /app emscripten/emsdk:latest \
  bash -c "mkdir -p build_wasm && cd build_wasm && emcmake cmake .. -DEMSCRIPTEN=1 && emmake make"
cp libmeshrf/build_wasm/meshrf.js  libmeshrf/js/meshrf.js
cp libmeshrf/build_wasm/meshrf.wasm libmeshrf/js/meshrf.wasm
cp libmeshrf/build_wasm/meshrf.wasm public/meshrf.wasm
```

Measured effect on a synthetic ridge profile (915 MHz, 10 m TX / 2 m RX): 10/10/10 = 193.49 dB, 50/50/50 = 203.76 dB, 90/90/90 = 213.66 dB.

### P4-2: COST 231-Hata Extension (Completed)

**Status:** ✅ Implemented 2026-07-27.
**Problem:** The Hata model only covered 150-1500 MHz, leaving the 1.5-2 GHz range unsupported.
**Solution:** Added COST 231-Hata to both engines (`calculate_cost231_loss` in `rf-engine/rf_physics.py`, `calculateCost231Loss` in `src/utils/math/hata.js`). Selecting "Hata" now auto-dispatches to COST 231 at or above 1500 MHz, and `cost231` is also accepted as an explicit backend model. Per the standard, COST 231 defines only the 3 dB metropolitan correction -- it has no suburban or rural term -- so `getHataValidity` warns when those environments are selected above the crossover instead of silently reusing the Okumura-Hata corrections. Validity warnings in the Link Analysis panel are now driven from that single helper rather than inline thresholds.

### P6-1: Per-Node Coverage Visualization (Completed)

**Status:** ✅ Implemented 2026-07-24.
**Problem:** Multi-Site analysis showed a single merged composite, making it hard to distinguish which node covers which area.
**Solution:** Backend (`rf-engine/core/viewshed_proc.py`) assigns each selected node a distinct evenly-spaced hue and renders per-node coverage as alpha-composited color layers instead of one flat overlay -- overlapping nodes blend naturally. Each result carries a `color` field. Frontend matches simulation node markers (`OptimizationLayerManager.jsx`) and the Sites results table (`SitesTab.jsx`) to the same color so a node's map marker, popup, and coverage patch are visually tied together.
