from __future__ import annotations

import pickle
from collections import defaultdict
from pathlib import Path
from typing import Callable

import gymnasium as gym
import numpy as np

from backend.agents.base_agent import BaseAgent, TrainingConfig, TrainingResult


class DoubleQLearningAgent(BaseAgent):
    """Double Q-Learning: two Q-tables to reduce maximization bias."""

    algorithm = "double_qlearning"

    def __init__(self) -> None:
        self.q1: dict[tuple, np.ndarray] = defaultdict(lambda: np.zeros(2))
        self.q2: dict[tuple, np.ndarray] = defaultdict(lambda: np.zeros(2))

    @property
    def q_values(self) -> dict[tuple, np.ndarray]:
        """Combined Q-values for action selection."""
        all_keys = set(self.q1.keys()) | set(self.q2.keys())
        combined: dict[tuple, np.ndarray] = {}
        for k in all_keys:
            combined[k] = self.q1[k] + self.q2[k]
        return combined

    def train(
        self,
        env: gym.Env,
        config: TrainingConfig,
        progress_callback: Callable[[float], None] | None = None,
    ) -> TrainingResult:
        result = TrainingResult()
        epsilon = config.epsilon_start
        epsilon_decay = config.epsilon_start / (config.episodes / 2)
        episode_rewards: list[float] = []

        for episode in range(config.episodes):
            obs, _ = env.reset()
            done = False
            ep_reward = 0.0

            while not done:
                # epsilon-greedy using combined Q
                if np.random.random() < epsilon:
                    action = env.action_space.sample()
                else:
                    combined = self.q1[obs] + self.q2[obs]
                    action = int(np.argmax(combined))

                next_obs, reward, terminated, truncated, _ = env.step(action)
                done = terminated or truncated

                # Randomly update Q1 or Q2
                if np.random.random() < 0.5:
                    # Update Q1: use Q1's argmax to index Q2's value
                    best_a = int(np.argmax(self.q1[next_obs]))
                    future_q = (not terminated) * self.q2[next_obs][best_a]
                    td = (
                        reward
                        + config.discount_factor * future_q
                        - self.q1[obs][action]
                    )
                    self.q1[obs][action] += config.learning_rate * td
                else:
                    # Update Q2: use Q2's argmax to index Q1's value
                    best_a = int(np.argmax(self.q2[next_obs]))
                    future_q = (not terminated) * self.q1[next_obs][best_a]
                    td = (
                        reward
                        + config.discount_factor * future_q
                        - self.q2[obs][action]
                    )
                    self.q2[obs][action] += config.learning_rate * td

                obs = next_obs
                ep_reward += reward

            episode_rewards.append(ep_reward)
            epsilon = max(config.epsilon_end, epsilon - epsilon_decay)

            checkpoint_interval = max(1, config.episodes // 100)
            if (episode + 1) % checkpoint_interval == 0:
                recent = episode_rewards[-checkpoint_interval:]
                result.checkpoints.append(episode + 1)
                result.avg_rewards.append(round(float(np.mean(recent)), 4))
                result.epsilons.append(round(epsilon, 4))
                if progress_callback:
                    progress_callback((episode + 1) / config.episodes)

        return result

    def act(self, state: tuple[int, int, bool]) -> int:
        combined = self.q1[state] + self.q2[state]
        return int(np.argmax(combined))

    def get_q_values(self, state: tuple[int, int, bool]) -> dict[str, float]:
        combined = self.q1[state] + self.q2[state]
        return {"stand": float(combined[0]), "hit": float(combined[1])}

    def save(self, path: Path) -> None:
        with open(path / "qtable.pkl", "wb") as f:
            pickle.dump({"q1": dict(self.q1), "q2": dict(self.q2)}, f)

    def load(self, path: Path) -> None:
        with open(path / "qtable.pkl", "rb") as f:
            data = pickle.load(f)
        self.q1 = defaultdict(lambda: np.zeros(2))
        self.q2 = defaultdict(lambda: np.zeros(2))
        self.q1.update(data["q1"])
        self.q2.update(data["q2"])
