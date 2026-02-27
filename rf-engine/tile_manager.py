import mercantile
import numpy as np
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from collections import OrderedDict

from cache_layer import CacheLayer
from elevation_client import ElevationClient
from grid_processor import GridProcessor

logger = logging.getLogger(__name__)

class TileManager:
    def __init__(self, redis_client):
        self.zoom = 12  # Standard zoom level for 30m resolution approx
        
        # New Components
        self.cache_layer = CacheLayer(redis_client)
        self.elevation_client = ElevationClient() # manages its own executor
        
        # Executor for parallel tile retrieval (Cache/API coordination)
        self.tile_executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix='tile_mgr_')
        
        # Request coalescing to prevent thundering herd (LRU-capped to prevent unbounded growth)
        self.tile_locks = OrderedDict()
        self._max_locks = 1000
        self.global_lock = threading.Lock()

    def get_tile_data(self, lat=None, lon=None, tile_x=None, tile_y=None, zoom=None):
        """
        Returns the raw data (elevation grid) for the tile.
        """
        if tile_x is None:
            if lat is None or lon is None:
                raise ValueError("Must provide either lat/lon or tile coordinates")
            tile = mercantile.tile(lon, lat, self.zoom)
            tile_x, tile_y, zoom = tile.x, tile.y, self.zoom
        
        zoom = zoom if zoom is not None else self.zoom
        tile_key = f"tile:{zoom}:{tile_x}:{tile_y}"
        
        # 1. Fast check cache
        data = self.cache_layer.get_tile(tile_key)
        if data:
            return data
            
        # 2. Cache miss - use lock to prevent redundant fetches
        with self.global_lock:
            if tile_key not in self.tile_locks:
                if len(self.tile_locks) >= self._max_locks:
                    self.tile_locks.popitem(last=False)  # Remove oldest
                self.tile_locks[tile_key] = threading.Lock()
            else:
                self.tile_locks.move_to_end(tile_key)  # Mark as recently used
            lock = self.tile_locks[tile_key]
            
        with lock:
            # Double check cache inside lock
            data = self.cache_layer.get_tile(tile_key)
            if data:
                return data
                
            logger.info(f"Cache miss for tile {tile_key}. Fetching from API.")
            data = self.elevation_client.fetch_tile(tile_x, tile_y, zoom)
            if data:
                self.cache_layer.cache_tile(tile_key, data)
        
        return data
    
    def shutdown(self):
        """Shutdown thread pools gracefully."""
        self.tile_executor.shutdown(wait=False)
        self.elevation_client.shutdown()
    
    def __del__(self):
        try:
            self.shutdown()
        except Exception:
            pass

    def get_elevation(self, lat, lon):
        """
        Get elevation for a specific coordinate. 
        Transparently handles caching and fetching tiles.
        """
        # logger.info(f"Getting elevation for lat={lat}, lon={lon}")
        tile = mercantile.tile(lon, lat, self.zoom)
        # logger.info(f"Tile coordinates: x={tile.x}, y={tile.y}, z={self.zoom}")
        data = self.get_tile_data(lat=lat, lon=lon)
        
        if data:
            # logger.info(f"Got tile data")
            result = GridProcessor.extract_elevation_from_tile(data, lat, lon, tile)
            # logger.info(f"Extracted elevation: {result}")
            return result
        logger.warning("No tile data returned!")
        return 0.0

    def get_elevation_profile(self, lat1, lon1, lat2, lon2, samples=50):
        """
        Get elevation profile along a path between two points (Batch optimized).
        """
        lats = np.linspace(lat1, lat2, samples)
        lons = np.linspace(lon1, lon2, samples)
        coords = list(zip(lats, lons))
        
        return self.get_elevations_batch(coords)

    def get_interpolated_grid(self, x, y, z, size=256):
        """
        Returns a (size, size) numpy array of elevation data for the tile.
        """
        data = self.get_tile_data(tile_x=x, tile_y=y, zoom=z)
        return GridProcessor.get_interpolated_grid(data, size)

    def get_elevations_batch(self, coords):
        """
        Efficiently get elevations for a list of (lat, lon) coordinates.
        Groups by tile and fetches required tiles in parallel.
        """
        # 1. Group coordinates by tile
        tile_to_coords = {}
        for lat, lon in coords:
            tile = mercantile.tile(lon, lat, self.zoom)
            tile_key = (tile.x, tile.y, self.zoom)
            if tile_key not in tile_to_coords:
                tile_to_coords[tile_key] = []
            tile_to_coords[tile_key].append((lat, lon))
            
        # 2. Fetch all unique tiles in parallel
        unique_tiles = list(tile_to_coords.keys())
        tile_data_map = {}
        
        def fetch_single_tile(tx, ty, tz):
            data = self.get_tile_data(tile_x=tx, tile_y=ty, zoom=tz)
            return (tx, ty, tz), data

        futures = [self.tile_executor.submit(fetch_single_tile, tx, ty, tz) for tx, ty, tz in unique_tiles]
        
        for future in futures:
            try:
                key, data = future.result(timeout=30)
            except (TimeoutError, Exception) as e:
                logger.error(f"Tile fetch timed out or failed: {e}")
                continue
            tile_data_map[key] = data
            
        # 3. Extract elevations
        results = []
        for lat, lon in coords:
            tile = mercantile.tile(lon, lat, self.zoom)
            tile_key = (tile.x, tile.y, self.zoom)
            data = tile_data_map.get(tile_key)
            
            if data:
                # Need mercantile Tile object for extraction logic
                elev = GridProcessor.extract_elevation_from_tile(data, lat, lon, tile)
                results.append(elev)
            else:
                results.append(0.0)
                
        return results
