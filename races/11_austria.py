"""Round 11: Austrian Grand Prix — 2025 prediction (Red Bull Ring)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=11,
    race_name="Austrian Grand Prix",
    fastf1_name="Austria",
    lat=47.2197,
    lon=14.7647,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
