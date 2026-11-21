import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit

import httpx

from services.request_service import response_text, token_usage

HTTP_TIMEOUT = float(os.environ.get("BIFROST_REQUEST_TIMEOUT_SECONDS", "30"))
REQUEST_KEYS: dict[str, str] = {}


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_target(config: dict[str, Any]) -> str:
    base_url = config["base_url"].strip().rstrip("/")
    endpoint = config["endpoint"].strip()
    parsed = urlsplit(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Gateway base URL must be a valid http:// or https:// URL.")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("Gateway base URL must not contain credentials, query parameters, or fragments.")
    return f"{base_url}/{endpoint.lstrip('/')}"


def _error_for_status(status_code: int, body: Any) -> str | None:
    if 200 <= status_code < 300:
        return None
    messages = {
        400: "The gateway rejected the request. Check the model and request format.",
        401: "Authentication failed. Check the gateway virtual key or API key.",
        403: "The gateway denied this request. Check the key's permissions.",
        404: "The configured endpoint was not found. Check the gateway URL and endpoint path.",
        429: "The gateway rate limit was reached. Try again after the limit resets.",
    }
    if status_code in messages:
        return messages[status_code]
    if status_code >= 500:
        return "The gateway or upstream provider returned a server error."
    detail = body.get("error", {}).get("message") if isinstance(body, dict) else None
    return str(detail)[:500] if detail else f"Gateway returned HTTP {status_code}."


async def execute(config: dict[str, Any], api_key: str | None) -> dict[str, Any]:
    execution_id = uuid.uuid4().hex
    started = time.perf_counter()
    response: Any = None
    response_body = ""
    response_code = None
    error = None
    try:
        target_url = _validate_target(config)
        payload = {
            "model": config["model"],
            "messages": [
                {"role": "system", "content": config["system_prompt"]},
                {"role": "user", "content": config["user_prompt"]},
            ],
            "temperature": config["temperature"],
            "max_tokens": config["max_tokens"],
        }
        headers = {"Content-Type": "application/json"}
        effective_key = api_key or os.environ.get("BIFROST_API_KEY")
        if effective_key:
            headers["Authorization"] = f"Bearer {effective_key}"
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            result = await client.post(target_url, json=payload, headers=headers)
        response_code = result.status_code
        response_body = result.text
        try:
            response = result.json()
        except ValueError:
            response = {"raw": response_body[:20000]} if response_body else None
        error = _error_for_status(response_code, response)
    except ValueError as exc:
        error = str(exc)
    except httpx.TimeoutException:
        error = f"Request timed out after {HTTP_TIMEOUT:g} seconds. Check gateway availability and timeout settings."
    except httpx.ConnectError:
        error = "Could not connect to the gateway. Check that the URL is correct and the gateway is running."
    except httpx.RequestError as exc:
        error = f"Gateway request failed: {type(exc).__name__}."

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    content = response_text(response)
    if not content and response_body:
        content = response_body[:20000]
    return {
        "id": execution_id,
        "status_code": response_code,
        "response_time_ms": elapsed_ms,
        "response": response,
        "response_text": content,
        "token_usage": token_usage(response),
        "error": error,
        "success": error is None and response_code is not None and 200 <= response_code < 300,
        "demo_mode": False,
        "created_at": _timestamp(),
    }


async def execute_demo(config: dict[str, Any]) -> dict[str, Any]:
    # Demo timings are fixed and explicitly marked simulated in stored records.
    prompt = config["user_prompt"].strip()
    text = f"Demo response: {prompt[:220]}"
    prompt_tokens = max(1, len((config["system_prompt"] + " " + prompt).split()))
    completion_tokens = max(1, len(text.split()))
    response = {
        "id": f"chatcmpl-demo-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "model": config["model"],
        "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        },
        "demo": True,
    }
    return {
        "id": uuid.uuid4().hex,
        "status_code": 200,
        "response_time_ms": 42.0,
        "response": response,
        "response_text": text,
        "token_usage": response["usage"],
        "error": None,
        "success": True,
        "demo_mode": True,
        "created_at": _timestamp(),
    }
