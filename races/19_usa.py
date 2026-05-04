"""Round 19: United States Grand Prix — 2025 prediction (Circuit of the Americas, Sprint)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=19,
    race_name="United States Grand Prix",
    fastf1_name="United States",
    lat=30.1328,
    lon=-97.6411,
    has_sprint=True,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
