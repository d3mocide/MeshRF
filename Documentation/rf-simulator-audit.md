# RF Simulator — Audit & Roadmap

**Audited:** 2026-05-18  
**Version at audit:** 1.16.1  

---

## Pipeline Overview

The end-to-end flow is functional:

```
Map click → CoverageClickHandler → useRFCoverageTool.runAnalysis()
  → fetch 3×3 elevation tiles (zoom 10 or 12)
  → stitch tiles (tileStitcher)
  → WASM ITM (calculate_rf_coverage)
  → Float32Array of dBm values
  → ScatterplotLayer (DeckGL dots)
```

All RF parameters flow correctly into the calculation: frequency, TX power, antenna gain, cable loss, RX sensitivity, ground type (epsilon/sigma), and climate zone. The transmitter marker is draggable and recalculates on drop. The `recalcTimestamp` mechanism triggers recalculation when sidebar parameters change.

---

## Known Bugs

### BUG-1 — CSS Syntax Error in Loading Spinner (Low)

**File:** `src/components/Map/layers/CoverageLayerManager.jsx:194`

```css
/* Current (broken) */
@keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.7); } }
                                                                    ^
                                                         stray closing paren
```

The `pulse-text` animation is silently invalid. The spinner rotates but the text does not pulse as intended.

**Fix:** Remove the stray `)`.

---

### BUG-2 — WASM Cache-Busted on Every Page Load (Medium)

**File:** `src/hooks/useRFCoverageTool.js:28`

```js
return `/meshrf.wasm?v=${new Date().getTime()}`;
```

A unique timestamp query string is appended on every load, bypassing the browser cache and forcing a fresh 109 KB download each visit. The viewshed and ITM hooks do not do this.

**Fix:** Remove the timestamp or use a build-time hash (e.g., `import.meta.env.VITE_BUILD_HASH`).

---

### BUG-3 — WASM Load Errors Are Silently Dropped (Medium)

**File:** `src/components/Map/MapContainer.jsx:104–109`

```js
const {
    runAnalysis: runRFAnalysis,
    resultLayer: rfResultLayer,
    isCalculating: isRFCalculating,
    clear: clearRFCoverage,
    // wasmError is returned by the hook but never destructured here
} = useRFCoverageTool(toolMode === "rf_coverage");
```

`useRFCoverageTool` returns `wasmError` and guards against running without a loaded module, but `MapContainer` never reads it. If WASM fails to load, the user clicks the map and nothing happens — no feedback.

**Fix:** Destructure `wasmError` and display it in `CoverageLayerManager` (same pattern as the `isCalculating` spinner).

---

### BUG-4 — `RFCoverageLayer.js` (BitmapLayer) Is Written but Never Used (High)

**File:** `src/components/Map/RFCoverageLayer.js`

A complete custom `BitmapLayer` subclass with a GLSL fragment shader was implemented. It:
- Decodes dBm from a texture (encoding: `byte = (dBm + 150) / 200 * 255`)
- Computes SNR from a noise floor uniform
- Maps SNR to a smooth color gradient (Excellent → Poor)
- Fades signals below sensitivity to faint blue rather than discarding them
- Accepts `rxSensitivity`, `noiseFloor`, `opacity`, and `bounds` as uniforms

**What's used instead:** `MapContainer.jsx:245` instantiates a plain `ScatterplotLayer` — one dot per grid pixel, 2–6 px radius. At large radii or low zoom levels, dots have visible gaps and the rendering looks sparse.

**Fix:** Build a texture from `resultLayer.data`, pass it to `RFCoverageLayer`, and replace the `ScatterplotLayer` block. The shader already handles all color logic; `MapContainer` only needs to handle texture creation.

---

## Missing / Incomplete Features

### FEAT-1 — No RF Simulator Control Panel (High)

The Viewshed tool has a dedicated floating control panel (`ViewshedLayerManager`) with a radius slider, recalculate button, and progress bar. The RF Simulator has none of this. There is no way for the user to:
- Adjust coverage radius (hardcoded to 25 km — see FEAT-2)
- Manually trigger recalculation without changing a sidebar parameter
- See calculation progress beyond a generic spinner

