from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.history_routes import router as history_router
from routes.replay_routes import router as replay_router
from routes.request_routes import router as request_router
from services.database_service import analytics, initialize_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_db()
    yield


app = FastAPI(
    title="Bifrost Request Replay",
    description="Record, replay, and compare OpenAI-compatible AI gateway requests.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(request_router)
app.include_router(replay_router)
app.include_router(history_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "bifrost-request-replay"}


@app.get("/api/analytics")
def get_analytics() -> dict:
    return analytics()
