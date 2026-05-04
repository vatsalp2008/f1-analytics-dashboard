"""Round 18: Singapore Grand Prix — 2025 prediction (Marina Bay, night street circuit)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Marina Bay: narrow street circuit, very hard to overtake. Safety car is near-certain.
CONFIG = RaceConfig(
    round_number=18,
    race_name="Singapore Grand Prix",
    fastf1_name="Singapore",
    lat=1.2914,
    lon=103.8642,
    quali_weight=0.70,
    form_weight=0.30,
    max_positions_gained=4,
    max_positions_lost=6,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
