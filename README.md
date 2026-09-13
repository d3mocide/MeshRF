# meshRF 📡 v1.17.0

A professional-grade RF propagation and link analysis tool designed for LoRa Mesh networks (Meshtastic, Reticulum, Sidewinder). Built with **React**, **Leaflet**, and a high-fidelity physics core combining a **Python Geodetic Engine** with **High-Performance WASM Modules**.

meshRF is designed for **mission-critical availability**. It operates with **zero external API dependencies** for elevation data, serving high-resolution terrain data directly from self-hosted containers. Map tiles are still fetched from external providers (CARTO and Esri); full offline basemap support is on the roadmap.

![Link Analysis Demo](./public/meshrf-preview-1.7.3.png)

## ✨ Core Pillars

### 1. 📡 High-Fidelity RF Analysis

- **Physics Authority**: All calculations use a dedicated Python backend or local WASM modules for maximum accuracy.
- **Advanced Models**:
  - **ITM (Longley-Rice)**: High-precision WASM physical modeling.
  - **Bullington**: Terrain-aware diffraction (Backend).
  - **Okumura-Hata / COST 231**: Empirical model for urban zones, covering 150-2000 MHz.
  - **Free Space**: Baseline physics comparison.
- **Model Selector**: Comparison tool to instantly switch between models for A/B testing.
- **Asymmetric Links**: Configure unique hardware (power, gain, height) for **Node A** and **Node B** independently.
- **Cable Loss Calculator**: Built-in engine to calculate real-world losses based on cable type and length.
- **Dynamic Fresnel visualization**: Real-time 2D profiles showing LOS and Fresnel zone clearance using backend-generated geometry.

### 2. 📍 Advanced Site Surveying

- **Multi-Site Management**: Dedicated manager for maintaining and comparing lists of candidate sites.
  - **Inter-Node Link Matrix**: Automatically analyse pairwise RF link quality (path loss, Fresnel clearance, Viable/Degraded/Blocked) between every selected site after a scan.
  - **Marginal Coverage**: Per-site unique coverage percentage highlights redundant placements before deployment.
  - **Mesh Topology**: BFS-based connectivity score, multi-hop relay detection, and all-pairs path table — see if your proposed network forms a true connected mesh.
  - **Link Visualisation**: Coloured polylines drawn on the map between every site pair (cyan = viable, gold = degraded, red = blocked).
- **Coverage Analysis**: Scan a radial area around your transmitter to identify optimal reception points based on LOS, Fresnel clearance, and signal strength.
- **RF Coverage Simulator**: Optimized Wasm-powered ITM propagation modeling for wide-area coverage visualization.
- **Viewshed Analysis**: Desktop-grade viewshed calculations with "Shadow Mode" visualization.
- **Environment Tuning**: Fine-tune simulations with **Ground Type** ($\epsilon$, $\sigma$) and **Climate Zone** parameters for regional accuracy. Supports Sea Water, City/Industrial, Farmland, and more.
- **Reliability Modes**: Select the ITM statistical confidence level — Best Case (10%), Typical (50%, default) or Reliable (90%) — to plan against median or worst-case conditions instead of a single fixed forecast.

### 3. ⚡ Batch Operations & reporting

- **Bulk Link Matrix**: Import CSVs (`Name, Lat, Lon`) to instantly compute link budgets for entire networks.
- **Per-Node Hardware**: Optional CSV columns (antenna height, gain, TX power, device, antenna) let individual sites override the global config for realistic mixed-device meshes.
- **Selectable Batch Model**: Run mesh reports with fast Bullington diffraction or full WASM ITM for terrain-accurate results that match Link Analysis.
- **Automated Reporting**: Export detailed CSV reports containing RSSI, Signal Margin, Clearance, path loss, and the per-node parameters used.
- **Context-Aware Guidance**: Every tool features built-in, interactive help banners that update based on your current mode, guiding you through workflows step-by-step.

### 4. 📚 Documentation

Detailed guides for specific tools:

