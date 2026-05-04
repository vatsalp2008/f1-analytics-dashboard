"""Shared season-level metrics: track-specialist factors and DNF-aware consistency/reliability.

`TRACK_SPECIALISTS` is a per-circuit, per-driver multiplier on lap time. Lower = faster
at this circuit. Hand-curated for now — see CHANGES.md #3 for plan to derive from FastF1
historical results in a future pass.

`calculate_consistency_and_reliability` returns two driver→score dicts from a season
results mapping (where DNFs are encoded as position 19 and DSQs as 20 by the fetcher).
"""
import numpy as np

# DNF / DSQ position encodings used by the FastF1 fetchers.
DNF_POSITIONS = {19, 20}

# Per-driver multiplier on lap time, keyed by circuit then driver code.
# Lower = faster at this circuit. Default 1.0 = no track-specific signal.
# Audit fix (CHANGES.md #3): Shanghai ANT was 1.00 — bumped to 1.02 to match other
# Shanghai rookies (BEA/DOO/HAD/BOR all 1.02), since Antonelli was a rookie at Shanghai too.
TRACK_SPECIALISTS = {
    "Albert Park": {
        "VER": 0.98, "HAM": 0.97, "LEC": 0.99, "NOR": 0.99,
        "PIA": 0.98, "RUS": 0.99, "SAI": 1.00, "ALO": 0.98,
        "TSU": 1.01, "OCO": 1.01, "GAS": 1.00, "STR": 1.02,
        "ALB": 1.01, "HUL": 1.02,
    },
    "Shanghai": {
        "VER": 0.97, "HAM": 0.96, "LEC": 0.99, "NOR": 1.00,
        "PIA": 1.01, "RUS": 0.99, "SAI": 1.00, "ALO": 0.98,
        "TSU": 1.01, "OCO": 1.01, "GAS": 1.00, "STR": 1.02,
        "ALB": 1.01, "HUL": 1.02, "ANT": 1.02, "BEA": 1.02,
        "LAW": 1.01, "DOO": 1.02, "HAD": 1.02, "BOR": 1.02,
    },
    "Suzuka": {
        "VER": 0.96, "HAM": 0.97, "ALO": 0.98, "TSU": 0.98,
        "SAI": 0.99, "LEC": 0.99, "NOR": 1.00, "RUS": 1.00,
        "PIA": 1.01, "GAS": 1.01, "OCO": 1.01, "STR": 1.02,
        "ALB": 1.01, "HUL": 1.02, "ANT": 1.03, "BEA": 1.03,
        "LAW": 1.02, "DOO": 1.03, "BOR": 1.03, "HAD": 1.03,
    },
    "Bahrain": {
        "VER": 0.96, "HAM": 0.97, "LEC": 0.98, "SAI": 0.99,
        "NOR": 0.99, "RUS": 1.00, "ALO": 0.98, "PIA": 1.01,
    },
    "Monaco": {
        "LEC": 0.95, "ALO": 0.96, "HAM": 0.97, "VER": 0.98,
        "SAI": 0.99, "RUS": 1.00, "NOR": 1.01, "PIA": 1.02,
    },
    "Interlagos": {
        "VER": 0.96, "HAM": 0.95, "RUS": 0.97, "ALO": 0.98,
        "LEC": 0.99, "SAI": 0.99, "NOR": 1.00, "PIA": 1.01,
        "GAS": 1.00, "TSU": 1.01, "OCO": 1.00, "STR": 1.02,
        "ALB": 1.01, "HUL": 1.02, "ANT": 1.03, "BEA": 1.03,
        "LAW": 1.02, "DOO": 1.03, "BOR": 1.03, "HAD": 1.03,
    },
}


def calculate_consistency_and_reliability(season_results):
    """Stability when running + share of races finished, computed per driver.

    Args:
        season_results: dict mapping race name → {driver_code: position}.
            Positions 19/20 are interpreted as DNF/DSQ and excluded from
            the consistency std calculation.

    Returns:
        (consistency, reliability) — two dicts mapping driver_code → score.
        consistency = 1 / (1 + std(finished_positions)), in (0, 1].
        reliability = finished_count / total_count, in [0, 1].
        Both default to 0.5 when there's not enough data.
    """
    consistency = {}
    reliability = {}

    all_drivers = set().union(*[set(r.keys()) for r in season_results.values()])

    for driver in all_drivers:
        positions = [
            race[driver]
            for race in season_results.values()
            if driver in race
        ]
        finished = [p for p in positions if p not in DNF_POSITIONS]

        consistency[driver] = 1 / (1 + np.std(finished)) if len(finished) > 1 else 0.5
        reliability[driver] = len(finished) / len(positions) if positions else 0.5

    return consistency, reliability
