from worker import celery_app
import os
import redis
from celery.utils.log import get_task_logger
from tile_manager import TileManager
from core.viewshed_proc import process_batch_viewshed

logger = get_task_logger(__name__)

# Re-init redis/tile_manager here for worker context
REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "changeme")

pool = redis.ConnectionPool(
    host=REDIS_HOST, 
    port=6379, 
    db=0, 
    password=REDIS_PASSWORD,
    max_connections=50
)
redis_client = redis.Redis(connection_pool=pool)
tile_manager = TileManager(redis_client)

@celery_app.task(bind=True)
def calculate_batch_viewshed(self, params):
    """
    Calculate viewsheds for a list of nodes.
    params: { "nodes": [ {lat, lon, height, ...} ], "options": {"radius": 5000, "optimize_n": 3} }
    """
    logger.info(f"Starting batch viewshed for {len(params.get('nodes', []))} nodes")
    self.update_state(state='PROGRESS', meta={'progress': 0, 'message': 'Initializing...'})
    
    nodes_data = params.get('nodes', [])
    options = params.get('options', {})

    def update_state(state, meta):
        self.update_state(state=state, meta=meta)

    return process_batch_viewshed(
        nodes_data,
        options,
        tile_manager,
        update_state_callback=update_state
    )
