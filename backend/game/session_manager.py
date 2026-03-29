from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from threading import Lock
from typing import Any

import gymnasium as gym
import numpy as np
from gymnasium.envs.toy_text.blackjack import sum_hand

from backend.agents.base_agent import BaseAgent
from backend.storage import model_store


@dataclass
class ModelPlaythrough:
    """Pre-computed model result for the hand."""
    actions_taken: list[str]
    reward: float
    result: str  # "win" | "loss" | "draw"


@dataclass
class GameSession:
    game_id: str
    human_env: gym.Env
    current_obs: tuple
    model_agent: BaseAgent | None = None
    model_playthrough: ModelPlaythrough | None = None
    is_terminal: bool = False
    human_reward: float = 0.0
    dealer_final_sum: int | None = None
    dealer_busted: bool = False
    player_final_sum: int | None = None


ACTION_NAMES = {0: "stand", 1: "hit"}


def _result_from_reward(reward: float) -> str:
    if reward > 0:
        return "win"
    elif reward < 0:
        return "loss"
    return "draw"


def _play_model_hand(env_seed: int, agent: BaseAgent) -> ModelPlaythrough:
    """Play out the model's full hand deterministically."""
    env = gym.make("Blackjack-v1", sab=True)
    obs, _ = env.reset(seed=env_seed)
    done = False
    actions: list[str] = []

    while not done:
        action = agent.act(obs)
        actions.append(ACTION_NAMES[action])
        obs, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

    return ModelPlaythrough(
        actions_taken=actions,
        reward=float(reward),
        result=_result_from_reward(reward),
    )


class SessionManager:
    def __init__(self) -> None:
        self._sessions: dict[str, GameSession] = {}
        self._lock = Lock()

    def create_session(self, model_id: str | None = None) -> GameSession:
        game_id = str(uuid.uuid4())
        seed = int(np.random.randint(0, 2**31))

        # Create human env
        human_env = gym.make("Blackjack-v1", sab=True)
        obs, _ = human_env.reset(seed=seed)

        # Load model and play its hand if model_id provided
        model_agent = None
        model_playthrough = None
        if model_id:
            model_agent, _ = model_store.load_model(model_id)
            model_playthrough = _play_model_hand(seed, model_agent)

        session = GameSession(
            game_id=game_id,
            human_env=human_env,
            current_obs=obs,
            model_agent=model_agent,
            model_playthrough=model_playthrough,
        )

        with self._lock:
            self._sessions[game_id] = session

        return session

    def get_session(self, game_id: str) -> GameSession | None:
        with self._lock:
            return self._sessions.get(game_id)

    def step_human(self, game_id: str, action: str) -> GameSession:
        with self._lock:
            session = self._sessions.get(game_id)

        if session is None:
            raise KeyError(f"Game {game_id} not found")

        if session.is_terminal:
            raise ValueError("Game is already over")

        action_idx = 1 if action == "hit" else 0
        obs, reward, terminated, truncated, _ = session.human_env.step(action_idx)

        session.current_obs = obs
        done = terminated or truncated
        session.is_terminal = done
        if done:
            session.human_reward = float(reward)
            # Extract dealer and player final hands from the env internals
            bj = session.human_env.unwrapped
            session.dealer_final_sum = sum_hand(bj.dealer)
            session.dealer_busted = session.dealer_final_sum > 21
            session.player_final_sum = sum_hand(bj.player)

        return session

    def remove_session(self, game_id: str) -> None:
        with self._lock:
            self._sessions.pop(game_id, None)


# Singleton
session_manager = SessionManager()
