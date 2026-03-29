# Blackjack RL

A React + FastAPI project for training and interacting with reinforcement learning agents on Blackjack.

## Local development

Backend:

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000` for API requests. To override it, set `VITE_API_BASE_URL`.

## Render deployment

This repo includes a `render.yaml` blueprint that creates:

- `blackjackrl-api`: FastAPI web service
- `blackjackrl-frontend`: static React site

Required values during Render setup:

- `VITE_API_BASE_URL`: the public URL of the backend service, for example `https://blackjackrl-api.onrender.com`
- `CORS_ORIGINS`: the public URL of the frontend site, for example `https://blackjackrl-frontend.onrender.com`

Backend notes:

- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Model files are stored in `MODELS_DIR`
- In Render, `MODELS_DIR` is mounted to a persistent disk at `/opt/render/project/src/backend/models`

## Deployment caveat

Training jobs and job status are currently handled in-process. This is acceptable for a demo deployment, but jobs can be interrupted by restarts or deploys. A more robust production setup would move training to a worker and store job state in Redis or Postgres.
