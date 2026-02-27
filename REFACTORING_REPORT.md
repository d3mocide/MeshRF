# MeshRF Codebase Refactoring Report

**Generated**: 2026-02-25
**Project**: MeshRF — RF Propagation & Link Analysis Tool for LoRa Mesh Networks

---

## Project Overview

MeshRF is a full-stack RF propagation and link analysis application for LoRa mesh networks (Meshtastic, Reticulum, Sidewinder). It consists of:

- **Frontend**: React + Leaflet (map visualization) + Vite
- **Backend**: Python FastAPI + Celery workers for long-running tasks
- **Physics Core**: WebAssembly (WASM) implementation of ITM (Longley-Rice) propagation model
- **Infrastructure**: Redis caching, OpenTopoData elevation API, Docker

**Codebase Health Summary**:
- ~13,033 total source lines across 63 files
- Average file size: ~207 lines / Median: ~140 lines
- **20 files (31.7%) exceed 200 lines**
- The top 3 files alone account for ~20% of all code

---

## Files by Size (All Files ≥ 200 Lines)

| Rank | File | Lines | Priority | Status |
|------|------|-------|----------|--------|
| 1 | `src/components/Map/MapContainer.jsx` | 1173 | CRITICAL | **REFACTORED** |
| 2 | `src/components/Layout/Sidebar.jsx` | 829 | CRITICAL | **REFACTORED** |
| 3 | `src/components/Map/LinkAnalysisPanel.jsx` | 643 | HIGH | Pending |
| 4 | `src/components/Map/UI/SiteAnalysisResultsPanel.jsx` | 609 | HIGH | Pending |
| 5 | `src/components/Map/OptimizationLayer.jsx` | 517 | HIGH | Pending |
| 6 | `rf-engine/server.py` | 475 | HIGH | **REFACTORED** |
| 7 | `src/components/Map/UI/NodeManager.jsx` | 440 | MEDIUM | Pending |
| 8 | `src/components/Map/OptimizationResultsPanel.jsx` | 435 | MEDIUM | Pending |
| 9 | `src/components/Map/LinkLayer.jsx` | 429 | MEDIUM | Pending |
| 10 | `rf-engine/tasks/viewshed.py` | 398 | MEDIUM | Pending |
| 11 | `src/utils/rfMath.js` | 366 | LOW | Pending |
| 12 | `src/components/Map/BatchNodesPanel.jsx` | 354 | MEDIUM | Pending |
| 13 | `src/hooks/useViewshedTool.js` | 343 | MEDIUM | Pending |
| 14 | `rf-engine/tile_manager.py` | 334 | MEDIUM | **REFACTORED** |
| 15 | `src/components/Map/BatchProcessing.jsx` | 321 | LOW | Pending |
| 16 | `src/components/Map/UI/GuidanceOverlays.jsx` | 318 | LOW | Pending |
| 17 | `src/context/RFContext.jsx` | 307 | MEDIUM | **REFACTORED** (Facade) |
| 18 | `src/hooks/useRFCoverageTool.js` | 277 | LOW | Pending |
| 19 | `src/components/Map/Controls/ViewshedControl.jsx` | 225 | LOW | Pending |
| 20 | `rf-engine/rf_physics.py` | 221 | LOW | Pending |

---

## Detailed File Analysis

### CRITICAL Priority

---

#### 1. `src/components/Map/MapContainer.jsx` — 1173 lines

**Status**: Refactored (Phase 1b)
- **Extracted Managers**:
    - `LinkLayerManager.jsx`: Handles Link Layer and Panel.
    - `ViewshedLayerManager.jsx`: Handles Viewshed Layer, Marker, Control.
    - `CoverageLayerManager.jsx`: Handles RF Coverage Layer, Marker, Recalc Logic.
    - `OptimizationLayerManager.jsx`: Handles Optimization Layer, Multi-site clicks, Simulation results.
- **Extracted Hooks**:
    - `useLinkTool.js`: Manages link state (nodes, stats, locking).
    - `useMapEventHandlers.js`: Manages map click/interaction logic.
- **Result**: `MapContainer.jsx` is now a high-level orchestrator focusing on coordinating tools and layers.

---

#### 2. `src/components/Layout/Sidebar.jsx` — 829 lines

**Status**: Refactored (Phase 1a)
- **Extracted Sections**:
    - `HardwareSection.jsx`: Device, Antenna, Power, Cable settings.
    - `EnvironmentSection.jsx`: ITM params (Ground, Climate, K-Factor).
    - `LoRaBandSection.jsx`: Radio settings (Freq, BW, SF, CR).
    - `SettingsSection.jsx`: Global settings (Units, Map Style).
- **Reusable Component**: `CollapsibleSection.jsx`.
- **Result**: `Sidebar.jsx` is now a clean layout container composing these sections.

---

### HIGH Priority

---

#### 3. `src/components/Map/LinkAnalysisPanel.jsx` — 643 lines

