from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.schemas.model_schemas import RecommendRequest, RecommendResponse
from backend.storage import model_store

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
def list_models():
    return model_store.list_models()


@router.get("/{model_id}/benchmarks")
def get_benchmarks(model_id: str):
    try:
        return model_store.get_model_benchmarks(model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")


@router.post("/{model_id}/recommend", response_model=RecommendResponse)
def recommend_action(model_id: str, request: RecommendRequest):
    try:
        agent, _ = model_store.load_model(model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")

    state = (request.player_sum, request.dealer_upcard, request.usable_ace)
    action_idx = agent.act(state)
    q_values = agent.get_q_values(state)
    action_name = "stand" if action_idx == 0 else "hit"

    return RecommendResponse(action=action_name, q_values=q_values)


@router.delete("/{model_id}", status_code=204)
def delete_model(model_id: str):
    try:
        model_store.delete_model(model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")
