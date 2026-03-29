from __future__ import annotations

import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.agents import AGENT_REGISTRY, BaseAgent
from backend.config import MODELS_DIR


def save_model(
    agent: BaseAgent,
    metadata: dict[str, Any],
    learning_curve: dict[str, list] | None = None,
) -> str:
    model_id = str(uuid.uuid4())
    model_dir = MODELS_DIR / model_id
    model_dir.mkdir(parents=True, exist_ok=True)

    agent.save(model_dir)

    meta = {
        "model_id": model_id,
        "name": metadata.get("name", f"{agent.algorithm}_{model_id[:8]}"),
        "algorithm": agent.algorithm,
        "episodes": metadata.get("episodes", 0),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "hyperparams": metadata.get("hyperparams", {}),
        "benchmarks": metadata.get("benchmarks", {}),
        "learning_curve": learning_curve or {},
    }

    with open(model_dir / "metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

    return model_id


def load_model(model_id: str) -> tuple[BaseAgent, dict[str, Any]]:
    model_dir = MODELS_DIR / model_id
    if not model_dir.exists():
        raise FileNotFoundError(f"Model {model_id} not found")

    with open(model_dir / "metadata.json") as f:
        metadata = json.load(f)

    algorithm = metadata["algorithm"]
    agent_cls = AGENT_REGISTRY.get(algorithm)
    if agent_cls is None:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    agent = agent_cls()
    agent.load(model_dir)
    return agent, metadata


def list_models() -> list[dict[str, Any]]:
    models = []
    if not MODELS_DIR.exists():
        return models

    for model_dir in MODELS_DIR.iterdir():
        meta_path = model_dir / "metadata.json"
        if meta_path.exists():
            with open(meta_path) as f:
                meta = json.load(f)
            # Return summary without learning curve (can be large)
            summary = {
                k: v
                for k, v in meta.items()
                if k != "learning_curve"
            }
            models.append(summary)

    models.sort(key=lambda m: m.get("trained_at", ""), reverse=True)
    return models


def get_model_benchmarks(model_id: str) -> dict[str, Any]:
    model_dir = MODELS_DIR / model_id
    meta_path = model_dir / "metadata.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Model {model_id} not found")

    with open(meta_path) as f:
        return json.load(f)


def delete_model(model_id: str) -> None:
    model_dir = MODELS_DIR / model_id
    if not model_dir.exists():
        raise FileNotFoundError(f"Model {model_id} not found")
    shutil.rmtree(model_dir)
