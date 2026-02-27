from fastapi import APIRouter
from pydantic import BaseModel, field_validator
from starlette.requests import Request
from starlette.responses import Response
from dependencies import tile_manager, limiter
import io
import numpy as np
from PIL import Image

router = APIRouter()

class ElevationRequest(BaseModel):
    lat: float
    lon: float

    @field_validator('lat')
    @classmethod
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('lon')
    @classmethod
    def validate_lon(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

@router.post("/get-elevation")
def get_elevation_endpoint(req: ElevationRequest):
    """
    Get elevation for a single point.
    """
    elevation = tile_manager.get_elevation(req.lat, req.lon)
    return {"elevation": elevation}


class BatchElevationRequest(BaseModel):
    locations: str  # Pipe-separated "lat,lng|lat,lng|..."
    dataset: str = "ned10m"

@router.post("/elevation-batch")
@limiter.limit("30/minute")
def get_batch_elevation(req: BatchElevationRequest, request: Request):
    """
    Batch elevation lookup for frontend path profiles.
    Used for optimized path profiles.
    """
    try:
        # Parse locations
        coords = []
        for loc in req.locations.split('|'):
            if not loc.strip(): continue
            parts = loc.split(',')
            if len(parts) == 2:
                lat, lng = map(float, parts)
                coords.append((lat, lng))

        # Fetch elevations in parallel
        elevs = tile_manager.get_elevations_batch(coords)

        results = []
        for i, (lat, lon) in enumerate(coords):
            results.append({
                "elevation": elevs[i],
                "location": {"lat": lat, "lng": lon}
            })

        return {
            "status": "OK",
            "results": results
        }
    except ValueError as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={"status": "INVALID_REQUEST", "error": str(e)}
        )
    except Exception as e:
        from fastapi.responses import JSONResponse
        import logging
        logging.getLogger(__name__).error(f"Internal error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"status": "SERVER_ERROR", "error": "Internal server error"}
        )

@router.get("/tiles/{z}/{x}/{y}.png")
def get_elevation_tile(z: int, x: int, y: int):
    """
    Serve elevation data as Terrain-RGB tiles.
    Format: height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
    """
    grid = tile_manager.get_interpolated_grid(x, y, z, size=256)

    # Encode to Terrain-RGB format
    # h = -10000 + (v * 0.1) => v = (h + 10000) * 10
    h_scaled = (grid + 10000) * 10
    h_scaled = np.clip(h_scaled, 0, 16777215) # Clip to 24-bit max
    h_scaled = h_scaled.astype(np.uint32)

    r = (h_scaled >> 16) & 0xFF
    g = (h_scaled >> 8) & 0xFF
    b = h_scaled & 0xFF

    rgb = np.stack((r, g, b), axis=-1).astype(np.uint8)

    img = Image.fromarray(rgb, mode='RGB')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")
