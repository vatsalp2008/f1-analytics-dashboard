"""Round 21: Brazilian Grand Prix — 2025 prediction (Interlagos, Sprint, XGBoost flagship)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.predictor import RaceConfig, run_prediction


# Interlagos: counter-clockwise, 760m altitude, frequent rain in November.
# Uses XGBoost — historically the most-tuned model in this project.
CONFIG = RaceConfig(
    round_number=21,
    race_name="Brazilian Grand Prix",
    fastf1_name="São Paulo",
    circuit_key="Interlagos",
    lat=-23.7036,
    lon=-46.6997,
    has_sprint=True,
    model_type="xgboost",
)

if __name__ == "__main__":
    run_prediction(CONFIG)
