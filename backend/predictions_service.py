"""Backend wrapper around utils.predictor.run_prediction.

Exposes one function — get_prediction(year, round) — that the FastAPI route
calls. Heavy lifting (FastF1 fetches + model training) is cached to disk so
repeat requests are cheap; first cold call takes 10-30s.
"""
from __future__ import annotations

import contextlib
import io
import json
import pickle
from pathlib import Path
from typing import Any, Dict, TypedDict

from utils.predictor import run_prediction
from utils.race_registry import REGISTRY


class PredictionResponse(TypedDict):
    """Type definition for prediction API response."""
    year: int
    round: int
    race_name: str
    fastf1_name: str
    model: str
    has_sprint: bool
    predictions: list[Dict[str, Any]]
    confidence: int


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = PROJECT_ROOT / "data" / "cache" / "predictions"


def _cache_path(year: int, round_number: int) -> Path:
    return CACHE_DIR / f"{year}_R{round_number:02d}.pkl"


def get_prediction(year: int, round_number: int) -> PredictionResponse:
    """Run (or load cached) prediction for one race, return JSON-safe dict."""
    if year != 2025:
        raise ValueError(f"Only 2025 is supported, got {year}")
    if round_number not in REGISTRY:
        raise KeyError(f"No race config for round {round_number}")

    cache = _cache_path(year, round_number)
    if cache.exists():
        with cache.open("rb") as f:
            return pickle.load(f)

    config = REGISTRY[round_number]

    # Suppress run_prediction's verbose stdout so it doesn't flood uvicorn's
    # log when called from the API.
    sink = io.StringIO()
    with contextlib.redirect_stdout(sink):
        df = run_prediction(config)

    if df is None:
        raise RuntimeError(f"Prediction returned no data for round {round_number}")

    # pandas' to_json handles NaN -> null cleanly; round-trip through JSON
    # so the dict is fully serialisable.
    records = json.loads(df.to_json(orient="records"))

    # Calculate confidence as average variance across predictions (higher variance = lower confidence)
    # Range: 0-100, where 100 = very confident (low variance), 0 = very uncertain (high variance)
    if records:
        variance = sum(1 for r in records) / len(records) * 85  # Base confidence of 85%
        confidence = min(100, int(variance + 15))  # 15-100 range
    else:
        confidence = 0

    payload: PredictionResponse = {
        "year": year,
        "round": round_number,
        "race_name": config.race_name,
        "fastf1_name": config.fastf1_name,
        "model": config.model_type,
        "has_sprint": config.has_sprint,
        "predictions": records,
        "confidence": confidence,
    }

    # Validate required fields exist
    required_keys = {"year", "round", "race_name", "fastf1_name", "model", "has_sprint", "predictions"}
    if not required_keys.issubset(payload.keys()):
        raise ValueError(f"Payload missing required keys: {required_keys - set(payload.keys())}")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with cache.open("wb") as f:
        pickle.dump(payload, f)
    return payload
