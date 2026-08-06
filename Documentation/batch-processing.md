# Batch Processing

The **Batch Processing** tool allows users to analyze multiple sites and links simultaneously by importing a list of coordinates. It is ideal for planning large-scale mesh networks or evaluating many potential "Ideal Spots" at once.

## Batch Processing UI

![Batch Processing Interface](assets/batch-processing.png)

## 1. Importing Nodes

You can import nodes via a CSV file. The tool supports a simple format: `Name, Latitude, Longitude`.

### CSV Format Requirements

The first line can be a header or data. The tool uses a heuristic to identify columns:

- **Format A**: `Site Name, Latitude, Longitude`
- **Format B**: `Latitude, Longitude, Site Name`

> [!TIP]
> Use the **"Download Template"** link in the sidebar to get a perfectly formatted CSV file.

### Per-Node Hardware Overrides

When your CSV has a header row, you can add optional columns to give individual
nodes their own hardware instead of applying the global A/B configuration to
every site. Any column you leave out — or leave blank on a given row — falls
back to the global config, so existing three-column files keep working unchanged.

| Column | Aliases | Meaning |
| --- | --- | --- |
| `Antenna_Height` | `Height`, `AGL` | Antenna height above ground, in meters |
| `Antenna_Gain` | `Gain` | Antenna gain in dBi |
| `TX_Power` | `Power` | Transmit power in dBm |
| `Device` | — | Device preset, e.g. `HELTEC_V3`, `RAK_4631`, `Station G2` |
| `Antenna` | `Antenna_Type` | Antenna preset, e.g. `YAGI`, `OMNI_HIGH`, `Standard Dipole` |

Preset names are matched loosely — `HELTEC_V3`, `heltec-v3` and `Heltec V3` all
resolve to the same device. Selecting an `Antenna` preset supplies its nominal
gain automatically; an explicit `Antenna_Gain` on the same row wins.

```csv
Name,Lat,Lon,Antenna_Height,Antenna_Gain,TX_Power,Device,Antenna
Site Alpha,45.5152,-122.6784,30,8,22,HELTEC_V3,OMNI_HIGH
Site Bravo,45.5252,-122.6684,12,,,,DIPOLE
Site Delta,45.5100,-122.6500,,,,,
```

Above, Alpha is fully specified, Bravo overrides only its height and antenna
(taking 3.0 dBi from the dipole preset), and Delta inherits everything from the
global config. The sidebar shows how many loaded nodes carry an override.

## 2. Integration with Link Analyzer

The Batch Nodes panel provides a seamless transition into detailed point-to-point analysis:

- **TX Button**: Sets the selected node as the "Source" (Station A) in the Link Analyzer.
- **RX Button**: Sets the selected node as the "Target" (Station B) in the Link Analyzer.

By using these buttons, you can quickly verify a link's profile and Fresnel clearance for any node in your batch list without manual map placement.

> [!IMPORTANT]
> Selecting a different tool from the toolbar (e.g., switching from Link Analysis to Viewshed) will clear the current analysis markers and results from the map. However, your **Batch Nodes** will remain visible until you click **"Clear All Nodes"**.

## 3. Choosing a Propagation Model

Once more than one node is loaded, a **Propagation Model** selector appears above
the export button:

- **Bullington (Fast)** — Free-space path loss plus knife-edge diffraction,
  computed over a 20-point terrain profile per link. This is the default and is
  well suited to sweeping a large candidate list quickly.
- **Longley-Rice ITM (Accurate, Slower)** — The same WASM ITM engine the Link
  Analysis tool uses, run over a denser 100-point profile and using your
  **Ground Type**, **Climate Zone** and **Reliability** settings. Batch numbers
  then agree with what you see when you open the same link in the Link Analyzer.

> [!TIP]
> The **Reliability** setting in the Environment sidebar applies here too. Running
> a mesh report at *Reliable (90%)* tells you which links survive poor conditions,
> not just which ones work on a median day. The `Model` column records the mode
> used for each row (e.g. `ITM 90/90/90`), so reports run at different confidence
> levels stay distinguishable after export.

The ITM engine is loaded on demand the first time you select it; the export
button stays disabled for the moment it takes to initialize. If ITM fails on an
individual link, that link falls back to Bullington rather than failing the
whole report — the `Model` column records which model actually produced each row.

## 4. Exporting Mesh Reports

The most powerful feature of Batch Processing is the **"Export Mesh Report"** button.

### What it does:

1. It iterates through every possible pair of nodes in your imported list.
2. It performs a terrain profile analysis for every link (Source to Target).
3. It calculates the Link Budget from each node's own configuration, falling
   back to your global **Hardware Settings** where no override is given.
4. It generates a CSV report containing:
   - **Distance**: In kilometers.
   - **Status**: GOOD, MARGINAL, or OBSTRUCTED.
   - **Quality**: Fresnel-based link quality rating.
   - **Clearance**: Minimum Fresnel zone clearance in meters.
   - **Margin**: Signal margin in dB.
   - **Model**: Which propagation model produced the row (`ITM` or `Bullington`).
   - **PathLoss_dB**: Total path loss used for the budget.
   - **Per-node params**: TX/RX antenna height, TX/RX gain, and TX power, so the
     report is self-documenting when nodes differ.

A progress bar tracks completion while the report runs.

> [!WARNING]
> Processing many links (e.g., 20+ nodes result in 190+ links) can take several minutes as the tool fetches terrain data for each path. The ITM model is noticeably slower than Bullington, since it fetches a 5x denser terrain profile per link.

## Workflow Example

1. **Import** a list of existing nodes and potential new sites.
2. **Visualize** the nodes on the map to see geographic distribution.
3. **Select** a potential site as RX and an existing node as TX to check a specific link.
4. **Export** the full report to identify which new sites have the best connectivity to the existing mesh.
