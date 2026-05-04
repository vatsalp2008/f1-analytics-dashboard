"""Round 8: Monaco Grand Prix — 2025 prediction (street circuit, qualifying-dominant)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Monaco is a street circuit — qualifying dominates, overtaking is nearly impossible.
# 80% qualifying weight, tight position-change clamps.
CONFIG = RaceConfig(
    round_number=8,
    race_name="Monaco Grand Prix",
    fastf1_name="Monaco",
    circuit_key="Monaco",
    lat=43.7347,
    lon=7.4206,
    quali_weight=0.80,
    form_weight=0.20,
    max_positions_gained=3,
    max_positions_lost=5,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
