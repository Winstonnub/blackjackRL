import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = Path(os.getenv("MODELS_DIR", BASE_DIR / "models"))
MODELS_DIR.mkdir(exist_ok=True)

DEFAULT_EVAL_EPISODES = 20_000
