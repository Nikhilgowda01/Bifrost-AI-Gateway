import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "bifrost_replay.db"


def _connect() -> sqlite3.Connection:
    db_path = Path(os.environ.get("BIFROST_REPLAY_DB", str(DEFAULT_DB_PATH)))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def initialize_db() -> None:
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS requests (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                model TEXT NOT NULL,
                base_url TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                demo_mode INTEGER NOT NULL DEFAULT 0,
                replay_count INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS executions (
                id TEXT PRIMARY KEY,
                request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
                execution_type TEXT NOT NULL,
                is_modified INTEGER NOT NULL DEFAULT 0,
                config_json TEXT NOT NULL,
                status_code INTEGER,
                response_time_ms REAL,
                response_json TEXT,
                response_text TEXT,
                token_usage_json TEXT,
                error TEXT,
                success INTEGER NOT NULL,
                demo_mode INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_executions_request_created
                ON executions(request_id, created_at);
            """
        )


def save_initial(request_id: str, config: dict[str, Any], execution: dict[str, Any]) -> None:
    created_at = _now()
    with _connect() as connection:
        connection.execute(
            """INSERT INTO requests (id, created_at, model, base_url, endpoint, demo_mode)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                request_id,
                created_at,
                config["model"],
                config["base_url"],
                config["endpoint"],
                int(config["demo_mode"]),
            ),
        )
        _insert_execution(connection, request_id, "original", False, config, execution)


def save_replay(
    request_id: str, config: dict[str, Any], execution: dict[str, Any], is_modified: bool
) -> None:
    with _connect() as connection:
        _insert_execution(connection, request_id, "replay", is_modified, config, execution)
        connection.execute(
            "UPDATE requests SET replay_count = replay_count + 1 WHERE id = ?", (request_id,)
        )


def _insert_execution(
    connection: sqlite3.Connection,
    request_id: str,
    execution_type: str,
    is_modified: bool,
    config: dict[str, Any],
    execution: dict[str, Any],
) -> None:
    connection.execute(
        """INSERT INTO executions
           (id, request_id, execution_type, is_modified, config_json, status_code,
            response_time_ms, response_json, response_text, token_usage_json, error,
            success, demo_mode, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            execution["id"],
            request_id,
            execution_type,
            int(is_modified),
            json.dumps(config),
            execution["status_code"],
            execution["response_time_ms"],
            json.dumps(execution["response"]) if execution["response"] is not None else None,
            execution["response_text"],
            json.dumps(execution["token_usage"]) if execution["token_usage"] is not None else None,
            execution["error"],
            int(execution["success"]),
            int(config["demo_mode"]),
            execution["created_at"],
        ),
    )


def _execution_row(row: sqlite3.Row) -> dict[str, Any]:
    result = dict(row)
    result["config"] = json.loads(result.pop("config_json"))
    response_json = result.pop("response_json")
    result["response"] = json.loads(response_json) if response_json else None
    usage_json = result.pop("token_usage_json")
    result["token_usage"] = json.loads(usage_json) if usage_json else None
    result["success"] = bool(result["success"])
    result["is_modified"] = bool(result["is_modified"])
    result["demo_mode"] = bool(result["demo_mode"])
    return result


def get_request(request_id: str) -> dict[str, Any] | None:
    with _connect() as connection:
        row = connection.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
        if row is None:
            return None
        request = dict(row)
        request["demo_mode"] = bool(request["demo_mode"])
        executions = connection.execute(
            "SELECT * FROM executions WHERE request_id = ? ORDER BY created_at, rowid",
            (request_id,),
        ).fetchall()
    request["executions"] = [_execution_row(execution) for execution in executions]
    return request


def list_requests() -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT r.*,
                   e.id AS last_execution_id,
                   e.status_code AS last_status_code,
                   e.response_time_ms AS last_response_time_ms,
                   e.success AS last_success,
                   e.created_at AS last_executed_at
            FROM requests r
            LEFT JOIN executions e ON e.id = (
                SELECT id FROM executions
                WHERE request_id = r.id
                ORDER BY created_at DESC, rowid DESC LIMIT 1
            )
            ORDER BY r.created_at DESC
            """
        ).fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["demo_mode"] = bool(item["demo_mode"])
        item["last_success"] = bool(item["last_success"]) if item["last_success"] is not None else None
        result.append(item)
    return result


def delete_request(request_id: str) -> bool:
    with _connect() as connection:
        cursor = connection.execute("DELETE FROM requests WHERE id = ?", (request_id,))
        return cursor.rowcount > 0


def analytics() -> dict[str, Any]:
    with _connect() as connection:
        request_rows = connection.execute(
            "SELECT demo_mode, COUNT(*) AS count FROM requests GROUP BY demo_mode"
        ).fetchall()
        execution_rows = connection.execute(
            """SELECT demo_mode, execution_type, success, response_time_ms
               FROM executions ORDER BY created_at"""
        ).fetchall()
        chart_rows = connection.execute(
            """SELECT e.request_id, e.execution_type, e.success, e.response_time_ms,
                      e.demo_mode, e.created_at
               FROM executions e ORDER BY e.created_at DESC LIMIT 30"""
        ).fetchall()

    segments: dict[str, dict[str, Any]] = {
        "live": {"total_requests": 0, "total_replays": 0, "successful": 0,
                 "failed": 0, "avg_response_time_ms": None, "execution_count": 0},
        "simulated": {"total_requests": 0, "total_replays": 0, "successful": 0,
                      "failed": 0, "avg_response_time_ms": None, "execution_count": 0},
    }
    for row in request_rows:
        segments["simulated" if row["demo_mode"] else "live"]["total_requests"] = row["count"]

    times: dict[str, list[float]] = {"live": [], "simulated": []}
    for row in execution_rows:
        segment = segments["simulated" if row["demo_mode"] else "live"]
        segment["execution_count"] += 1
        if row["execution_type"] == "replay":
            segment["total_replays"] += 1
        segment["successful" if row["success"] else "failed"] += 1
        if row["response_time_ms"] is not None:
            times["simulated" if row["demo_mode"] else "live"].append(row["response_time_ms"])
    for name in segments:
        if times[name]:
            segments[name]["avg_response_time_ms"] = round(sum(times[name]) / len(times[name]), 2)

    chart = []
    for row in reversed(chart_rows):
        chart.append(
            {
                "request_id": row["request_id"],
                "execution_type": row["execution_type"],
                "success": bool(row["success"]),
                "response_time_ms": row["response_time_ms"],
                "demo_mode": bool(row["demo_mode"]),
                "created_at": row["created_at"],
            }
        )
    return {"live": segments["live"], "simulated": segments["simulated"], "executions": chart}
