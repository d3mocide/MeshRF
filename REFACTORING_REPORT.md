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

| Rank | File | Lines | Priority |
|------|------|-------|----------|
| 1 | `src/components/Map/MapContainer.jsx` | 1173 | CRITICAL |
| 2 | `src/components/Layout/Sidebar.jsx` | 829 | CRITICAL |
| 3 | `src/components/Map/LinkAnalysisPanel.jsx` | 643 | HIGH |
| 4 | `src/components/Map/UI/SiteAnalysisResultsPanel.jsx` | 609 | HIGH |
| 5 | `src/components/Map/OptimizationLayer.jsx` | 517 | HIGH |
| 6 | `rf-engine/server.py` | 475 | HIGH |
| 7 | `src/components/Map/UI/NodeManager.jsx` | 440 | MEDIUM |
| 8 | `src/components/Map/OptimizationResultsPanel.jsx` | 435 | MEDIUM |
| 9 | `src/components/Map/LinkLayer.jsx` | 429 | MEDIUM |
| 10 | `rf-engine/tasks/viewshed.py` | 398 | MEDIUM |
| 11 | `src/utils/rfMath.js` | 366 | LOW |
| 12 | `src/components/Map/BatchNodesPanel.jsx` | 354 | MEDIUM |
| 13 | `src/hooks/useViewshedTool.js` | 343 | MEDIUM |
| 14 | `rf-engine/tile_manager.py` | 334 | MEDIUM |
| 15 | `src/components/Map/BatchProcessing.jsx` | 321 | LOW |
| 16 | `src/components/Map/UI/GuidanceOverlays.jsx` | 318 | LOW |
| 17 | `src/context/RFContext.jsx` | 307 | MEDIUM |
| 18 | `src/hooks/useRFCoverageTool.js` | 277 | LOW |
| 19 | `src/components/Map/Controls/ViewshedControl.jsx` | 225 | LOW |
| 20 | `rf-engine/rf_physics.py` | 221 | LOW |

---

## Detailed File Analysis

### CRITICAL Priority

---

#### 1. `src/components/Map/MapContainer.jsx` — 1173 lines

**What it does**: The main map orchestrator. Manages all map layers, tool modes, user interactions, and coordinates between Leaflet, WASM workers, and React state.

**Why it's a problem**: At 1173 lines it violates single-responsibility badly. It contains map config, event handlers, layer rendering logic, tool state machines, and full JSX output — all in one file. Changes to any one tool risk breaking others.

**Logical sections**:
1. Imports and SVG icon definitions (lines 1–50)
2. Map initialization and state setup (lines 60–150)
3. Tool event handlers and callbacks (lines 160–350)
4. Layer rendering conditions (lines 360–600)
5. Main JSX render (lines 610–1173)

**Suggested split**:

```
src/components/Map/
├── MapContainer.jsx              (~200 lines) — core orchestration only
├── config/
│   └── MapConfig.js              (~50 lines) — Leaflet tile/options config
├── hooks/
│   └── useMapEventHandlers.js    (~150 lines) — click, drag, keypress handlers
├── layers/
│   ├── ViewshedLayerManager.jsx  (~150 lines)
│   ├── CoverageLayerManager.jsx  (~150 lines)
│   ├── OptimizationLayerManager.jsx (~150 lines)
│   └── LinkLayerManager.jsx      (~150 lines)
```

**Target**: MapContainer.jsx shrinks to ~200 lines of pure composition.

---

#### 2. `src/components/Layout/Sidebar.jsx` — 829 lines

**What it does**: Configuration panel for RF hardware, environment, LoRa band settings, batch processing, and map options.

**Why it's a problem**: A single component rendering 6 logically distinct panels. Each panel has its own state, event handlers, and JSX. Changes to hardware settings risk breaking environment settings and vice versa.

**Logical sections**:
1. `CollapsibleSection` helper component (lines 6–57)
2. State and hooks (lines 59–166)
3. Hardware configuration (lines 300–535)
4. Environment settings (lines 537–625)
5. LoRa band settings (lines 627–707)
6. Batch + settings footer (lines 711–829)

**Suggested split**:

```
src/components/Layout/
├── Sidebar.jsx                   (~150 lines) — layout and section composition
└── sections/
    ├── HardwareSection.jsx       (~200 lines) — device, antenna, power, cable
    ├── EnvironmentSection.jsx    (~150 lines) — ground type, climate, k-factor
    ├── LoRaBandSection.jsx       (~150 lines) — frequency, BW, SF, CR
    └── CollapsibleSection.jsx    (~60 lines)  — reusable wrapper
```

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

**What it does**: Main FastAPI application with endpoints for link analysis, elevation lookups, terrain tile serving, and async Celery task management.

**Logical sections**:
1. App setup, CORS, rate limiting (lines 1–45)
2. Pydantic request models (lines 44–75)
3. Link analysis endpoints (lines 71–137)
4. Elevation endpoints (lines 138–228)
5. Async task endpoints (lines 231–475)