- [📖 link-analyzer.md](./Documentation/link-analyzer.md) - Point-to-point link budgets & Fresnel zones.
- [📖 site-analyzer.md](./Documentation/site-analyzer.md) - **Site Finder** & **Multi-Site** tools.
- [📖 viewshed.md](./Documentation/viewshed.md) - Optical LOS analysis.
- [📖 rf-simulator.md](./Documentation/rf-simulator.md) - Coverage heatmap simulation.
- [📖 interactions.md](./Documentation/interactions.md) - Tool workflows and "Locate Me".
- [📖 batch-processing.md](./Documentation/batch-processing.md) - Bulk link analysis.
- [📖 hardware-settings.md](./Documentation/hardware-settings.md) - Node configuration.
- [📖 pwa-guide.md](./Documentation/pwa-guide.md) - Install on Desktop & Mobile.

### 5. 📱 Progressive Web App (PWA)

meshRF is fully installable on **Desktop (Chrome/Edge)** and **Mobile (iOS/Android)**.

- **Offline Shell**: Loads instantly even without a network connection.
- **Native Experience**: Runs in a standalone window without browser chrome.
- **Dark Mode**: Optimized startup with no white flashes.

---

## 📡 Propagation Models

meshRF supports multiple propagation models to suit different environments:

| Model                  | Best For          | Characteristics                                                                |
| :--------------------- | :---------------- | :----------------------------------------------------------------------------- |
| **Free Space (FSPL)**  | Ideal LOS, Orbit  | Baseline physics, no terrain or environment effects. Runs client-side.         |
| **Okumura-Hata**       | Flat/Suburban     | Empirical model for urban/suburban, 150-1500 MHz. Assumes flat terrain. Runs client-side. |
| **COST 231-Hata**      | 1.5-2 GHz ISM     | Hata extended to 1500-2000 MHz. Selected automatically above 1500 MHz.         |
| **Bullington**         | Terrain/Mesh      | Efficient terrain-aware diffraction. Fast & reliable for terrestrial links.    |
| **ITM (Longley-Rice)** | Irregular Terrain | **Gold Standard**. High-fidelity WASM-powered physical modeling. Ground-aware. |

> [!NOTE]
> FSPL and the Hata family are computed in the browser, so they remain available
> when the Python backend is unreachable (including offline/PWA use). Bullington
> and server-side ITM require the RF Engine.

> [!TIP]
> Use **ITM (Longley-Rice)** for mission-critical link analysis. It accounts for irregular terrain, diffraction, troposcatter, and specific ground/climate parameters. Use **Bullington** for rapid terrain-aware estimates.

---

## 🚀 Getting Started

### 🐳 Running with Docker (Recommended)

meshRF is fully containerized and easy to deploy:

1. **Clone and Run**:

   ```bash
   git clone https://github.com/d3mocide/meshrf.git
   cd meshrf
   docker compose up -d
   ```

   **For Developers (Hot-Reloading):**

   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

2. **Access the App**:
   - Frontend: `http://localhost` (Port 80)
   - RF Engine API: `http://localhost:5001/docs` (Swagger UI)

3. **Elevation Data**:
   By default, meshRF uses a local **OpenTopoData** instance. You must download elevation files (HGT/TIF) to the `./data/opentopodata` directory.
   👉 **[See Setup Guide](./OPENTOPO_GUIDE.md)** for data download instructions.