**What it does**: Panel displaying point-to-point RF link analysis results — link budget, signal quality, Fresnel clearance, diffraction loss, model comparison, and drag/resize behaviour.

**Logical sections**:
1. Status color/text logic (lines 36–72)
2. Responsive sizing logic (lines 74–91)
3. Panel drag/resize handlers (lines 93–250)
4. Help modals (lines 260–450)
5. JSX render (lines 450–643)

**Suggested split**:

```
src/components/Map/
├── LinkAnalysisPanel.jsx            (~200 lines) — composition
├── UI/
│   ├── LinkStatusIndicator.jsx      (~80 lines)
│   ├── LinkBudgetDisplay.jsx        (~100 lines)
│   ├── FresnelZoneVisualization.jsx (~80 lines)
│   └── ModelComparisonTable.jsx     (~120 lines)
└── hooks/
    ├── useDraggablePanel.js         (~100 lines)
    └── useResponsiveSize.js         (~40 lines)
```

---

#### 4. `src/components/Map/UI/SiteAnalysisResultsPanel.jsx` — 609 lines

**What it does**: Displays inter-node link matrix, mesh topology graph, and coverage redundancy analysis. Contains BFS path-finding algorithm inline.

**Logical sections**:
1. Helper functions and status colors (lines 1–75)
2. BFS mesh path-finding algorithm (lines 38–110)
3. Component state and hooks (lines 120–200)
4. Link matrix table (lines 240–450)
5. Topology graph visualization (lines 460–609)

**Suggested split**:

```
src/components/Map/UI/
├── SiteAnalysisResultsPanel.jsx  (~200 lines) — composition
├── LinkMatrix.jsx                (~150 lines)
├── TopologyGraph.jsx             (~150 lines)
└── StatusBadge.jsx               (~40 lines)
src/utils/
└── meshTopology.js               (~100 lines) — BFS, connectivity algorithms
```

---

#### 5. `src/components/Map/OptimizationLayer.jsx` — 517 lines

**What it does**: Interactive map layer for site optimization — heatmap generation, ranked candidate display, optimization settings, and real-time feedback.

**Suggested split**:

```
src/components/Map/
├── OptimizationLayer.jsx         (~200 lines) — orchestration
├── UI/
│   ├── OptimizationSettings.jsx  (~120 lines)
│   ├── CandidateNodeMarker.jsx   (~80 lines)
│   └── HeatmapOverlay.jsx        (~80 lines)
└── hooks/
    └── useOptimizationHeatmap.js (~80 lines)
```

---

#### 6. `rf-engine/server.py` — 475 lines

**Status**: Refactored (Phase 2)
- **Extracted Routers**:
    - `routers/analysis.py`: Link analysis endpoint.
    - `routers/elevation.py`: Elevation and tile endpoints.
    - `routers/tasks.py`: Async task management.
    - `routers/optimization.py`: Optimization and export endpoints.
- **Shared Dependencies**:
    - `dependencies.py`: Handles Redis, TileManager, and Limiter instances.
- **Result**: `server.py` is now a minimal entry point focusing on app setup and middleware.

---

---

### MEDIUM Priority

---

#### 7. `src/components/Map/UI/NodeManager.jsx` — 440 lines

**What it does**: UI for managing the multi-site node list — add/remove, sorting, CSV import/export.

**Suggested split**:

```
src/components/Map/UI/
├── NodeManager.jsx           (~180 lines)
├── NodeListTable.jsx         (~120 lines)
└── AddNodeDialog.jsx         (~80 lines)
src/utils/
└── csvImportExport.js        (~80 lines)
```

---

#### 8. `src/components/Map/OptimizationResultsPanel.jsx` — 435 lines

**What it does**: Displays ranked optimization results with sorting, detail expansion, and export.

**Suggested split**:

```
src/components/Map/
├── OptimizationResultsPanel.jsx  (~150 lines)
├── UI/
│   ├── ResultTable.jsx           (~120 lines)
│   └── ResultRow.jsx             (~80 lines)
src/utils/
└── processOptimizationResults.js (~60 lines)
```

---

#### 9. `src/components/Map/LinkLayer.jsx` — 429 lines

**What it does**: Renders coloured polylines between nodes on the map to show link quality. Handles click popups and real-time updates.

**Suggested split**:

```
src/components/Map/
├── LinkLayer.jsx         (~200 lines)
├── UI/
│   └── LinkPolyline.jsx  (~120 lines)
src/utils/
└── linkStyleHelpers.js   (~60 lines) — color/width by quality
```

---

#### 10. `rf-engine/tasks/viewshed.py` — 398 lines

**What it does**: Celery task for batch viewshed computation — multi-node processing, site ranking, PNG image generation, and Redis storage.

**Suggested split**:

```
rf-engine/
├── tasks/viewshed.py             (~120 lines) — Celery task definition only
├── processors/viewshed_proc.py   (~150 lines) — computation and ranking logic
└── utils/image_utils.py          (~80 lines) — PNG encoding helpers
```

