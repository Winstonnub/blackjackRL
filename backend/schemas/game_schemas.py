from pydantic import BaseModel


class NewGameRequest(BaseModel):
    model_id: str | None = None


class GameActionRequest(BaseModel):
    action: str  # "hit" or "stand"


class HandState(BaseModel):
    player_sum: int
    dealer_upcard: int
    usable_ace: bool


class ModelResult(BaseModel):
    result: str  # "win" | "loss" | "draw"
    reward: float
    actions_taken: list[str]
    dealer_final_sum: int | None = None
    dealer_busted: bool = False
    player_final_sum: int | None = None


class HumanResult(BaseModel):
    result: str
    reward: float


class Outcome(BaseModel):
    human: HumanResult
    model: ModelResult | None = None
    dealer_final_sum: int | None = None
    dealer_busted: bool = False
    player_final_sum: int | None = None


class GameStateResponse(BaseModel):
    game_id: str
    hand_state: HandState
    model_recommendation: str | None = None
    is_terminal: bool
    outcome: Outcome | None = None
