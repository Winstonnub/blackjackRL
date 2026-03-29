from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import game_router, models_router, training_router

app = FastAPI(title="Blackjack RL", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(training_router.router)
app.include_router(models_router.router)
app.include_router(game_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
