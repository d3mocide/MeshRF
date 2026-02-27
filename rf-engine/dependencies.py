import os
import redis
from tile_manager import TileManager
from optimization_service import OptimizationService
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "changeme")

# Initialize Redis Client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=0,
    password=REDIS_PASSWORD
)

# Initialize Core Services
tile_manager = TileManager(redis_client)
optimization_service = OptimizationService(tile_manager)
