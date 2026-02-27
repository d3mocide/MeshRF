# MeshRF v1.16.1 - UI Interaction Patch

**Release Date**: February 26, 2026  
**Type**: Patch Release (Bug Fixes)  
**Focus**: Resolving UI interaction bugs caused by map event propagation blocking.

---

## 🎯 Overview

This patch release fixes a widespread issue where UI panels (Link Analysis, Batch Nodes, Viewshed Control, etc.) became unresponsive or non-resizable due to Leaflet capturing and blocking synthetic React events. By switching to capture-phase event listeners, all panels are fully interactive again.

---

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)  
**Previous Release**: [v1.16.0](https://github.com/d3mocide/MeshRF/releases/tag/v1.16.0)
