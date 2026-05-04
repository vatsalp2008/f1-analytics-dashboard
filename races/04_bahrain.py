"""Round 4: Bahrain Grand Prix — 2025 prediction (Sakhir, night race)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=4,
    race_name="Bahrain Grand Prix",
    fastf1_name="Bahrain",
    circuit_key="Bahrain",
    lat=26.0325,
    lon=50.5106,
    quali_weight=0.55,
    form_weight=0.45,
    max_positions_gained=6,
    max_positions_lost=10,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
