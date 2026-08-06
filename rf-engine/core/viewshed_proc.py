import colorsys
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from core.algorithms import calculate_viewshed
import rf_physics
import logging

logger = logging.getLogger(__name__)


def _project_to_master(res, min_lat, max_lat, min_lon, max_lon, rows, cols):
    """
    Map a node's local viewshed pixels into master-grid (row, col) indices.
    Shared by every step that needs to place a node's coverage onto the
    common composite grid (greedy selection, marginal coverage, final render).
    """
    g = res['grid']
    lats = res['grid_lats']
    lons = res['grid_lons']

    rows_idx, cols_idx = np.nonzero(g > 0)
    if len(rows_idx) == 0:
        return np.array([], dtype=int), np.array([], dtype=int)

    pixel_lats = lats[rows_idx]
    pixel_lons = lons[cols_idx]

    y_vals = ((max_lat - pixel_lats) / (max_lat - min_lat) * (rows - 1)).astype(int)
    x_vals = ((pixel_lons - min_lon) / (max_lon - min_lon) * (cols - 1)).astype(int)

    valid_mask = (y_vals >= 0) & (y_vals < rows) & (x_vals >= 0) & (x_vals < cols)
    return y_vals[valid_mask], x_vals[valid_mask]


def _node_color(index, total):
    """Evenly-spaced distinct hue per node index, as a #rrggbb hex string."""
    hue = (index / max(1, total)) % 1.0
    r, g, b = colorsys.hls_to_rgb(hue, 0.55, 0.85)
    return f"#{int(r * 255):02x}{int(g * 255):02x}{int(b * 255):02x}"


