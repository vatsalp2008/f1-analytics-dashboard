"""Round 20: Mexico City Grand Prix — 2025 prediction (Autódromo Hermanos Rodríguez)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Mexico City sits at 2,200m altitude — thin air affects power units and aero.
CONFIG = RaceConfig(
    round_number=20,
    race_name="Mexico City Grand Prix",
    fastf1_name="Mexico City",
    lat=19.4042,
    lon=-99.0907,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
