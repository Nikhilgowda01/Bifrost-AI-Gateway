from typing import Any


def response_text(response: Any) -> str:
    if isinstance(response, dict):
        choices = response.get("choices")
        if isinstance(choices, list) and choices:
            message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
            content = message.get("content")
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                return "\n".join(
                    part.get("text", "") for part in content if isinstance(part, dict)
                )
    return ""


def token_usage(response: Any) -> dict[str, int] | None:
    if not isinstance(response, dict) or not isinstance(response.get("usage"), dict):
        return None
    return {
        key: value
        for key, value in response["usage"].items()
        if isinstance(value, int) and not isinstance(value, bool)
    }
