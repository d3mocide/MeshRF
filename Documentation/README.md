# MeshRF Documentation

Welcome to the MeshRF Documentation site. MeshRF is a powerful web-based toolset designed for RF planning, terrain analysis, and network optimization.

## Core Tools

- [**Link Analyzer**](./link-analyzer.md) - Point-to-point link budget and Fresnel zone analysis.
- [**Viewshed**](./viewshed.md) - Optical line-of-sight analysis using terrain data.
- [**RF Simulator**](./rf-simulator.md) - Radio propagation heatmaps and coverage analysis.
- [**Site Analysis**](./site-analyzer.md) - Rapid terrain analysis to find ideal transmitter locations, plus multi-site mesh planning.
- [**Hardware Settings**](./hardware-settings.md) - Detailed guide on devices, antennas, and radio presets.
- [**Batch Processing**](./batch-processing.md) - Bulk analysis and mesh report generation via CSV.

## Guides

- [**Tool Interactions**](./interactions.md) - How the tools combine into a planning workflow.
- [**PWA Guide**](./pwa-guide.md) - Installing meshRF on desktop and mobile.

## Getting Started

1. **Select a Tool**: Use the toolbar at the top of the map to select your analysis mode.
2. **Interact with the Map**: Click, drag, and drop markers to define your locations.
3. **Analyze Results**: View real-time charts, heatmaps, and stats panels.

> [!IMPORTANT]
> Selecting a different tool from the toolbar (e.g., switching from Link Analysis to Viewshed) will clear the current analysis markers and results from the map. However, your **Batch Nodes** will remain visible until you click **"Clear All Nodes"**.

## How it Works

MeshRF combines high-resolution terrain data (DEM) with specialized RF propagation models — Free Space Path Loss, Okumura-Hata / COST 231, Bullington diffraction, and ITM (Longley-Rice) — to provide accurate predictions for wireless network performance.

---

_For more details on how these tools work together, see [Tool Interactions](./interactions.md)._
