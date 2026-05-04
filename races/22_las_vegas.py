"""Round 22: Las Vegas Grand Prix — 2025 prediction (Las Vegas Strip Circuit, night race)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Vegas Strip: cold November night race, long straights, low-grip surface.
CONFIG = RaceConfig(
    round_number=22,
    race_name="Las Vegas Grand Prix",
    fastf1_name="Las Vegas",
    lat=36.1147,
    lon=-115.1728,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
