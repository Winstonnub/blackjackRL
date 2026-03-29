from pydantic import BaseModel


class ModelSummary(BaseModel):
    model_id: str
    name: str
    algorithm: str
    episodes: int
    trained_at: str
    hyperparams: dict
    benchmarks: dict


class RecommendRequest(BaseModel):
    player_sum: int
    dealer_upcard: int
    usable_ace: bool


class RecommendResponse(BaseModel):
    action: str
    q_values: dict[str, float]
