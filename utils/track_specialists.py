"""FastF1-derived track-specialist multipliers — EXPERIMENTAL, NOT WIRED.

For each circuit on the 2025 calendar, fetch past-season race results, rank
drivers by average finishing position, and map ranks linearly into a lap-time
multiplier (MULT_MIN .. MULT_MAX). The goal was to replace the hand-coded
`season_metrics.TRACK_SPECIALISTS` (which only covers 6 of 24 circuits).

**Backtest verdict: regresses.** Replacing TRACK_SPECIALISTS with values from
this module dropped aggregate Spearman ρ from +0.592 to +0.578 across 24
rounds. Comparison saved at backtest_results/2025_fastf1_specialists.json.
The hand-coded dict remains the live source. This module is kept on disk for
future iteration (softer mapping, recency-weighting, rookie penalty fallback).

Dict shape (when loaded):
    {fastf1_event_name: {driver_abbrev: float_multiplier, ...}, ...}
"""
from __future__ import annotations

import pickle
from pathlib import Path

import fastf1
import numpy as np
import pandas as pd

from .predictor import CACHE_DIR as FASTF1_CACHE_DIR, _enable_fastf1_cache
from .race_registry import REGISTRY


SPECIALISTS_CACHE = FASTF1_CACHE_DIR.parent / "track_specialists.pkl"

# DNF / DSQ position encodings — must match utils/predictor.py.
DNF_POS = 19
DSQ_POS = 20

# Multiplier band — matches the hand-coded dict's 0.95–1.03 envelope so the
# downstream lap-time adjustment magnitude stays comparable. Position ratios
# (avg_pos / field_mean) produce way larger spreads than lap-time
# multipliers ever should (P2/P10 = 0.2, etc.), so we map by RANK within the
# field instead: best gets MULT_MIN, worst gets MULT_MAX, linear between.
MULT_MIN = 0.96
MULT_MAX = 1.02


def _fetch_year_positions(year: int, fastf1_name: str) -> dict[str, int]:
    """Return {driver_abbrev: finishing_position} for one (year, circuit)."""
    session = fastf1.get_session(year, fastf1_name, "R")
    session.load(laps=False, telemetry=False, weather=False, messages=False)
    out: dict[str, int] = {}
    for _, r in session.results.iterrows():
        abbrev = r.get("Abbreviation")
        if pd.isna(abbrev):
            continue
        pos = r.get("Position")
        if pd.isna(pos) or pos == "":
            pos = DSQ_POS if "Disqualified" in str(r.get("Status", "")) else DNF_POS
        out[str(abbrev)] = int(pos)
    return out


def compute_for_event(fastf1_name: str, years: tuple[int, ...] = (2023, 2024)) -> dict[str, float]:
    """One circuit → {driver_abbrev: multiplier}.

    Driver gets a multiplier by RANK among everyone who raced this circuit in
    the given years: fastest avg position → MULT_MIN (~0.96), slowest →
    MULT_MAX (~1.02), linear between. Drivers with no historical data at this
    circuit are absent from the dict (predictor falls back to 1.0).
    """
    by_driver: dict[str, list[float]] = {}
    for year in years:
        try:
            positions = _fetch_year_positions(year, fastf1_name)
        except Exception as exc:
            print(f"  ⚠️ {fastf1_name} {year}: {str(exc)[:70]}")
            continue
        for driver, pos in positions.items():
            by_driver.setdefault(driver, []).append(float(pos))

    if not by_driver:
        return {}

    avg = {d: float(np.mean(ps)) for d, ps in by_driver.items()}
    sorted_drivers = sorted(avg.items(), key=lambda kv: kv[1])
    n = len(sorted_drivers)
    if n == 1:
        return {sorted_drivers[0][0]: 1.0}

    return {
        d: MULT_MIN + (i / (n - 1)) * (MULT_MAX - MULT_MIN)
        for i, (d, _) in enumerate(sorted_drivers)
    }


def build_all(years: tuple[int, ...] = (2023, 2024)) -> dict[str, dict[str, float]]:
    """Iterate the 2025 calendar via the registry, compute every circuit."""
    _enable_fastf1_cache()
    result: dict[str, dict[str, float]] = {}
    for r in sorted(REGISTRY.keys()):
        config = REGISTRY[r]
        print(f"[track_specialists] {config.fastf1_name} ({years[0]}–{years[-1]})...")
        result[config.fastf1_name] = compute_for_event(config.fastf1_name, years)
        n = len(result[config.fastf1_name])
        print(f"  ✅ {n} drivers")
    return result


def load_or_build(rebuild: bool = False) -> dict[str, dict[str, float]]:
    """Load the cached dict if present, else build + save it."""
    if not rebuild and SPECIALISTS_CACHE.exists():
        with SPECIALISTS_CACHE.open("rb") as f:
            return pickle.load(f)
    data = build_all()
    SPECIALISTS_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with SPECIALISTS_CACHE.open("wb") as f:
        pickle.dump(data, f)
    print(f"💾 Saved {SPECIALISTS_CACHE}")
    return data


if __name__ == "__main__":
    import sys
    rebuild = "--rebuild" in sys.argv
    d = load_or_build(rebuild=rebuild)
    print(f"\n{len(d)} circuits with specialist data:")
    for circuit, drivers in d.items():
        fastest = min(drivers.items(), key=lambda kv: kv[1]) if drivers else None
        slowest = max(drivers.items(), key=lambda kv: kv[1]) if drivers else None
        fast = f"{fastest[0]}={fastest[1]:.3f}" if fastest else "—"
        slow = f"{slowest[0]}={slowest[1]:.3f}" if slowest else "—"
        print(f"  {circuit:<18} n={len(drivers):>2}  fastest: {fast:<14}  slowest: {slow}")
