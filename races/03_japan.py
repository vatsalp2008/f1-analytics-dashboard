"""Round 3: Japanese Grand Prix — 2025 prediction (Suzuka)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=3,
    race_name="Japanese Grand Prix",
    fastf1_name="Japan",
    circuit_key="Suzuka",
    lat=34.8431,
    lon=136.5406,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