4. **Map Basemaps**:
   CARTO now requires an API key for its basemap tiles. See
   [Basemap API Key](#-basemap-api-key-carto) below — it takes about a minute
   and the free tier is generous.

### ⚙️ Configuration (Docker)

Copy `.env.example` to `.env` and edit it. Docker Compose picks it up
automatically for both the production and development stacks:

```bash
cp .env.example .env
```

| Variable            | Description                                                                                   | Default              |
| ------------------- | --------------------------------------------------------------------------------------------- | -------------------- |
| `CARTO_API_KEY`     | CARTO basemap key. Applied server-side, never exposed to the browser.                         | _(unset)_            |
| `MAP_LAT`           | Initial map center latitude                                                                   | `45.5152`            |
| `MAP_LNG`           | Initial map center longitude                                                                  | `-122.6784`          |
| `MAP_ZOOM`          | Initial zoom level (0-20)                                                                     | `13`                 |
| `DEFAULT_MAP_STYLE` | Initial map theme (`dark`, `dark_green`, `light`, `topo`, `topo_dark`, `satellite`)           | `dark_green`         |
| `DEFAULT_UNITS`     | Measurement system (`imperial` or `metric`)                                                   | `imperial`           |
| `ELEVATION_API_URL` | OpenTopoData endpoint used by the RF Engine                                                   | `http://opentopodata:5000` |
| `ELEVATION_DATASET` | Terrain dataset name, must exist in `data/opentopodata/config.yaml`                           | `ned10m`             |
| `REDIS_PASSWORD`    | Redis password. **Change this before exposing meshRF beyond localhost.**                      | `changeme`           |
| `ALLOWED_HOSTS`     | Dev server only: hostnames the Vite dev server accepts, or `true` for any                     | _(unset)_            |

> [!NOTE]
> The frontend settings are applied when the container **starts**, so changing
> them needs only `docker compose up -d` — no image rebuild. They are written
> into `env-config.js` at boot rather than compiled into the bundle, which is
> why a `VITE_`-prefixed variable in `docker-compose.yml` has no effect on the
> published image. `VITE_MAP_LAT` / `VITE_MAP_LNG` are still accepted as
> deprecated aliases for `MAP_LAT` / `MAP_LNG`.

### 🔑 Basemap API Key (CARTO)

As of August 2026 CARTO requires an API key for its raster basemaps. Without
one, the `dark`, `dark_green` and `light` styles still render but carry an
**"API KEY REQUIRED"** watermark.

1. Request a free key at **[carto.com/basemaps/apikey](https://carto.com/basemaps/apikey/)**
   — no account needed, and the free tier covers 5 million tile requests/month.
2. Add it to your `.env`:

   ```bash
   CARTO_API_KEY=your_key_here
   ```

3. `docker compose up -d`.

**The key is never sent to the browser.** meshRF requests tiles from its own
`/basemaps/...` path; Nginx (production) and the Vite dev server (development)
append the key as the request passes through to CARTO. It stays in the server
config, so it is absent from the JavaScript bundle, from `env-config.js`, and
from anything visible in devtools. Nginx also caches tiles locally, which keeps
repeat views off your monthly quota.

> [!IMPORTANT]
> Never rename this to `VITE_CARTO_API_KEY`. Vite inlines any `VITE_`-prefixed
> variable into the client bundle, which would publish your key to every
> visitor. The unprefixed name is what keeps it server-side.

> [!TIP]
> Prefer not to sign up at all? The `topo`, `topo_dark` and `satellite` styles
> are served by Esri and need no key. Set `DEFAULT_MAP_STYLE=topo_dark`.

CARTO's free tier requires that the OpenStreetMap and CARTO attribution stays
visible on the map. meshRF displays it by default — please leave it in place.

---

## 🏗️ Architecture

- **Frontend**: React + Leaflet + Vite.
- **Physics Core (WASM)**: High-speed, high-fidelity ITM implementation running directly in the browser for real-time coverage maps and link analysis.
- **RF Engine (Python)**: FastAPI service handling backend tasks, long-running simulations (Viewshed, Optimization), and providing traditional propagation models (Bullington, Hata).
- **RF Worker**: Celery-based background worker for long-running tasks like Viewshed Analysis and Site Optimization.
- **OpenTopoData**: Self-hosted elevation API providing geodetic data without external requests or rate limits.
- **Redis**: High-speed caching layer for terrain and analysis results.

## 📄 License

MIT License. Free to use and modify.

## ⚠️ Disclaimer

This tool is a simulation. Real-world RF propagation is affected by complex factors (interference, buildings, weather) not fully modeled here. Always verify with field testing.

**AI Disclosure**: Segments of this codebase were developed with the assistance of advanced AI coding agents. While all code has been reviewed and tested, users should exercise standard due diligence when deploying in critical environments.
