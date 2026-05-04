"""Round 15: Dutch Grand Prix — 2025 prediction (Zandvoort)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Zandvoort: narrow, high-banking, hard to overtake.
CONFIG = RaceConfig(
    round_number=15,
    race_name="Dutch Grand Prix",
    fastf1_name="Dutch",
    lat=52.3886,
    lon=4.5400,
    quali_weight=0.60,
    form_weight=0.40,
    max_positions_gained=5,
    max_positions_lost=8,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