def process_batch_viewshed(nodes_data, options, tile_manager, update_state_callback=None):
    """
    Core processing logic for batch viewshed calculation.
    Separated from Celery task for testability and clean architecture.
    """
    logger.info(f"Processing batch viewshed for {len(nodes_data)} nodes")

    radius = float(options.get('radius', 5000))
    optimize_n = options.get('optimize_n')
    rx_height = float(options.get('rx_height', 2.0))
    freq = float(options.get('frequency_mhz', 915.0))

    # 1. Determine Bounding Box for Composite
    if not nodes_data:
        return {"status": "completed", "results": []}

    # Calculate center latitude for projection scaling
    lats = [float(n['lat']) for n in nodes_data]
    lons = [float(n['lon']) for n in nodes_data]
    mean_lat = sum(lats) / len(lats)

    # Degrees per meter
    lat_deg_per_m = 1.0 / 111320.0
    lon_deg_per_m = 1.0 / (111320.0 * max(0.001, np.cos(np.radians(mean_lat))))

    # Buffer: radius + 1km safety margin
    buffer_m = radius + 1000
    buffer_lat = buffer_m * lat_deg_per_m
    buffer_lon = buffer_m * lon_deg_per_m

    min_lat = min(lats) - buffer_lat
    max_lat = max(lats) + buffer_lat
    min_lon = min(lons) - buffer_lon
    max_lon = max(lons) + buffer_lon

    # Define Global Master Grid
    target_res_m = 100.0

    rows = int((max_lat - min_lat) / (target_res_m * lat_deg_per_m))
    cols = int((max_lon - min_lon) / (target_res_m * lon_deg_per_m))

    MAX_DIM = 4096

    if rows > MAX_DIM or cols > MAX_DIM:
        scale_factor = max(rows / MAX_DIM, cols / MAX_DIM)
        res_m = target_res_m * scale_factor

        rows = int((max_lat - min_lat) / (res_m * lat_deg_per_m))
        cols = int((max_lon - min_lon) / (res_m * lon_deg_per_m))

        logger.warning(f"Viewshed grid too large. Scaling resolution from {target_res_m}m to {res_m:.1f}m. Grid: {rows}x{cols}")
    else:
        res_m = target_res_m

    # Pre-calculate individual viewsheds
    all_node_results = []
    total = len(nodes_data)

    for i, node_data in enumerate(nodes_data):
        try:
            lat = float(node_data.get('lat'))
            lon = float(node_data.get('lon'))
            height = float(node_data.get('height', 10))

            grid, grid_lats, grid_lons = calculate_viewshed(
                tile_manager, lat, lon, height, radius,
                rx_h=rx_height, freq_mhz=freq, resolution_m=res_m
            )

            coverage_count = int(np.sum(grid))
            source_elev = tile_manager.get_elevation(lat, lon)

            node_res = {
                "lat": lat, "lon": lon,
                "name": node_data.get('name', f'Site {i + 1}'),
                "height": height,
                "elevation": round(float(source_elev), 1),
                "coverage_area_km2": round((coverage_count * (res_m * res_m)) / 1_000_000.0, 2),
                "grid": grid,
                "grid_lats": grid_lats,
                "grid_lons": grid_lons
            }
            all_node_results.append(node_res)

            if update_state_callback:
                progress = int((i + 1) / total * 50)
                update_state_callback('PROGRESS', {'progress': progress, 'message': f'Analyzed candidates {i+1}/{total}'})

        except Exception as e:
            logger.error(f"Error processing node {i}: {e}")

    # 2. Greedy Optimization (Marginal Gain)
    selected_results = all_node_results
    if optimize_n and 0 < optimize_n < len(all_node_results):
        selected_results = []
        covered_points = set()

        # Pre-compute pixel sets for all candidates
        candidate_sets = []
        for res in all_node_results:
            y_vals, x_vals = _project_to_master(res, min_lat, max_lat, min_lon, max_lon, rows, cols)
            pixels = set(zip(y_vals.tolist(), x_vals.tolist()))
            candidate_sets.append(pixels)

        # Greedy Loop
        remaining_indices = list(range(len(all_node_results)))

        for _ in range(optimize_n):
            best_idx = -1
            best_marginal_gain = -1

            for idx in remaining_indices:
                cand_pixels = candidate_sets[idx]
                new_coverage = len(cand_pixels.difference(covered_points))

                if new_coverage > best_marginal_gain:
                    best_marginal_gain = new_coverage
                    best_idx = idx

            if best_idx != -1 and best_marginal_gain > 0:
                selected_results.append(all_node_results[best_idx])
                covered_points.update(candidate_sets[best_idx])
                remaining_indices.remove(best_idx)
            else:
                break

    # 3. Compute marginal coverage for each selected node
    covered_so_far = set()
    for res in selected_results:
        y_vals, x_vals = _project_to_master(res, min_lat, max_lat, min_lon, max_lon, rows, cols)
        node_pixels = set(zip(y_vals.tolist(), x_vals.tolist()))
        marginal_pixels = len(node_pixels - covered_so_far)
        covered_so_far.update(node_pixels)
        res['marginal_coverage_km2'] = round((marginal_pixels * (res_m * res_m)) / 1_000_000.0, 2)

    total_unique_km2 = round((len(covered_so_far) * (res_m * res_m)) / 1_000_000.0, 2)
    for res in selected_results:
        total_cov = res['coverage_area_km2']
        res['unique_coverage_pct'] = round(
            (res['marginal_coverage_km2'] / total_cov * 100) if total_cov > 0 else 0.0, 1
        )

    # 3a. Compute pairwise inter-node link quality
    if update_state_callback:
        update_state_callback('PROGRESS', {'progress': 55, 'message': 'Analyzing inter-node links...'})

    inter_node_links = []
    n_selected = len(selected_results)
    for i in range(n_selected):
        for j in range(i + 1, n_selected):
            node_a = selected_results[i]
            node_b = selected_results[j]
            try:
                dist_m = rf_physics.haversine_distance(
                    node_a['lat'], node_a['lon'],
                    node_b['lat'], node_b['lon']
                )
                elevs = tile_manager.get_elevation_profile(
                    node_a['lat'], node_a['lon'],
                    node_b['lat'], node_b['lon'],
                    samples=50
                )
                h_a = node_a.get('height', 10.0)
                h_b = node_b.get('height', 10.0)
                link_result = rf_physics.analyze_link(
                    elevs, dist_m, freq, h_a, h_b,
                    k_factor=options.get('k_factor', 1.333),
                    clutter_height=options.get('clutter_height', 0.0)
                )
                path_loss_db = rf_physics.calculate_path_loss(
                    dist_m, elevs, freq, h_a, h_b,
                    model='bullington',
                    k_factor=options.get('k_factor', 1.333),
                    clutter_height=options.get('clutter_height', 0.0)
                )
                inter_node_links.append({
                    "node_a_idx": i,
                    "node_b_idx": j,
                    "node_a_name": node_a.get('name', f'Site {i + 1}'),
                    "node_b_name": node_b.get('name', f'Site {j + 1}'),
                    "dist_km": round(dist_m / 1000, 2),
                    "status": link_result['status'],
                    "path_loss_db": round(float(path_loss_db), 1),
                    "min_clearance_ratio": round(float(link_result['min_clearance_ratio']), 2)
                })
            except Exception as e:
                logger.error(f"Link analysis failed for nodes {i}-{j}: {e}")
                inter_node_links.append({
                    "node_a_idx": i,
                    "node_b_idx": j,
                    "node_a_name": selected_results[i].get('name', f'Site {i + 1}'),
                    "node_b_name": selected_results[j].get('name', f'Site {j + 1}'),
                    "dist_km": 0,
                    "status": "unknown",
                    "path_loss_db": 0,
                    "min_clearance_ratio": 0
                })

    # 4. Render per-node coverage as distinct-colored layers, alpha-composited
    # onto a shared canvas. Overlapping nodes blend naturally; each node keeps
    # its own assigned color where it's the sole (or last-drawn) coverage.
    opacity = 150
    canvas = Image.new('RGBA', (cols, rows), (0, 0, 0, 0))

    for idx, res in enumerate(selected_results):
        color_hex = _node_color(idx, len(selected_results))
        res['color'] = color_hex

        y_vals, x_vals = _project_to_master(res, min_lat, max_lat, min_lon, max_lon, rows, cols)
        if len(y_vals) == 0:
            continue

        r = int(color_hex[1:3], 16)
        g = int(color_hex[3:5], 16)
        b = int(color_hex[5:7], 16)

        layer = np.zeros((rows, cols, 4), dtype=np.uint8)
        layer[y_vals, x_vals] = [r, g, b, opacity]
        canvas = Image.alpha_composite(canvas, Image.fromarray(layer, mode='RGBA'))

    buffered = BytesIO()
    canvas.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    # 5. Build Final Output
    final_results = []
    for idx, res in enumerate(selected_results):
        final_results.append({
            "lat": res["lat"],
            "lon": res["lon"],
            "name": res.get("name", f"Site {idx + 1}"),
            "elevation": res["elevation"],
            "color": res["color"],
            "coverage_area_km2": res["coverage_area_km2"],
            "marginal_coverage_km2": res.get("marginal_coverage_km2", res["coverage_area_km2"]),
            "unique_coverage_pct": res.get("unique_coverage_pct", 100.0)
        })

    # Compute connectivity score
    connectivity = [0] * len(final_results)
    for link in inter_node_links:
        if link["status"] in ("viable", "degraded"):
            connectivity[link["node_a_idx"]] += 1
            connectivity[link["node_b_idx"]] += 1
    for idx, res in enumerate(final_results):
        res["connectivity_score"] = connectivity[idx]

    return {
        "status": "completed",
        "results": final_results,
        "inter_node_links": inter_node_links,
        "total_unique_coverage_km2": total_unique_km2,
        "composite": {
            "image": img_str,
            "bounds": {
                "north": max_lat,
                "south": min_lat,
                "east": max_lon,
                "west": min_lon
            }
        }
    }
