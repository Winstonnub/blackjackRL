"""Train all 5 agents at 1M episodes and export as static JSON for Vercel deployment."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import gymnasium as gym
import numpy as np

from backend.agents import AGENT_REGISTRY
from backend.agents.base_agent import TrainingConfig
from backend.config import DEFAULT_EVAL_EPISODES

OUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "models"
OUT_DIR.mkdir(parents=True, exist_ok=True)

EPISODES = 1_000_000
EVAL_EPISODES = 100_000

DISPLAY_NAMES = {
    "qlearning": "Q-Learning",
    "monte_carlo": "Monte Carlo",
    "sarsa": "SARSA",
    "expected_sarsa": "Expected SARSA",
    "double_qlearning": "Double Q-Learning",
}

index = []

for algo, cls in AGENT_REGISTRY.items():
    print(f"Training {algo}...", flush=True)
    t0 = time.time()

    agent = cls()
    env = gym.make("Blackjack-v1", sab=True)
    config = TrainingConfig(episodes=EPISODES)

    result = agent.train(env, config)
    train_time = round(time.time() - t0, 1)
    print(f"  done in {train_time}s, evaluating...", flush=True)

    eval_env = gym.make("Blackjack-v1", sab=True)
    benchmarks = agent.evaluate(eval_env, num_episodes=EVAL_EPISODES)

    # Serialize Q-table as { "player_sum,dealer_upcard,usable_ace": [stand_q, hit_q] }
    if algo == "double_qlearning":
        # Combine q1+q2 for export
        all_keys = set(agent.q1.keys()) | set(agent.q2.keys())
        q_table = {
            f"{k[0]},{k[1]},{str(k[2]).lower()}": [
                float(agent.q1[k][0] + agent.q2[k][0]),
                float(agent.q1[k][1] + agent.q2[k][1]),
            ]
            for k in all_keys
        }
    else:
        q_table = {
            f"{k[0]},{k[1]},{str(k[2]).lower()}": [float(v[0]), float(v[1])]
            for k, v in agent.q_values.items()
        }

    model_id = algo

    payload = {
        "model_id": model_id,
        "name": f"{DISPLAY_NAMES[algo]} (1M eps)",
        "algorithm": algo,
        "episodes": EPISODES,
        "trained_at": "2026-03-29",
        "hyperparams": {
            "learning_rate": 0.01,
            "discount_factor": 0.95,
            "epsilon_start": 1.0,
            "epsilon_end": 0.1,
        },
        "benchmarks": benchmarks,
        "learning_curve": {
            "checkpoints": result.checkpoints,
            "avg_rewards": result.avg_rewards,
            "epsilons": result.epsilons,
        },
        "q_table": q_table,
    }

    out_path = OUT_DIR / f"{model_id}.json"
    with open(out_path, "w") as f:
        json.dump(payload, f, separators=(",", ":"))

    size_kb = out_path.stat().st_size / 1024
    print(f"  exported {out_path.name} ({size_kb:.1f} KB) | win={benchmarks['win_rate']:.4f} edge={benchmarks['house_edge_percent']:.2f}%")

    index.append({
        "model_id": model_id,
        "name": payload["name"],
        "algorithm": algo,
        "episodes": EPISODES,
        "trained_at": payload["trained_at"],
        "hyperparams": payload["hyperparams"],
        "benchmarks": benchmarks,
    })

with open(OUT_DIR / "index.json", "w") as f:
    json.dump(index, f, indent=2)

print(f"\nDone. {len(index)} models exported to {OUT_DIR}")
