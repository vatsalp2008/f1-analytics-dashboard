"""Round 16: Italian Grand Prix — 2025 prediction (Monza, Temple of Speed)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Monza: long straights, lots of slipstreaming — overtaking is easier than most.
CONFIG = RaceConfig(
    round_number=16,
    race_name="Italian Grand Prix",
    fastf1_name="Italian",
    lat=45.6156,
    lon=9.2811,
    quali_weight=0.45,
    form_weight=0.55,
    max_positions_gained=10,
    max_positions_lost=12,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
