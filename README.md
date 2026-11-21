# Bifrost Request Replay

A lightweight developer workflow for recording OpenAI-compatible AI gateway calls, replaying a saved configuration, and comparing the resulting outputs. This is an independent tool: it does not replace or claim to implement Bifrost's existing caching, request logging, or observability features.

## What it does

- Sends chat-completions requests to a configurable Bifrost or compatible gateway.
- Records request configuration, response payload, HTTP status, latency, timestamps, and returned token usage in local SQLite.
- Keeps API keys out of request records. A key entered in the builder is held only in backend process memory for replay; after a backend restart, enter it again or configure `BIFROST_API_KEY`.
- Replays the original request or an edited configuration and marks whether the replay was modified.
- Compares actual response text, HTTP status, response-time delta, and token-usage deltas without an AI-generated interpretation.
- Separates measured live-gateway metrics from explicitly simulated demo metrics.

## Architecture

```text
React + Vite dashboard (5173)
          │ HTTP JSON
FastAPI + HTTPX (8000)
          ├── configured OpenAI-compatible gateway
          └── SQLite (backend/bifrost_replay.db)
```

### Technology

- Frontend: React, Vite, Tailwind CSS, Lucide React, Recharts
- Backend: Python, FastAPI, Pydantic, HTTPX, Uvicorn
- Persistence: SQLite

## Project layout

```text
frontend/src/components/   Shared dashboard, request, response and comparison UI
frontend/src/pages/        Dashboard, request builder/replay and history screens
frontend/src/services/     Backend API client
backend/routes/            Request, replay and comparison endpoints
backend/services/          SQLite, execution and comparison logic
backend/models/            API payload validation
```

## Requirements

- Python 3.10+ (the code uses standard-library and Pydantic 2 features)
- Node.js 18+
- A Bifrost gateway for live calls; optional for the simulated demo

## Run on Windows

1. In a terminal at the project root, start the backend:

   ```bat
   start_backend.bat
   ```

   The first launch creates `backend\.venv`, installs Python dependencies, and initializes SQLite automatically. API docs are at `http://localhost:8000/docs`.

2. In a second terminal, start the frontend:

   ```bat
   start_frontend.bat
   ```

   Open `http://localhost:5173`.

Manual setup:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

`start_backend.bat` uses the default SQLite location and does not need an environment file. To set a default gateway key, set `BIFROST_API_KEY` in the backend process environment before launching it. Frontend overrides belong in `frontend/.env` (copy `frontend/.env.example`); do not put credentials in any `VITE_*` setting.

## Configure Bifrost

The request builder defaults to `http://localhost:8080` and `/v1/chat/completions`. Bifrost's official documentation describes the OpenAI-compatible chat-completions endpoint and an OpenAI integration base path at `/openai`; select the matching endpoint style for your gateway setup. The endpoint and base URL are independently editable, including deployments served under a path prefix.

For example:

| Gateway setup | Base URL | Endpoint |
|---|---|---|
| Bifrost quickstart HTTP API | `http://localhost:8080` | `/v1/chat/completions` |
| OpenAI SDK-compatible path | `http://localhost:8080` | `/openai/chat/completions` |
| Custom/proxied path | Your gateway URL | Your configured chat-completions path |

Bifrost uses the OpenAI chat-completions JSON format. When supplied, the key is sent to the configured endpoint as `Authorization: Bearer <key>`. For local gateway credentials, type the virtual key in the builder. Alternatively, set `BIFROST_API_KEY` in the backend process environment. Never put secrets in `VITE_*` variables: Vite values are public to the browser. The key field is sent only to this backend, excluded from persisted configuration, and not printed by application logs.

To try the application without a gateway, leave **Simulated demo mode** on. Simulated responses and their fixed illustrative timings/token counts are labeled and stored separately from live executions. Turn it off to make a real network call.

## API

FastAPI's interactive documentation is served at `/docs`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health |
| POST | `/api/requests/execute` | Execute and record an original request |
| POST | `/api/requests/{request_id}/replay` | Replay original or supplied edited config |
| GET | `/api/requests` | List recordings and latest execution summaries |
| GET | `/api/requests/{request_id}` | Get saved configuration and all executions |
| GET | `/api/requests/{request_id}/compare` | Compare first execution with latest replay |
| DELETE | `/api/requests/{request_id}` | Delete a recording and its executions |
| GET | `/api/analytics` | Separate live and simulated metrics |

`POST /api/requests/execute` accepts `base_url`, `endpoint`, `model`, `api_key`, `system_prompt`, `user_prompt`, `temperature`, `max_tokens`, and `demo_mode`. Replays accept an optional `config` (the same fields except `api_key`) and an optional `api_key`. Request/response content is stored locally; avoid sending sensitive prompts unless local storage is appropriate for them.

## Demo workflow

1. Open the request builder; demo mode is enabled by default.
2. Execute & record the sample request.
3. Open its record from history and press Replay request.
4. Change the prompt or model and choose Replay changes to record a modified replay.
5. Inspect text diff, status, latency and token deltas in the comparison panel.

Demo response text is deterministic for the given prompt. Its 42 ms illustrative latency and whitespace-based token counts are simulated, not measured provider performance.

## Limitations

- This MVP supports non-streaming OpenAI-compatible chat completions, not every Bifrost protocol or provider-specific feature.
- API keys entered in the UI survive only in backend process memory. After restarting the backend, supply the key again or use server-side `BIFROST_API_KEY`.
- The app is designed for local development. CORS allows the local Vite origin only; production deployment needs deliberate auth, TLS, access control, and secret management.
- SQLite stores request/response payloads locally without encryption or automatic retention cleanup.
- A request's comparison is between its first execution and most recent replay. Request history records the executions individually.
- Metrics are local to this replay tool and are not Bifrost's own observability or cache metrics.

## Official Bifrost references

- [Gateway setup and quickstart](https://docs.getbifrost.ai/quickstart/gateway/setting-up)
- [OpenAI integration](https://docs.getbifrost.ai/integrations/openai-sdk/overview)
- [Drop-in replacement](https://docs.getbifrost.ai/features/drop-in-replacement)
