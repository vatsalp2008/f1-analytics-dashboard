"""Round 24: Abu Dhabi Grand Prix — 2025 prediction (Yas Marina, season finale)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=24,
    race_name="Abu Dhabi Grand Prix",
    fastf1_name="Abu Dhabi",
    lat=24.4672,
    lon=54.6031,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
