from __future__ import annotations

import gymnasium as gym

from backend.agents import AGENT_REGISTRY
from backend.agents.base_agent import TrainingConfig
from backend.config import DEFAULT_EVAL_EPISODES
from backend.schemas.training_schemas import TrainRequest
from backend.storage.model_store import save_model
from backend.training.job_manager import job_manager


def run_training(job_id: str, request: TrainRequest) -> None:
    try:
        agent_cls = AGENT_REGISTRY.get(request.algorithm)
        if agent_cls is None:
            job_manager.fail_job(job_id, f"Unknown algorithm: {request.algorithm}")
            return

        agent = agent_cls()

        config = TrainingConfig(
            episodes=request.episodes,
            learning_rate=request.learning_rate,
            discount_factor=request.discount_factor,
            epsilon_start=request.epsilon_start,
            epsilon_end=request.epsilon_end,
            model_name=request.model_name,
        )

        env = gym.make("Blackjack-v1", sab=True)

        def on_progress(pct: float) -> None:
            job_manager.update_progress(job_id, pct)

        result = agent.train(env, config, progress_callback=on_progress)

        # Evaluate
        eval_env = gym.make("Blackjack-v1", sab=True)
        benchmarks = agent.evaluate(eval_env, num_episodes=DEFAULT_EVAL_EPISODES)

        # Save
        metadata = {
            "name": request.model_name or f"{request.algorithm}_{job_id[:8]}",
            "episodes": request.episodes,
            "hyperparams": {
                "learning_rate": request.learning_rate,
                "discount_factor": request.discount_factor,
                "epsilon_start": request.epsilon_start,
                "epsilon_end": request.epsilon_end,
            },
            "benchmarks": benchmarks,
        }

        learning_curve = {
            "checkpoints": result.checkpoints,
            "avg_rewards": result.avg_rewards,
            "epsilons": result.epsilons,
        }

        model_id = save_model(agent, metadata, learning_curve)
        job_manager.complete_job(job_id, model_id)

    except Exception as e:
        job_manager.fail_job(job_id, str(e))
