"""Round 17: Azerbaijan Grand Prix — 2025 prediction (Baku City Circuit, street circuit)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Baku is a high-speed street circuit — qualifying important, but the long straight
# gives DRS overtaking opportunities. Safety-car probability is high.
CONFIG = RaceConfig(
    round_number=17,
    race_name="Azerbaijan Grand Prix",
    fastf1_name="Azerbaijan",
    lat=40.3725,
    lon=49.8533,
    quali_weight=0.55,
    form_weight=0.45,
    max_positions_gained=7,
    max_positions_lost=10,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
