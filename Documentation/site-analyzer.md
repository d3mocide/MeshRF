# Site Analyzer Tools

The **Site Analyzer** suite is a professional-grade toolkit for identifying, evaluating, and managing potential network node locations. It combines automated RF coverage analysis with manual site management.

## 🛠️ Components

### 1. Coverage Analysis (Automated Radial Scan)

A powerful optimization engine that scans a radial area around a transmitter to find optimal reception spots based on signal strength, line-of-sight, and terrain features.

**Features:**

- **Radial Scan**: Scans a user-defined radius (1km - 20km) around your transmitter.
- **Heatmap Visualization**: Overlays a color-coded signal quality grid on the map.
- **Weighted Scoring**: Algorithms rank sites based on:
  - **Signal Strength**: RSSI and Link Budget.
  - **Line-of-Sight**: True Bresenham LOS + Fresnel Zone clearance.
  - **Prominence**: Local height advantages.
- **Visual Feedback**: Top candidates are marked with ranked "Best Signal" markers.
- **Terrain Profiles**: Interactive cross-section views for every candidate site.

### 2. Multi-Site Manager (Manual Mode)

A dedicated interface for managing a list of manual candidate sites, with a
results panel split across **Sites**, **Links** and **Topology** tabs.

**Features:**

- **Candidate List**: Add/Remove potential sites manually.
- **Comparison**: Toggle between different candidates to compare viewsheds.
- **Conversion**: Easily promote a candidate site to a permanent Network Node.
- **Per-Node Coverage Colors**: Each selected node's coverage renders in its own
  color rather than one flat composite mask, so overlapping sites are
  distinguishable at a glance. Markers and the Sites table are color-matched.
- **Marginal Coverage**: Each site reports the percentage of area only *it*
  covers, which surfaces redundant placements before you deploy them.
- **Inter-Node Link Matrix** (Links tab): After a scan, every site pair is
  analysed for path loss and Fresnel clearance and rated Viable, Degraded or
  Blocked. Coloured polylines are drawn on the map — cyan = viable,
  gold = degraded, red = blocked.
- **Mesh Topology** (Topology tab): A BFS-based connectivity score, multi-hop
  relay detection and an all-pairs path table, so you can tell whether your
  proposed sites actually form a connected mesh rather than isolated clusters.

## 🚀 How to Use

### Mode 1: Coverage Analysis (Auto)

1. Select **Site Analyzer** from the toolbar.
2. Ensure the **Coverage** tab is active.
3. **Set Transmitter**: Click the map to place your Center (TX) location.
4. **Set Radius**: Move your mouse to define the scan radius (or use the slider in Advanced Settings).
5. **Scan**: Click again to initiate the coverage analysis.
6. **Analyze Results**:
   - View the color-coded **Heatmap**.
   - Review the **Best Signal** candidates in the side panel.
   - Click "View Profile" on any candidate to see the terrain cross-section.

### Mode 2: Multi-Site Manager (Manual)

1. Switch to the **Multi-Site** tab in the panel.
2. **Add Site**: Click "Add" (or the map directly if prompted) to place a candidate marker.
3. **Manage**:
   - Click a site in the list to fly to it.
   - Toggle visibility of its viewshed.
   - Convert a candidate to a permanent Network Node.

## 📊 Optimization Weights

- **Elevation**: Prioritizes raw height above sea level.
- **Prominence**: Prioritizes local peaks and ridgelines.
- **Fresnel**: Prioritizes clear line-of-sight and Fresnel zone clearance.

> [!TIP]
> Use **Coverage Analysis** to discover the best reception areas, then switch to **Multi-Site Manager** to fine-tune specific locations.

> [!NOTE]  
> "Ghost Nodes" (Best Signal markers) are temporary. To save a location, convert it to a node or add it to your Multi-Site list.
