# Tool Interactions

MeshRF is most powerful when its tools are used in combination. This guide explains how to transition between tools to build a comprehensive network plan.

## The Optimization Workflow

A typical planning cycle often looks like this:

1. **Site Analysis**: Start by scanning a wide area to find the highest potential site.
2. **Viewshed**: Place an observer on the #1 ranked spot to verify visual coverage of your target area.
3. **RF Simulator**: Switch to the simulator to see how signal strength behaves with realistic hardware settings from that same spot.
4. **Link Analyzer**: Finally, draw a point-to-point link between your new site and an existing node to verify the backbone connection.

## Navigation & Controls

### 📍 Locate Me

Use the target icon (⌖) in the bottom-right corner to instantly fly the map to your physical location. This is especially useful for setting up "on-the-ground" site surveys or checking coverage at your current position.

## Common Interplays

### Viewshed vs. RF Simulator

- **Viewshed** is "all or nothing"—either you have LOS or you don't.
- **RF Simulator** shows the "fuzzy" edge of connectivity where trees or grazing terrain might degrade signal but not block it completely.

### Link Analyzer + Parameters

Changing the **Transmitter Height** in the Global Parameters sidebar will instantly update:

- The Fresnel clearance in **Link Analyzer**.
- The coverage radius in **RF Simulator**.
- The visibility in **Viewshed**.

## Tips for Success

- Use the **Topo Map** style when running **Site Analysis** to better understand the land features being analyzed.
- Always verify high-margin links with a terrain-aware model (**Bullington** or **ITM**) before finalizing a site. The Hata family assumes flat terrain.
