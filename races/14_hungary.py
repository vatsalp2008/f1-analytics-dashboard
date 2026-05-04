"""Round 14: Hungarian Grand Prix — 2025 prediction (Hungaroring)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Hungaroring is twisty with limited overtaking — qualifying matters more than usual.
CONFIG = RaceConfig(
    round_number=14,
    race_name="Hungarian Grand Prix",
    fastf1_name="Hungary",
    lat=47.5839,
    lon=19.2486,
    quali_weight=0.65,
    form_weight=0.35,
    max_positions_gained=5,
    max_positions_lost=8,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
