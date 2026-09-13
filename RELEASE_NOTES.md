# MeshRF v1.17.1 - Map Config & Basemap Key Patch

**Release Date**: September 13, 2026
**Type**: Patch Release (Bug Fixes)
**Focus**: Fixing the map center configuration variables, restoring CARTO basemap tiles now that CARTO requires an API key, and realigning `.env.example`, `README.md` and `Documentation/` with the current codebase.

---

## 🎯 Overview

This patch release fixes three configuration bugs reported against the deployed image, plus a broad documentation cleanup:

- **Map Center Fix** ([#23](https://github.com/d3mocide/MeshRF/issues/23)): `MAP_LAT` / `MAP_LNG` / `MAP_ZOOM` now actually move the initial map view. Two faults were stacked — the variables were unused in the source, and the `VITE_`-prefixed names used previously are inlined by Vite at *build* time, so setting them in `docker-compose.yml` could never reach the prebuilt image regardless. `VITE_MAP_LAT` / `VITE_MAP_LNG` still work as deprecated aliases.
- **CARTO Basemap API Key**: CARTO now requires a key for its raster basemaps or tiles render with an "API KEY REQUIRED" watermark. `CARTO_API_KEY` is applied **server-side only** — Nginx (production) or the Vite dev/preview server (development) appends it to proxied tile requests, so it is never present in the JS bundle or visible in devtools. Get a free key at [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey/).
- **`.env.example` Realigned**: previously documented only two elevation variables; now covers every setting the stack actually reads, and Compose substitutes from it so one `.env` drives both the production and development stacks.
- **Documentation Audit**: `README.md`'s version and configuration table were out of date, `Documentation/README.md` linked a guide that never existed, and several tool guides predated features already shipped in 1.17.0. See [CHANGELOG.md](CHANGELOG.md) for the full list.

See [CHANGELOG.md](CHANGELOG.md) for the full list of changes.

---

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)
**Previous Release**: [v1.17.0](https://github.com/d3mocide/MeshRF/releases/tag/v1.17.0)
