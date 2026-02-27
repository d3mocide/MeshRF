import msgpack
import redis

class CacheLayer:
    """
    Handles Redis caching operations for elevation tiles.
    """
    def __init__(self, redis_client: redis.Redis, ttl: int = 30 * 24 * 60 * 60):
        self.redis = redis_client
        self.ttl = ttl

    def get_tile(self, key: str):
        """Retrieves a tile from Redis cache."""
        packed = self.redis.get(key)
        if packed:
            return msgpack.unpackb(packed)
        return None

    def cache_tile(self, key: str, data: dict):
        """Stores a tile in Redis cache with TTL."""
        packed = msgpack.packb(data)
        self.redis.setex(key, self.ttl, packed)
