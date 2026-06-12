"""Backtest the 2025 prediction pipeline against actual race results.

Public API:
- fetch_actual_result(year, round_number) -> dict[abbrev, position]
- score(predicted_df, actual) -> dict of metrics
- backtest_year(year, rounds=None) -> pd.DataFrame
"""
from __future__ import annotations

import contextlib
import io
from typing import Iterable, Optional

import fastf1
import numpy as np
import pandas as pd
from scipy.stats import spearmanr

from .predictor import _enable_fastf1_cache, run_prediction
from .race_registry import REGISTRY, get_config


# Neutral "no weather influence" for backtests on past races. The Open-Meteo
# forecast endpoint only covers the next ~16 days, so for any historical race
# we cannot get the actual forecast. We could fetch historical weather from
# FastF1's session metadata, but the simpler choice for now is a flat baseline
# so the rain/temp features carry no signal during backtesting.
BACKTEST_WEATHER: dict[str, float] = {
    "rain_probability": 0.0,
    "temperature": 22.0,
    "humidity": 50.0,
    "wind_speed": 2.0,
}


def fetch_actual_result(year: int, round_number: int) -> dict[str, int]:
    """Return {driver_abbrev: finishing_position} for one race.

    Mirrors the extractor used inside fetch_completed_races (predictor.py:72-78):
    DNF → 19, DSQ → 20. Raises if the session isn't available.
    """
    _enable_fastf1_cache()
    session = fastf1.get_session(year, round_number, "R")
    session.load()
    result: dict[str, int] = {}
    for _, driver in session.results.iterrows():
        if pd.isna(driver.get("Abbreviation")):
            continue
        pos = driver.get("Position")
        if pd.isna(pos) or pos == "":
            pos = 20 if "Disqualified" in str(driver.get("Status", "")) else 19
        result[driver["Abbreviation"]] = int(pos)
    return result


def score(predicted_df: pd.DataFrame, actual: dict[str, int]) -> dict[str, float]:
    """Score one race's predictions against actuals.

    Returns:
        spearman_rho:           rank correlation across the full grid (-1..1, higher better)
        top3_hit_rate:          how many of the top-3 predicted finished top-3 actually (0..3)
        weighted_position_err:  sum of |pred - actual| weighted by 1/pred_pos (leaders matter more)
        mae_position:           plain mean absolute position error
        n_drivers:              how many drivers were scoreable (in both predicted + actual)
    """
    drivers = [d for d in predicted_df["Driver"].tolist() if d in actual]
    if len(drivers) < 3:
        return {
            "spearman_rho": float("nan"),
            "top3_hit_rate": 0.0,
            "weighted_position_err": float("nan"),
            "mae_position": float("nan"),
            "n_drivers": float(len(drivers)),
        }

    # Predicted position = row index after sort (predicted_df is already sorted
    # by PredictedRaceTime ascending, so first row = predicted P1).
    pred_pos = {d: i + 1 for i, d in enumerate(predicted_df["Driver"].tolist()) if d in actual}
    actual_pos = {d: actual[d] for d in drivers}

    pred_arr = np.array([pred_pos[d] for d in drivers])
    actual_arr = np.array([actual_pos[d] for d in drivers])

    rho, _ = spearmanr(pred_arr, actual_arr)

    predicted_top3 = set(predicted_df["Driver"].head(3).tolist())
    actual_top3 = {d for d, p in actual.items() if p <= 3}
    top3_hits = float(len(predicted_top3 & actual_top3))

    weights = 1.0 / pred_arr
    weighted_err = float(np.sum(weights * np.abs(pred_arr - actual_arr)))

    mae = float(np.mean(np.abs(pred_arr - actual_arr)))

    return {
        "spearman_rho": float(rho),
        "top3_hit_rate": top3_hits,
        "weighted_position_err": weighted_err,
        "mae_position": mae,
        "n_drivers": float(len(drivers)),
    }


def _race_was_run(year: int, round_number: int) -> bool:
    """True if the round's race session has finishing positions available."""
    try:
        actual = fetch_actual_result(year, round_number)
        return any(p <= 18 for p in actual.values())
    except Exception:
        return False


def backtest_year(
    year: int,
    rounds: Optional[Iterable[int]] = None,
    quiet: bool = True,
) -> pd.DataFrame:
    """Backtest all completed rounds of `year`.

    If `rounds` is None, auto-detect: iterate the registry's rounds in order
    and stop at the first one that hasn't been run.

    `quiet=True` suppresses run_prediction's verbose stdout — only summary
    lines from this module are printed.
    """
    if year != 2025:
        # The registry only knows 2025 configs right now. Easy to extend later.
        raise NotImplementedError("Backtest currently only supports 2025")

    if rounds is None:
        rounds = []
        for r in sorted(REGISTRY.keys()):
            if _race_was_run(year, r):
                rounds.append(r)
            else:
                break

    rows = []
    for r in rounds:
        config = get_config(r)
        print(f"[backtest] R{r:>2} {config.fastf1_name} — fetching actual...")
        try:
            actual = fetch_actual_result(year, r)
        except Exception as exc:
            print(f"  ⚠️ Could not fetch actual: {str(exc)[:80]}")
            continue

        print(f"[backtest] R{r:>2} {config.fastf1_name} — running prediction (model={config.model_type})...")
        sink = io.StringIO() if quiet else None
        cm = contextlib.redirect_stdout(sink) if quiet else contextlib.nullcontext()
        with cm:
            try:
                predicted_df = run_prediction(config, weather_override=BACKTEST_WEATHER)
            except Exception as exc:
                predicted_df = None
                err = str(exc)[:80]
        if predicted_df is None:
            print(f"  ⚠️ Prediction failed")
            continue

        metrics = score(predicted_df, actual)
        metrics.update({
            "round": r,
            "race": config.race_name,
            "model": config.model_type,
        })
        rows.append(metrics)
        print(
            f"  ρ={metrics['spearman_rho']:+.2f}  "
            f"top3={int(metrics['top3_hit_rate'])}/3  "
            f"wpe={metrics['weighted_position_err']:.2f}  "
            f"mae={metrics['mae_position']:.2f}"
        )

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    return df[["round", "race", "model", "spearman_rho", "top3_hit_rate",
               "weighted_position_err", "mae_position", "n_drivers"]]
