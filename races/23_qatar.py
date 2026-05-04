"""Round 23: Qatar Grand Prix — 2025 prediction (Lusail International Circuit, Sprint)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=23,
    race_name="Qatar Grand Prix",
    fastf1_name="Qatar",
    lat=25.4900,
    lon=51.4542,
    has_sprint=True,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
