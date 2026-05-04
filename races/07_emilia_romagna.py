"""Round 7: Emilia Romagna Grand Prix — 2025 prediction (Imola)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=7,
    race_name="Emilia Romagna Grand Prix",
    fastf1_name="Emilia Romagna",
    lat=44.3439,
    lon=11.7167,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
