import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from models.schemas import ExecutePayload
from services import database_service as database
from services.replay_service import REQUEST_KEYS, execute, execute_demo

router = APIRouter(prefix="/api/requests", tags=["requests"])


def _config_from_payload(payload: ExecutePayload) -> dict[str, Any]:
    return payload.model_dump(exclude={"api_key"})


async def _run(config: dict[str, Any], api_key: str | None) -> dict[str, Any]:
    return await execute_demo(config) if config["demo_mode"] else await execute(config, api_key)


@router.post("/execute")
async def execute_request(payload: ExecutePayload) -> dict[str, Any]:
    config = _config_from_payload(payload)
    request_id = uuid.uuid4().hex
    execution = await _run(config, payload.api_key)
    database.save_initial(request_id, config, execution)
    if payload.api_key:
        REQUEST_KEYS[request_id] = payload.api_key
    return {"request_id": request_id, "execution": execution, "config": config}


@router.get("")
def list_requests() -> list[dict[str, Any]]:
    return database.list_requests()


@router.get("/{request_id}")
def get_request(request_id: str) -> dict[str, Any]:
    request = database.get_request(request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request record not found.")
    return request


@router.delete("/{request_id}")
def delete_request(request_id: str) -> dict[str, bool]:
    if not database.delete_request(request_id):
        raise HTTPException(status_code=404, detail="Request record not found.")
    REQUEST_KEYS.pop(request_id, None)
    return {"deleted": True}
