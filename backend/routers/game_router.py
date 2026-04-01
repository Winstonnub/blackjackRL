from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.game.session_manager import ACTION_NAMES, _result_from_reward, session_manager
from backend.schemas.game_schemas import (
    GameActionRequest,
    GameStateResponse,
    HandState,
    HumanResult,
    ModelResult,
    NewGameRequest,
    Outcome,
)

router = APIRouter(prefix="/game", tags=["game"])


def _build_response(session) -> GameStateResponse:
    obs = session.current_obs
    hand_state = HandState(
        player_sum=obs[0],
        dealer_upcard=obs[1],
        usable_ace=bool(obs[2]),
    )

    # Model recommendation for current state
    model_rec = None
    if session.model_agent and not session.is_terminal:
        action_idx = session.model_agent.act(obs)
        model_rec = ACTION_NAMES[action_idx]

    outcome = None
    if session.is_terminal:
        human_result = HumanResult(
            result=_result_from_reward(session.human_reward),
            reward=session.human_reward,
        )
        model_result = None
        if session.model_playthrough:
            mp = session.model_playthrough
            model_result = ModelResult(
                result=mp.result,
                reward=mp.reward,
                actions_taken=mp.actions_taken,
                dealer_final_sum=mp.dealer_final_sum,
                dealer_busted=mp.dealer_busted,
                player_final_sum=mp.player_final_sum,
            )
        outcome = Outcome(
            human=human_result,
            model=model_result,
            dealer_final_sum=session.dealer_final_sum,
            dealer_busted=session.dealer_busted,
            player_final_sum=session.player_final_sum,
        )

    return GameStateResponse(
        game_id=session.game_id,
        hand_state=hand_state,
        model_recommendation=model_rec,
        is_terminal=session.is_terminal,
        outcome=outcome,
    )


@router.post("/new", response_model=GameStateResponse)
def new_game(request: NewGameRequest):
    try:
        session = session_manager.create_session(model_id=request.model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")
    return _build_response(session)


@router.post("/{game_id}/action", response_model=GameStateResponse)
def game_action(game_id: str, request: GameActionRequest):
    if request.action not in ("hit", "stand"):
        raise HTTPException(status_code=422, detail="Action must be 'hit' or 'stand'")
    try:
        session = session_manager.step_human(game_id, request.action)
    except KeyError:
        raise HTTPException(status_code=404, detail="Game not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _build_response(session)
