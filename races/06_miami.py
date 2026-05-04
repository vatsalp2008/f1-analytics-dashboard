"""Round 6: Miami Grand Prix — 2025 prediction (Sprint weekend)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=6,
    race_name="Miami Grand Prix",
    fastf1_name="Miami",
    lat=25.9581,
    lon=-80.2389,
    has_sprint=True,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
