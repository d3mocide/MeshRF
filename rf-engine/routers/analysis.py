from fastapi import APIRouter
from pydantic import BaseModel, field_validator
import rf_physics
from dependencies import tile_manager

router = APIRouter()

class LinkRequest(BaseModel):
    tx_lat: float
    tx_lon: float
    rx_lat: float
    rx_lon: float
    frequency_mhz: float
    tx_height: float
    rx_height: float
    model: str = "bullington" # bullington, fspl, hata, cost231, itm
    environment: str = "suburban"
    k_factor: float = 1.333
    clutter_height: float = 0.0

    @field_validator('tx_lat', 'rx_lat')
    @classmethod
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('tx_lon', 'rx_lon')
    @classmethod
    def validate_lon(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

@router.post("/calculate-link")
def calculate_link_endpoint(req: LinkRequest):
    """
    Synchronous endpoint for real-time link analysis.
    Uses cached TileManager to fetch elevation profile.
    """
    # Calculate distance between points
    dist_m = rf_physics.haversine_distance(
        req.tx_lat, req.tx_lon,
        req.rx_lat, req.rx_lon
    )

    # Get elevation profile along path
    elevs = tile_manager.get_elevation_profile(
        req.tx_lat, req.tx_lon,
        req.rx_lat, req.rx_lon,
        samples=100 # Increased samples for ITM accuracy
    )

    # Calculate Path Loss (ITM or FSPL)
    # Calculate Path Loss (Generic Dispatcher)
    path_loss_db = rf_physics.calculate_path_loss(
        dist_m,
        elevs,
        req.frequency_mhz,
        req.tx_height,
        req.rx_height,
        model=req.model,
        environment=req.environment,
        k_factor=req.k_factor,
        clutter_height=req.clutter_height
    )

    # Analyze link with correct signature
    result = rf_physics.analyze_link(
        elevs,
        dist_m,
        req.frequency_mhz,
        req.tx_height,
        req.rx_height,
        k_factor=req.k_factor,
        clutter_height=req.clutter_height
    )

    result['path_loss_db'] = float(path_loss_db)
    result['model_used'] = req.model

    return result
