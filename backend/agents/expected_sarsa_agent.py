from __future__ import annotations

import pickle
from collections import defaultdict
from pathlib import Path
from typing import Callable

import gymnasium as gym
import numpy as np

from backend.agents.base_agent import BaseAgent, TrainingConfig, TrainingResult


class ExpectedSarsaAgent(BaseAgent):
    """Expected SARSA: updates using the expected Q-value over the policy distribution."""

    algorithm = "expected_sarsa"

    def __init__(self) -> None:
        self.q_values: dict[tuple, np.ndarray] = defaultdict(
            lambda: np.zeros(2)
        )

    def _expected_q(self, state: tuple, epsilon: float, n_actions: int) -> float:
        """Compute E[Q(s', a')] under the epsilon-greedy policy."""
        q = self.q_values[state]
        best_action = int(np.argmax(q))
        # Each action gets epsilon/n_actions probability; best gets extra (1 - epsilon)
        expected = 0.0
        for a in range(n_actions):
            prob = epsilon / n_actions
            if a == best_action:
                prob += 1.0 - epsilon
            expected += prob * q[a]
        return expected

    def train(
        self,
        env: gym.Env,
        config: TrainingConfig,
        progress_callback: Callable[[float], None] | None = None,
    ) -> TrainingResult:
        result = TrainingResult()
        epsilon = config.epsilon_start
        epsilon_decay = config.epsilon_start / (config.episodes / 2)
        n_actions = env.action_space.n
        episode_rewards: list[float] = []

        for episode in range(config.episodes):
            obs, _ = env.reset()
            done = False
            ep_reward = 0.0

            while not done:
                if np.random.random() < epsilon:
                    action = env.action_space.sample()
                else:
                    action = int(np.argmax(self.q_values[obs]))

                next_obs, reward, terminated, truncated, _ = env.step(action)
                done = terminated or truncated

                # Expected SARSA update: use expected value over policy
                future_q = (not terminated) * self._expected_q(
                    next_obs, epsilon, n_actions
                )
                td = (
                    reward
                    + config.discount_factor * future_q
                    - self.q_values[obs][action]
                )
                self.q_values[obs][action] += config.learning_rate * td

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
        return int(np.argmax(self.q_values[state]))

    def get_q_values(self, state: tuple[int, int, bool]) -> dict[str, float]:
        q = self.q_values[state]
        return {"stand": float(q[0]), "hit": float(q[1])}

    def save(self, path: Path) -> None:
        with open(path / "qtable.pkl", "wb") as f:
            pickle.dump(dict(self.q_values), f)

    def load(self, path: Path) -> None:
        with open(path / "qtable.pkl", "rb") as f:
            data = pickle.load(f)
        self.q_values = defaultdict(lambda: np.zeros(2))
        self.q_values.update(data)
