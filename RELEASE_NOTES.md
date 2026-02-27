# MeshRF v1.16.0 - Major Refactoring & Modularization

**Release Date**: February 26, 2026  
**Type**: Minor Release (Architecture Update)  
**Focus**: Codebase restructuring, modularization, and maintainability improvements.

---

## 🎯 Overview

This release focuses entirely on **structural architecture and technical debt reduction**. The codebase has undergone a major refactor to decompose monolithic files, separate concerns, and establish a cleaner foundation for future feature development. All existing functionality has been preserved and verified against automated test suites.

---

## 🏗️ Refactoring Highlights

### Frontend Architecture

- **Component Decomposition**: Massive components like `MapContainer.jsx` and `Sidebar.jsx` have been broken down into specialized layers (`LinkLayerManager`, `CoverageLayerManager`) and sections (`HardwareSection`, `EnvironmentSection`).
- **State Management**: Implemented Facade pattern for React Context (`RFContext.jsx` wrapping isolated domains).
- **RF Math Modularization**: Split the monolithic `rfMath.js` into isolated mathematics modules (`fspl.js`, `bullington.js`, `earth.js`, etc.) located in `src/utils/math/`.
- **Worker & Data Hooks**: Standardized Web Worker interactions via `useWorkerState.js` and extracted map tile fetching to `tileFetcher.js`.

### Backend API Structure

- **API Routing**: `server.py` has been decomposed into dedicated FastAPI routers (`routers/analysis.py`, `routers/elevation.py`, etc.).
- **Tile Manager Extraction**: Separated `tile_manager.py` logic into `cache_layer.py`, `elevation_client.py`, and `grid_processor.py`.

---

## 📊 Impact & Stability

- **Components Extracted/Created**: 25+
- **Lines of Code Relocated**: ~4,000+
- **Test Status**: All backend (`pytest`) and frontend (`vitest`) test suites are passing.
- **Docker Containers**: Rebuilt and stable.

---

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)  
**Previous Release**: [v1.15.5](https://github.com/d3mocide/MeshRF/releases/tag/v1.15.5)
