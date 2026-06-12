"""Lookup table of all 24 2025 race configs, keyed by round number.

Each races/NN_*.py defines a module-level CONFIG. We load them lazily via
importlib because Python identifiers can't start with a digit (`races.01_australia`
is not a valid import).
"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

from .predictor import RaceConfig

RACES_DIR = Path(__file__).resolve().parents[1] / "races"

_FILENAME_RE = re.compile(r"^(\d{2})_[a-z_]+\.py$")


def _load_config(path: Path) -> RaceConfig:
    spec = importlib.util.spec_from_file_location(f"_race_{path.stem}", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if not hasattr(module, "CONFIG"):
        raise AttributeError(f"{path.name} has no CONFIG")
    return module.CONFIG


def build_registry() -> dict[int, RaceConfig]:
    """Scan races/ once and return {round_number: RaceConfig} for all 24 rounds."""
    registry: dict[int, RaceConfig] = {}
    for path in sorted(RACES_DIR.glob("*.py")):
        match = _FILENAME_RE.match(path.name)
        if not match:
            continue
        config = _load_config(path)
        registry[config.round_number] = config
    return registry


# Module-level singleton. Built on first import; cheap because each race file
# is just a RaceConfig literal under `if __name__ == "__main__":` guard.
REGISTRY: dict[int, RaceConfig] = build_registry()


def get_config(round_number: int) -> RaceConfig:
    if round_number not in REGISTRY:
        raise KeyError(f"No race config for round {round_number}")
    return REGISTRY[round_number]
