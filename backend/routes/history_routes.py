from fastapi import APIRouter, HTTPException

from services import database_service as database
from services.comparison_service import compare

router = APIRouter(prefix="/api/requests", tags=["history"])


@router.get("/{request_id}/compare")
def compare_request(request_id: str) -> dict:
    request = database.get_request(request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request record not found.")
    replay = next(
        (execution for execution in reversed(request["executions"]) if execution["execution_type"] == "replay"),
        None,
    )
    if replay is None:
        raise HTTPException(status_code=409, detail="Replay this request before comparing results.")
    original = request["executions"][0]
    return {
        "request_id": request_id,
        "is_modified": replay["is_modified"],
        "comparison": compare(original, replay),
    }