**Reference:** `src/components/Map/layers/ViewshedLayerManager.jsx` for the UX pattern to follow.

---

### FEAT-2 — Coverage Radius Is Hardcoded to 25 km (Medium)

**Files:** `src/components/Map/layers/CoverageLayerManager.jsx:53,117`

```js
runAnalysis(lat, lng, h, 25000, rfParams);  // on recalc
runAnalysis(lat, lng, h, 25000, rfParams);  // on drag end
```

Users cannot change the radius. For dense urban planning a 5 km radius would be more useful; for hilltop mesh planning 40 km might be needed.

**Fix:** Add a radius slider to the RF control panel (FEAT-1) and thread the value through to `runAnalysis`.

---

### FEAT-3 — No Signal Quality Legend on Map (Low)

The `rf-simulator.md` documentation defines a color table:

| Color | Quality | Threshold |
|-------|---------|-----------|
| Dark Green | Excellent | > 10 dB margin |
| Light Green | Good | 5–10 dB |
| Yellow | Fair | 0–5 dB |
| Orange | Marginal | near sensitivity floor |
| Purple/Fade | Poor | below sensitivity |

Nothing renders this on the map. Users have no in-app reference for what the colors mean.

**Fix:** Small fixed legend overlay, similar to the one used in the Optimization heatmap.

---

### FEAT-4 — No Propagation Model Selection (Medium) — ROADMAP P3-2

The coverage tool is hardwired to WASM ITM regardless of the model selected in the Link Analysis panel. For large areas, ITM is slow; FSPL or Hata would allow fast "preview" quality maps.

**Planned work (P3-2):** Add a model dispatch in `useRFCoverageTool.js` and a selector in the RF control panel (FEAT-1). ITM remains the default.

**Dependency:** P3-1 (client-side Hata/FSPL) must land first so the frontend is not backend-dependent for non-ITM models.

---

### FEAT-5 — Batch Processing Lacks ITM — ROADMAP P3-3

Batch mesh reports use FSPL + Bullington (frontend only). The WASM ITM path used by link analysis and RF coverage is not called for batch node pairs, so batch results are less accurate in terrain.

**Planned work (P3-3):** Fetch elevation profiles for each node pair in `BatchProcessing.jsx` and route through `useWasmITM`.

---

### FEAT-6 — Per-Node Coverage Visualization — ROADMAP P6-1

Multi-site analysis returns a merged composite overlay. Individual node coverage footprints are not visualized, making it impossible to tell which node covers which area.

**Planned work (P6-1):** Backend returns labeled per-node bitmasks; frontend renders distinct color layers or dashed boundary outlines per node.

---

## Recommended Fix Order

### Immediate (bugs, minimal effort)
1. **BUG-1** — Fix CSS syntax error (`0.7)` → `0.7`)
2. **BUG-2** — Remove WASM timestamp cache-bust
3. **BUG-3** — Destructure and display `wasmError` in `MapContainer`

### High Impact (complete the half-baked work)
4. **BUG-4** — Wire up `RFCoverageLayer.js` BitmapLayer to replace ScatterplotLayer dots
5. **FEAT-1 + FEAT-2** — Add RF control panel with radius slider and recalculate button
6. **FEAT-3** — Add signal quality legend overlay

### Roadmap (larger scope)
7. **FEAT-4** — Propagation model selection (P3-2, depends on P3-1)
8. **FEAT-5** — WASM ITM for batch processing (P3-3)
9. **FEAT-6** — Per-node coverage visualization (P6-1)

---

## Key Files

| Role | Path |
|------|------|
| Main hook | `src/hooks/useRFCoverageTool.js` |
| Click handler | `src/components/Map/Controls/CoverageClickHandler.jsx` |
| Marker + UI manager | `src/components/Map/layers/CoverageLayerManager.jsx` |
| Unused BitmapLayer | `src/components/Map/RFCoverageLayer.js` |
| Rendering (MapContainer) | `src/components/Map/MapContainer.jsx:185–266` |
| WASM C++ core | `libmeshrf/src/meshrf_coverage.cpp` |
| WASM bindings | `libmeshrf/src/bindings.cpp` |
| RF constants | `src/utils/rfConstants.js` |
