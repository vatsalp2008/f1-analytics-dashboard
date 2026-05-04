"""Round 2: Chinese Grand Prix — 2025 prediction (Sprint weekend)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=2,
    race_name="Chinese Grand Prix",
    fastf1_name="China",
    circuit_key="Shanghai",
    lat=31.3389,
    lon=121.2198,
    has_sprint=True,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
