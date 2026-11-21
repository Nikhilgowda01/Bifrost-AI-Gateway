from typing import Any

from fastapi import APIRouter, HTTPException

from models.schemas import ReplayPayload
from services import database_service as database
from services.comparison_service import compare
from services.replay_service import REQUEST_KEYS, execute, execute_demo

router = APIRouter(prefix="/api/requests", tags=["replay"])


async def _run(config: dict[str, Any], api_key: str | None) -> dict[str, Any]:
    return await execute_demo(config) if config["demo_mode"] else await execute(config, api_key)


@router.post("/{request_id}/replay")
async def replay_request(request_id: str, payload: ReplayPayload | None = None) -> dict[str, Any]:
    request = database.get_request(request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request record not found.")
    payload = payload or ReplayPayload()
    baseline = request["executions"][0]["config"]
    config = payload.config.model_dump() if payload.config else baseline.copy()
    is_modified = config != baseline
    key = payload.api_key or REQUEST_KEYS.get(request_id)
    execution = await _run(config, key)
    database.save_replay(request_id, config, execution, is_modified)
    return {
        "request_id": request_id,
        "execution": execution,
        "is_modified": is_modified,
        "comparison": compare(request["executions"][0], execution),
    }
