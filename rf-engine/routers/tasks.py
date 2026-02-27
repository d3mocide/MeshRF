from fastapi import APIRouter
from pydantic import BaseModel, field_validator
from typing import Optional
from starlette.requests import Request
from dependencies import limiter
from models import NodeConfig
from worker import celery_app
from sse_starlette.sse import EventSourceResponse
from celery.result import AsyncResult
import json
import asyncio

router = APIRouter()

class ScanRequest(BaseModel):
    nodes: list[NodeConfig]
    radius: float = 5000.0
    optimize_n: Optional[int] = None
    frequency_mhz: float = 915.0
    rx_height: float = 2.0
    k_factor: float = 1.333
    clutter_height: float = 0.0

    @field_validator('radius')
    @classmethod
    def validate_radius(cls, v):
        if not 100 <= v <= 50000:
            raise ValueError('Radius must be between 100 and 50000 meters')
        return v

@router.post("/scan/start")
@limiter.limit("5/minute")
def start_scan_endpoint(req: ScanRequest, request: Request):
    """
    Start asynchronous batch viewshed scan (Celery).
    """
    from tasks.viewshed import calculate_batch_viewshed

    if not req.nodes:
        return {"status": "error", "message": "No nodes provided"}

    # Start Celery Task
    task = calculate_batch_viewshed.delay({
        "nodes": [n.model_dump() for n in req.nodes], # Convert Pydantic models to dicts
        "options": {
            "radius": req.radius,
            "optimize_n": req.optimize_n,
            "frequency_mhz": req.frequency_mhz,
            "rx_height": req.rx_height,
            "k_factor": req.k_factor,
            "clutter_height": req.clutter_height
        }
    })

    return {"status": "started", "task_id": task.id}


@router.get("/task_status/{task_id}")
async def task_status_endpoint(task_id: str):
    """
    SSE Endpoint for Task Progress.
    """
    async def event_generator():
        task = AsyncResult(task_id, app=celery_app)
        max_polls = 600  # 5 minutes at 0.5s
        polls = 0
        while polls < max_polls:
            polls += 1
            if task.state == 'PENDING':
                yield json.dumps({"event": "progress", "data": {"progress": 0}})
            elif task.state == 'PROGRESS':
                meta = task.info or {}
                yield json.dumps({"event": "progress", "data": meta})
            elif task.state == 'SUCCESS':
                yield json.dumps({"event": "complete", "data": task.result})
                return
            elif task.state == 'FAILURE':
                yield json.dumps({"event": "error", "data": str(task.info)})
                return

            await asyncio.sleep(0.5)
        yield json.dumps({"event": "error", "data": "Task timed out after 5 minutes"})

    return EventSourceResponse(event_generator())
