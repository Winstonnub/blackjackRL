from __future__ import annotations

import abc
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

import gymnasium as gym
import numpy as np


@dataclass
class TrainingConfig:
    episodes: int = 100_000
    learning_rate: float = 0.01
    discount_factor: float = 0.95
    epsilon_start: float = 1.0
    epsilon_end: float = 0.1
    model_name: str = ""


@dataclass
class TrainingResult:
    checkpoints: list[int] = field(default_factory=list)
    avg_rewards: list[float] = field(default_factory=list)
    epsilons: list[float] = field(default_factory=list)
    training_errors: list[float] = field(default_factory=list)


class BaseAgent(abc.ABC):
    """Abstract base for all Blackjack RL agents."""

    algorithm: str = "base"

    @abc.abstractmethod
    def train(
        self,
        env: gym.Env,
        config: TrainingConfig,
        progress_callback: Callable[[float], None] | None = None,
    ) -> TrainingResult:
        ...

    @abc.abstractmethod
    def act(self, state: tuple[int, int, bool]) -> int:
        """Return greedy action for the given state."""
        ...

    @abc.abstractmethod
    def get_q_values(self, state: tuple[int, int, bool]) -> dict[str, float]:
        """Return Q-values for the given state as {action_name: value}."""
        ...

    @abc.abstractmethod
    def save(self, path: Path) -> None:
        ...

    @abc.abstractmethod
    def load(self, path: Path) -> None:
        ...

    def evaluate(
        self, env: gym.Env, num_episodes: int = 20_000
    ) -> dict[str, Any]:
        wins = losses = draws = 0
        total_reward = 0.0

        for _ in range(num_episodes):
            state, _ = env.reset()
            done = False
            while not done:
                action = self.act(state)
                state, reward, terminated, truncated, _ = env.step(action)
                done = terminated or truncated
            total_reward += reward
            if reward == 1:
                wins += 1
            elif reward == -1:
                losses += 1
            else:
                draws += 1

        avg_reward = total_reward / num_episodes
        return {
            "win_rate": round(wins / num_episodes, 4),
            "loss_rate": round(losses / num_episodes, 4),
            "draw_rate": round(draws / num_episodes, 4),
            "avg_reward": round(avg_reward, 4),
            "house_edge_percent": round(-avg_reward * 100, 2),
        }
