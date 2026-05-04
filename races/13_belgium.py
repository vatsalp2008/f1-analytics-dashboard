"""Round 13: Belgian Grand Prix — 2025 prediction (Spa-Francorchamps, Sprint weekend)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=13,
    race_name="Belgian Grand Prix",
    fastf1_name="Belgian",
    lat=50.4372,
    lon=5.9714,
    has_sprint=True,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
