from typing import Optional

from pydantic import BaseModel, Field


class RequestConfig(BaseModel):
    base_url: str = Field(default="http://localhost:8080", min_length=1, max_length=2048)
    endpoint: str = Field(default="/v1/chat/completions", min_length=1, max_length=2048)
    model: str = Field(default="openai/gpt-4o-mini", min_length=1, max_length=256)
    system_prompt: str = Field(default="You are a helpful assistant.", max_length=20000)
    user_prompt: str = Field(default="Explain what an AI gateway does in one sentence.", max_length=50000)
    temperature: float = Field(default=0.2, ge=0, le=2)
    max_tokens: int = Field(default=512, gt=0, le=200000)
    demo_mode: bool = False


class ExecutePayload(RequestConfig):
    api_key: Optional[str] = Field(default=None, max_length=4096)


class ReplayPayload(BaseModel):
    config: Optional[RequestConfig] = None
    api_key: Optional[str] = Field(default=None, max_length=4096)