**Suggested split**:

```
rf-engine/
├── server.py                  (~80 lines) — app creation, middleware, router registration
├── schemas.py                 (~80 lines) — all Pydantic models (consolidate existing)
├── dependencies.py            (~50 lines) — Redis, tile_manager DI
└── routers/
    ├── analysis.py            (~120 lines) — link analysis endpoints
    ├── elevation.py           (~100 lines) — elevation + tile serving
    └── tasks.py               (~150 lines) — async task submission and polling
```

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

**What it does**: High-performance elevation tile caching with request coalescing, thread pool management, Redis TTL caching, and interpolation.

**Suggested split**:

```
rf-engine/
├── tile_manager.py           (~120 lines) — orchestration
├── cache_layer.py            (~80 lines)  — Redis caching logic
├── elevation_client.py       (~80 lines)  — API fetch implementation
└── grid_processor.py         (~80 lines)  — interpolation and grid ops
```

---

#### 12. `src/context/RFContext.jsx` — 307 lines

**What it does**: Central React Context holding all RF configuration state — hardware, radio, environment, and UI state — shared across all components.

**Suggested split**:

```
src/context/
├── RFContext.jsx           (~80 lines)  — root provider composing all contexts
├── HardwareContext.jsx     (~80 lines)  — Node A/B antenna/device config
├── EnvironmentContext.jsx  (~60 lines)  — ITM model parameters
├── RadioContext.jsx        (~60 lines)  — LoRa band settings
└── UIContext.jsx           (~60 lines)  — tool mode, sidebar, edit mode
```

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

## Recommended Refactoring Phases

### Phase 1 — Frontend Core (Highest ROI)

Target the two largest files to eliminate the "big ball of mud" problem:

1. **MapContainer.jsx** (1173 → ~200 lines): Extract 4 layer manager components and a `useMapEventHandlers` hook. This is the highest-risk file for accidental regressions.
2. **Sidebar.jsx** (829 → ~150 lines): Extract 3 section components and the `CollapsibleSection` helper.

**Expected effort**: 3–5 days
**Risk**: Medium — both files have complex state wiring; test thoroughly after each split.

---

### Phase 2 — Backend API Structure

Reorganize `server.py` into FastAPI routers — this is low-risk since Python imports are explicit and easy to verify:

3. **server.py** (475 → ~80 lines): Create `routers/` directory with `analysis.py`, `elevation.py`, `tasks.py`.
4. **tile_manager.py** (334 → ~120 lines): Extract `cache_layer.py`, `elevation_client.py`, `grid_processor.py`.

**Expected effort**: 1–2 days
**Risk**: Low — FastAPI router pattern is well-defined.

---

### Phase 3 — Analysis Components

5. **LinkAnalysisPanel.jsx** (643 → ~200 lines): Extract status, budget, Fresnel, and model comparison sub-components + `useDraggablePanel` hook.
6. **SiteAnalysisResultsPanel.jsx** (609 → ~200 lines): Extract `LinkMatrix`, `TopologyGraph`, and move BFS algorithm to `meshTopology.js`.
7. **viewshed.py** (398 → ~120 lines): Separate Celery task definition from processing logic and image utilities.

**Expected effort**: 2–3 days
**Risk**: Medium — analysis panels have complex prop drilling; consider whether this is a good time to introduce a data-fetching pattern (e.g., React Query).

---

### Phase 4 — State Management

8. **RFContext.jsx** (307 → ~80 lines each): Split into 4 focused contexts. This change affects nearly every component, so coordinate with Phase 1 changes.

**Expected effort**: 1–2 days
**Risk**: High — touches every component. Do this last and test end-to-end.

---

### Phase 5 — Cleanup (Low Priority)

9. Remaining MEDIUM/LOW priority files — `NodeManager`, `OptimizationLayer`, `LinkLayer`, `OptimizationResultsPanel`, `rfMath.js`, batch components.

**Expected effort**: 2–3 days
**Risk**: Low.

---

## General Recommendations

1. **Extract algorithms from UI**: Several components contain inline algorithms (BFS in `SiteAnalysisResultsPanel`, diffraction in `LinkAnalysisPanel`). Move all pure logic to `src/utils/` or `rf-engine/utils/` — this makes testing significantly easier.

2. **Introduce a service layer**: API calls are scattered across hooks and components. Centralizing them in `src/services/rfService.js` and `src/services/elevationService.js` would decouple components from fetch logic.

3. **Colocate tests**: As files are split, add unit tests for extracted utility functions. Pure math functions like those in `rfMath.js` and `rf_physics.py` are ideal first targets.

4. **Avoid premature abstraction**: Not every file needs splitting. The LOW-priority files (≤225 lines) are generally well-scoped — leave them unless they grow.

5. **Incremental approach**: Refactor one file at a time. Avoid large "big bang" refactors that make code review difficult and increase regression risk.
