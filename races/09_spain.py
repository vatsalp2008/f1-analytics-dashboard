"""Round 9: Spanish Grand Prix — 2025 prediction (Circuit de Barcelona-Catalunya)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


CONFIG = RaceConfig(
    round_number=9,
    race_name="Spanish Grand Prix",
    fastf1_name="Spain",
    lat=41.5700,
    lon=2.2611,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
