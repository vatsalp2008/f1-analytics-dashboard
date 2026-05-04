"""Round 1: Australian Grand Prix — 2025 prediction."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=1,
    race_name="Australian Grand Prix",
    fastf1_name="Australia",
    circuit_key="Albert Park",
    lat=-37.8497,
    lon=144.968,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
