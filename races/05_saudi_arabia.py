"""Round 5: Saudi Arabian Grand Prix — 2025 prediction (Jeddah Corniche, night race)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=5,
    race_name="Saudi Arabian Grand Prix",
    fastf1_name="Saudi Arabia",
    lat=21.6319,
    lon=39.1044,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
