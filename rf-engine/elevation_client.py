import os
import requests
import numpy as np
import logging
import mercantile
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from requests.adapters import HTTPAdapter

logger = logging.getLogger(__name__)

class ElevationClient:
    """
    Handles interactions with OpenTopoData API for elevation tiles.
    """
    def __init__(self, max_workers=30):
        # Connection pooling for high concurrency
        self.session = requests.Session()
        adapter = HTTPAdapter(pool_connections=50, pool_maxsize=50)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

        self.executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix='elev_client_')

        self.base_url = os.environ.get('ELEVATION_API_URL', 'http://opentopodata:5000')
        self.dataset = os.environ.get('ELEVATION_DATASET', 'srtm30m')

    def fetch_tile(self, x, y, z):
        """
        Fetch elevation data from OpenTopoData API.
        """
        bounds = mercantile.bounds(x, y, z)
        lat_min, lat_max = bounds.south, bounds.north
        lon_min, lon_max = bounds.west, bounds.east

        # Create 16x16 grid of coordinates
        lats = np.linspace(lat_min, lat_max, 16)
        lons = np.linspace(lon_min, lon_max, 16)

        lat_grid, lon_grid = np.meshgrid(lats, lons)
        lat_flat = lat_grid.flatten()
        lon_flat = lon_grid.flatten()

        # OpenTopoData supports up to 100 locations per request
        # We have 256 points (16x16), so split into 3 batches: 100, 100, 56
        batch_size = 100

        batches = []
        for i in range(0, len(lat_flat), batch_size):
            batch_lats = lat_flat[i:i + batch_size]
            batch_lons = lon_flat[i:i + batch_size]
            locations = "|".join([f"{lat},{lon}" for lat, lon in zip(batch_lats, batch_lons)])
            batches.append(locations)

        def fetch_batch_task(locations, batch_num):
            try:
                url = f"{self.base_url}/v1/{self.dataset}"
                response = self.session.get(
                    url,
                    params={'locations': locations},
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'OK' and 'results' in data:
                        return [result.get('elevation', 0.0) for result in data['results']]
                    else:
                        error_msg = data.get('error', 'Unknown error')
                        logger.error(f"OpenTopoData batch {batch_num} error: {error_msg}")
                        return None
                elif response.status_code == 404:
                    logger.error(f"Dataset '{self.dataset}' not found. Check ELEVATION_DATASET env var and data files.")
                    return None
                else:
                    logger.warning(f"OpenTopoData batch {batch_num} failed with status {response.status_code}")
                    return None

            except requests.exceptions.Timeout:
                logger.error(f"OpenTopoData request timed out for batch {batch_num}")
                return None
            except requests.exceptions.ConnectionError:
                logger.error(f"Cannot connect to OpenTopoData at {self.base_url}. Is the container running?")
                return None
            except Exception as e:
                logger.error(f"Exception fetching OpenTopoData batch {batch_num}: {e}")
                return None

        # Execute batches in parallel
        futures = [self.executor.submit(fetch_batch_task, locs, i) for i, locs in enumerate(batches)]

        all_elevations = []
        for future in futures:
            try:
                batch_result = future.result(timeout=30)
            except (TimeoutError, Exception) as e:
                logger.error(f"Tile fetch timed out or failed: {e}")
                return None
            if batch_result is None:
                return None
            all_elevations.extend(batch_result)

        if len(all_elevations) == 256:
            logger.info(f"Successfully fetched elevation data from OpenTopoData ({self.dataset}): min={min(all_elevations):.1f}m, max={max(all_elevations):.1f}m")
            return {"elevation": all_elevations}
        else:
            logger.error(f"Expected 256 elevation points, got {len(all_elevations)}")
            return None

    def shutdown(self):
        self.executor.shutdown(wait=False)
        self.session.close()
