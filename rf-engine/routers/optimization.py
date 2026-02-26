from fastapi import APIRouter
from pydantic import BaseModel, field_validator
from typing import Optional, List
from starlette.requests import Request
from starlette.responses import Response
from dependencies import tile_manager, optimization_service, limiter
import rf_physics

router = APIRouter()

class OptimizeRequest(BaseModel):
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    frequency_mhz: float
    tx_height: float
    rx_height: float = 2.0
    k_factor: float = 1.333
    clutter_height: float = 0.0
    return_heatmap: bool = False
    weights: dict = {"elevation": 0.5, "prominence": 0.3, "fresnel": 0.2}
    existing_nodes: list = [] # List of {lat, lon, height}

    @field_validator('min_lat', 'max_lat')
    @classmethod
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('min_lon', 'max_lon')
    @classmethod
    def validate_lon(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

@router.post("/optimize-location")
@limiter.limit("10/minute")
def optimize_location_endpoint(req: OptimizeRequest, request: Request):
    """
    Find best location using multi-criteria analysis (elevation, prominence, fresnel).
    """
    try:
        # Adaptive Grid
        # Calculate dimensions in km
        dist_lat_km = rf_physics.haversine_distance(req.min_lat, req.min_lon, req.max_lat, req.min_lon) / 1000.0
        dist_lon_km = rf_physics.haversine_distance(req.min_lat, req.min_lon, req.min_lat, req.max_lon) / 1000.0

        # Target resolution: 150m (0.15 km)
        target_res_km = 0.15

        steps_lat = int(dist_lat_km / target_res_km)
        steps_lon = int(dist_lon_km / target_res_km)

        # Safety Caps (Min 10, Max 50 -> 2500 points max)
        steps_lat = max(10, min(50, steps_lat))
        steps_lon = max(10, min(50, steps_lon))

        lat_step = (req.max_lat - req.min_lat) / steps_lat
        lon_step = (req.max_lon - req.min_lon) / steps_lon

        coords = []
        for i in range(steps_lat + 1):
            for j in range(steps_lon + 1):
                lat = req.min_lat + (i * lat_step)
                lon = req.min_lon + (j * lon_step)
                coords.append((lat, lon))

        # Batch fetch elevations
        elevs = tile_manager.get_elevations_batch(coords)

        candidates = []
        for i, (lat, lon) in enumerate(coords):
            # Basic Candidate
            cand = {
                "lat": lat,
                "lon": lon,
                "elevation": elevs[i]
            }
            # Score Components
            metrics = optimization_service.score_candidate(
                cand,
                req.weights,
                req.existing_nodes,
                tx_height=req.tx_height,
                rx_height=req.rx_height,
                freq_mhz=req.frequency_mhz,
                k_factor=req.k_factor,
                clutter_height=req.clutter_height
            )
            cand.update(metrics) # Adds prominence, fresnel
            candidates.append(cand)

        # Normalize and Calculate Final Score
        if not candidates:
             return {"status": "success", "locations": []}

        max_elev = max([c['elevation'] for c in candidates]) or 1.0
        max_prom = max([c['prominence'] for c in candidates]) or 1.0
        # Fresnel is already 0-1

        w_elev = req.weights.get("elevation", 0.3)
        w_prom = req.weights.get("prominence", 0.4)
        w_fres = req.weights.get("fresnel", 0.3)

        for c in candidates:
            norm_elev = c['elevation'] / max_elev if max_elev > 0 else 0
            norm_prom = c['prominence'] / max_prom if max_prom > 0 else 0

            c['score'] = (norm_elev * w_elev) + (norm_prom * w_prom) + (c['fresnel'] * w_fres)
            # Scale to 0-100 for display
            c['score'] = round(c['score'] * 100, 1)

        # Sort by Score desc
        candidates.sort(key=lambda x: x["score"], reverse=True)

        # Take top 5 for "Ghost Nodes"
        top_results = candidates[:5]

        response = {
            "status": "success",
            "locations": top_results,
            "metadata": {
                "max_elevation": max_elev,
                "max_prominence": max_prom
            }
        }

        if req.return_heatmap:
            # Send simplified data for heatmap (lat, lon, score)
            # To save bandwidth, maybe round lat/lon?
            heatmap_data = [
                {"lat": round(c['lat'], 5), "lon": round(c['lon'], 5), "score": c['score']}
                for c in candidates
            ]
            response["heatmap"] = heatmap_data

        return response
    except Exception as e:
        print(f"Optimize Error: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Server Error: {str(e)}"}
        )

class ExportRequest(BaseModel):
    locations: list
    format: str = "csv" # csv, kml

@router.post("/export-results")
def export_results_endpoint(req: ExportRequest):
    """
    Generate export file for site candidates.
    """
    from api.export import generate_csv, generate_kml

    if req.format == "kml":
        content = generate_kml(req.locations)
        media_type = "application/vnd.google-earth.kml+xml"
        filename = "rf_scan_results.kml"
    else:
        content = generate_csv(req.locations)
        media_type = "text/csv"
        filename = "rf_scan_results.csv"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
