# VIT Sports Intelligence Network

## Overview
A sports prediction API built with FastAPI that uses a multi-model ML ensemble to generate match outcome probabilities (1X2, Over/Under, BTTS).

## Architecture

### API Server
- **Framework**: FastAPI + Uvicorn
- **Port**: 5000
- **Run command**: `uvicorn main:app --host 0.0.0.0 --port 5000`

### Database
- **Type**: PostgreSQL (Replit-managed, via `DATABASE_URL` env var pointing to `helium`)
- **ORM**: SQLAlchemy async with asyncpg driver
- **Tables**: `matches`, `predictions`, `clv_entries`, `edges`, `model_performances`

### ML Orchestrator
- **Location**: `services/ml_service/models/model_orchestrator.py`
- **Models**: 12 total, 7 currently active (those with `certified=True`)
  - Active: poisson, xgboost, monte_carlo, ensemble, causal, sentiment, anomaly
  - Excluded (not certified): lstm, transformer, gnn, bayesian
  - Skipped (missing PyTorch): rl_agent
- **Fallback**: `_hybrid_fallback()` uses market-implied probabilities when all models fail; `_default_fallback()` for equal-probability fallback

## Key Files
- `main.py` — FastAPI app entry point, lifespan startup, route registration
- `app/api/routes/predict.py` — POST `/predict` endpoint
- `app/db/database.py` — Async SQLAlchemy engine setup
- `app/db/models.py` — ORM table definitions
- `services/ml_service/models/` — All 12 ML model implementations + orchestrator

## API Endpoints
- `POST /predict` — Generate match prediction (requires `X-API-Key` header)
- `POST /results/{match_id}` — Submit actual match result
- `GET /history` — Retrieve prediction history
- `GET /health` — Health check
- `GET /system/status` — System status

## Environment
- `DATABASE_URL` — Set by Replit to PostgreSQL on `helium`
- `API_KEY` — `dev_api_key_12345` (from `.env`)
- `ODDS_API_KEY` — Set via Replit secrets
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — For bet alerts

## Installed Packages
Core: fastapi, uvicorn, sqlalchemy, asyncpg, aiosqlite, python-dotenv
ML: numpy, scipy, pandas, scikit-learn, xgboost
HTTP: httpx, beautifulsoup4, tenacity

<<<<<<< HEAD
## Frontend
- **Location**: `frontend/` — React + Vite app
- **Built output**: `frontend/dist/` (served as static files by FastAPI at `/`)
- **Build command**: `cd frontend && npm install && npm run build`
- **Dev proxy**: Vite dev server at port 5173 proxies all API calls to port 5000

## CLV Tracking
- When a prediction has a positive edge (`has_edge=True`), `CLVTracker.record_entry()` is called immediately after saving the prediction to create a `clv_entries` row with the entry odds.
- When a result is submitted via `POST /results/{match_id}`, `CLVTracker.update_closing()` fills in closing odds and calculates final CLV.

## Alembic Migrations
- `alembic/env.py` — automatically translates async URL to sync URL for both SQLite and PostgreSQL
- `alembic/versions/001_initial_schema.py` — SQLite-compatible (no PostgreSQL ENUMs, uses `CURRENT_TIMESTAMP`)
- App auto-creates tables at startup via `Base.metadata.create_all` — Alembic is optional for development

=======
>>>>>>> 4d5f14d533612f7d8fd7782bc57596cd95018ffe
## Notes
- PyTorch, PyMC, optuna, transformers, sentence-transformers, econml are NOT installed (heavy dependencies). Models requiring these are gracefully skipped at startup.
- The models directory `/models/*.pkl` contains pre-trained model weights for: anomaly, ensemble, monte_carlo, poisson
- Models path is resolved relative to the project root, not hardcoded
<<<<<<< HEAD
- `app/db/database.py` automatically selects `NullPool` for SQLite or a queue pool for PostgreSQL based on the `DATABASE_URL`
- `AUTH_ENABLED=false` in `.env` for development — set to `true` in production and send `x-api-key` header with all requests
=======
>>>>>>> 4d5f14d533612f7d8fd7782bc57596cd95018ffe
