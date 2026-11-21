from difflib import unified_diff
from typing import Any


def compare(original: dict[str, Any], replay: dict[str, Any]) -> dict[str, Any]:
    original_text = original.get("response_text") or ""
    replay_text = replay.get("response_text") or ""
    original_usage = original.get("token_usage")
    replay_usage = replay.get("token_usage")
    usage_diff = None
    if original_usage is not None and replay_usage is not None:
        keys = sorted(set(original_usage) | set(replay_usage))
        usage_diff = {
            key: (replay_usage.get(key) or 0) - (original_usage.get(key) or 0)
            for key in keys
            if isinstance(original_usage.get(key) or 0, (int, float))
            and isinstance(replay_usage.get(key) or 0, (int, float))
        }

    original_status = original.get("status_code")
    replay_status = replay.get("status_code")
    original_ms = original.get("response_time_ms")
    replay_ms = replay.get("response_time_ms")
    delta_ms = round(replay_ms - original_ms, 2) if replay_ms is not None and original_ms is not None else None
    return {
        "original": original,
        "replay": replay,
        "identical": original_text == replay_text and original_status == replay_status,
        "text_changed": original_text != replay_text,
        "text_diff": list(
            unified_diff(
                original_text.splitlines(),
                replay_text.splitlines(),
                fromfile="original",
                tofile="replay",
                lineterm="",
            )
        ),
        "status_changed": original_status != replay_status,
        "status_code_diff": {
            "original": original_status,
            "replay": replay_status,
        },
        "response_time_delta_ms": delta_ms,
        "token_usage_diff": usage_diff,
    }
