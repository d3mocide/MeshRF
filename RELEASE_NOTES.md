# MeshRF v1.17.0 - Propagation Model Expansion

**Release Date**: August 6, 2026
**Type**: Minor Release (New Features)
**Focus**: Rounding out the propagation model roadmap -- per-node coverage visualization, client-side Hata/FSPL, COST 231, WASM ITM batch reports, per-node CSV configs, and selectable ITM reliability modes.

---

## 🎯 Overview

This release closes out several roadmap items (P6-1, P3-1, P3-3, P3-4, P4-2, P4-6):

- **Per-Node Coverage Visualization**: Multi-Site Analysis now renders each node's coverage in a distinct color instead of one flat composite mask.
- **Client-Side Hata & FSPL**: The Link Analysis tool resolves `fspl` and `hata` locally in the browser, so both work fully offline/PWA with no backend round-trip.
- **COST 231-Hata Extension**: Hata coverage now spans 150-2000 MHz (previously capped at 1500 MHz).
- **WASM ITM for Batch Reports**: Batch Processing can run the same Longley-Rice WASM engine used by Link Analysis over a 100-point terrain profile.
- **Per-Node Configs in Batch CSV**: CSV import accepts optional per-node antenna height, gain, TX power, device and antenna columns.
- **Reliability (Variability) Modes**: ITM's time/location/situation variability is now user-selectable (Best Case / Typical / Reliable) instead of hardcoded to 50/50/50. Requires a `libmeshrf` WASM rebuild, included in this release.

Also includes a new CI workflow (frontend + rf-engine tests on every push/PR), a lint config fix that surfaced ~100 previously-masked warnings (all now resolved), and dependency audit fixes.

See [CHANGELOG.md](CHANGELOG.md) for the full list of changes.

---

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)
**Previous Release**: [v1.16.1](https://github.com/d3mocide/MeshRF/releases/tag/v1.16.1)
