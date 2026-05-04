"""Round 10: Canadian Grand Prix — 2025 prediction (Circuit Gilles Villeneuve, Montreal)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=10,
    race_name="Canadian Grand Prix",
    fastf1_name="Canada",
    lat=45.5048,
    lon=-73.5224,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