---

#### 11. `rf-engine/tile_manager.py` — 334 lines

**Status**: Refactored (Phase 2)
- **Extracted Components**:
    - `rf-engine/cache_layer.py`: Encapsulates Redis caching operations.
    - `rf-engine/elevation_client.py`: Manages OpenTopoData API interactions and retries.
    - `rf-engine/grid_processor.py`: Contains static methods for grid interpolation and elevation extraction.
- **Result**: `TileManager` is now a clean orchestrator class.

---

---

#### 12. `src/context/RFContext.jsx` — 307 lines

**Status**: Refactored (Phase 1)
- Implemented **Facade Strategy**:
    - `UIContext.jsx`: UI state.
    - `HardwareContext.jsx`: Node configs.
    - `EnvironmentContext.jsx`: ITM params.
    - `RadioContext.jsx`: LoRa settings.
    - `RFContext.jsx`: Wrapper that composes these contexts and exports a unified hook.
- **Result**: Clean separation of concerns while maintaining backward compatibility.

---

#### 13. `src/hooks/useViewshedTool.js` — 343 lines

**What it does**: Hook managing WASM viewshed calculation through Web Worker communication — task submission, progress tracking, result layer management.

**Suggested split**:

```
src/hooks/
├── useViewshedTool.js   (~180 lines)
└── useWorkerState.js    (~80 lines) — generic worker communication helpers
```

---

### LOW Priority (Well-Structured, Minor Improvements Only)

| File | Lines | Note |
|------|-------|------|
| `src/utils/rfMath.js` | 366 | Already logically organized by function. Could optionally split into `fspl.js`, `fresnel.js`, `lora.js`, `bullington.js` — not urgent. |
| `src/components/Map/BatchNodesPanel.jsx` | 354 | Extract `BatchNodesList.jsx` table sub-component. |
| `src/components/Map/BatchProcessing.jsx` | 321 | Move CSV parsing to `src/utils/csvParser.js`. |
| `src/components/Map/UI/GuidanceOverlays.jsx` | 318 | Move help text constants to `helpContent.js`. |
| `src/hooks/useRFCoverageTool.js` | 277 | Extract tile processing utilities. |
| `src/components/Map/Controls/ViewshedControl.jsx` | 225 | Already focused — minimal changes needed. |
| `rf-engine/rf_physics.py` | 221 | Well-organized — modularize only if it grows. |

---

## Refactoring Progress

### Phase 1 — Frontend Core (COMPLETED)

1.  **MapContainer.jsx** (1173 → ~250 lines): Refactored into Layer Managers (`LinkLayerManager`, `ViewshedLayerManager`, `CoverageLayerManager`, `OptimizationLayerManager`) and Hooks (`useLinkTool`, `useMapEventHandlers`).
2.  **Sidebar.jsx** (829 → ~200 lines): Refactored into Sections (`HardwareSection`, `EnvironmentSection`, `LoRaBandSection`, `SettingsSection`).
3.  **RFContext.jsx**: Refactored using Facade pattern (`UIContext`, `HardwareContext`, `EnvironmentContext`, `RadioContext`).

---

### Phase 2 — Backend API Structure (COMPLETED)

3. **server.py** (475 → ~80 lines): Refactored into `routers/` directory with `analysis.py`, `elevation.py`, `tasks.py`, `optimization.py`.
4. **tile_manager.py** (334 → ~120 lines): Extracted `cache_layer.py`, `elevation_client.py`, `grid_processor.py`.

**Status**: Verified with tests and import checks.

---

---

### Phase 3 — Analysis Components

5. **LinkAnalysisPanel.jsx** (643 → ~200 lines): Extract status, budget, Fresnel, and model comparison sub-components + `useDraggablePanel` hook.
6. **SiteAnalysisResultsPanel.jsx** (609 → ~200 lines): Extract `LinkMatrix`, `TopologyGraph`, and move BFS algorithm to `meshTopology.js`.
7. **viewshed.py** (398 → ~120 lines): Separate Celery task definition from processing logic and image utilities.

**Expected effort**: 2–3 days
**Risk**: Medium — analysis panels have complex prop drilling.

---

### Phase 4 — State Management

8. **RFContext.jsx** (307 → ~80 lines each): Split into 4 focused contexts. This change affects nearly every component, so coordinate with Phase 1 changes. (ALREADY COMPLETED IN PHASE 1 VIA FACADE)

**Expected effort**: 1–2 days
**Risk**: High — touches every component. Do this last and test end-to-end.

---

### Phase 5 — Cleanup (Low Priority)

9. Remaining MEDIUM/LOW priority files — `NodeManager`, `OptimizationLayer`, `LinkLayer`, `OptimizationResultsPanel`, `rfMath.js`, batch components.

**Expected effort**: 2–3 days
**Risk**: Low.
