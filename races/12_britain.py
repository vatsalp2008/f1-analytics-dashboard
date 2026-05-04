"""Round 12: British Grand Prix — 2025 prediction (Silverstone)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=12,
    race_name="British Grand Prix",
    fastf1_name="British",
    lat=52.0786,
    lon=-1.0169,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
