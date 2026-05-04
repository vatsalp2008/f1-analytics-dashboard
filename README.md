# 🏎️ F1 Predictions 2025

Machine-learning predictions for every round of the 2025 Formula 1 season.

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://www.python.org/)
[![FastF1](https://img.shields.io/badge/FastF1-3.6-red)](https://github.com/theOehrly/Fast-F1)
[![scikit-learn](https://img.shields.io/badge/sklearn-1.7-orange)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-flagship-green)](https://xgboost.readthedocs.io/)

## What it does

One thin script per race (24 total). Each script auto-fetches every prior 2025 race via the FastF1 API, computes per-driver metrics, pulls the live race-day weather forecast, trains a model on the previous-year lap times for that circuit, and outputs a predicted finishing order with a podium and feature importances.

```bash
python3 races/04_bahrain.py
```

```
🏁 2025 BAHRAIN GRAND PRIX 🏁
======================================================================
Round 4 of 24
======================================================================

📡 Loading 2025 season data...
🔄 Fetching races 1..3
  ✅ R1: Australian
  ✅ R2: Chinese  🏃 Sprint included
  ✅ R3: Japanese

🌤️ Fetching weather forecast...
  Temperature: 30.4°C  |  Rain: 0%

📋 PREDICTED RACE ORDER:
P1   VER      Max Verstappen         P7    ↑6   18.9
P2   LEC      Charles Leclerc        P3    ↑1   12.0
P3   HAM      Lewis Hamilton         P9    ↑6    9.8
...

🏆 PREDICTED PODIUM:
  🥇 VER   Max Verstappen
  🥈 LEC   Charles Leclerc
  🥉 HAM   Lewis Hamilton

📊 Model MAE: 1.040s
```

## Project structure

```
f1-predictions-vatsal/
├── races/                  # 24 thin race scripts (round numbers 01–24)
│   ├── 01_australia.py
│   ├── 02_china.py
│   ├── ...
│   └── 24_abu_dhabi.py
├── utils/                  # shared logic
│   ├── predictor.py        # the pipeline (~280 lines)
│   ├── weather.py          # Open-Meteo forecast helper
│   └── season_metrics.py   # TRACK_SPECIALISTS + Consistency/Reliability
├── models/                 # experimental ML demos (not part of main pipeline)
│   ├── neural_prediction.py    # PyTorch FC network
│   └── vision_analysis.py      # TF/Keras CNN over track-map images
├── data/                   # caches (FastF1 SQLite + season JSON)
└── vision_output/          # CNN track-map outputs
```

## Each race file is ~15 lines

The whole prediction pipeline lives in `utils/predictor.py`. A race script just sets a `RaceConfig` and hands it off:

```python
# races/08_monaco.py
from utils.predictor import RaceConfig, run_prediction

CONFIG = RaceConfig(
    round_number=8,
    race_name="Monaco Grand Prix",
    fastf1_name="Monaco",
    circuit_key="Monaco",
    lat=43.7347,
    lon=7.4206,
    quali_weight=0.80,            # Monaco is qualifying-dominant
    form_weight=0.20,
    max_positions_gained=3,       # near-impossible to overtake
    max_positions_lost=5,
)

if __name__ == "__main__":
    run_prediction(CONFIG)
```

To adjust how a race is predicted, change the constants in its config — no need to touch the shared pipeline.

## What the pipeline does

For each race the predictor:

1. **Fetches every completed 2025 race** before this round via FastF1 (with a 24h JSON cache for re-runs).
2. **Computes per-driver metrics**: season average, exp-weighted recent form (last 5 races), sprint average, momentum (linear trend over last 6), consistency (1/(1+std) of finished positions), reliability (% races finished). DNFs/DSQs are filtered out of consistency.
3. **Pulls live weather** for race-day Sunday from Open-Meteo (free, no API key, ~16-day forecast).
4. **Fetches actual qualifying** for this round (Q3→Q2→Q1 fallback per driver).
5. **Optionally fetches sprint** if `has_sprint=True`.
6. **Loads previous-year lap times** for this circuit as the regression target.
7. **Trains** a `GradientBoostingRegressor` (or `XGBRegressor` if `model_type="xgboost"`) on the engineered feature matrix.
8. **Applies adjustments** — qualifying-position weight, recent-form weight, momentum bonus/penalty.
9. **Clamps position changes** to circuit-realistic bounds (Monaco ±3/5, Monza ±10/12, etc.).
10. **Outputs** ranked predictions, podium, MAE, top-5 features.

### Features used (16)

`QualifyingTime`, `QualifyingPosition`, `SeasonAverage`, `RecentForm`, `SprintAverage`, `SprintPosition`, `Momentum`, `Consistency`, `Reliability`, `ChampionshipPoints`, `CircuitSpecialist`, `StartingPositionAdvantage`, `RainProbability`, `Temperature`, `Humidity`, `WindSpeed`.

## Per-race tuning

Built-in weight overrides reflect each circuit's character:

| Round | Race | Quali / Form weight | Max gained / lost |
|-------|------|---------------------|-------------------|
| 08 | Monaco | 0.80 / 0.20 | 3 / 5 |
| 18 | Singapore | 0.70 / 0.30 | 4 / 6 |
| 14 | Hungary | 0.65 / 0.35 | 5 / 8 |
| 15 | Netherlands | 0.60 / 0.40 | 5 / 8 |
| 17 | Azerbaijan | 0.55 / 0.45 | 7 / 10 |
| 04 | Bahrain | 0.55 / 0.45 | 6 / 10 |
| 16 | Italy (Monza) | 0.45 / 0.55 | 10 / 12 |
| Others | — | 0.50 / 0.50 | 8 / 12 |

Sprint weekends: rounds **2, 6, 13, 19, 21, 23**.
XGBoost flagship: round **21 (Brazil)** uses `model_type="xgboost"`.

## Setup

```bash
python3 -m venv f1env
source f1env/bin/activate
pip install -r requirements.txt
```

Required: `fastf1`, `scikit-learn`, `pandas`, `numpy`, `requests`, `matplotlib`. Optional: `xgboost` (only round 21 needs it; everything else works without).

No API keys needed — Open-Meteo's free forecast endpoint is used for weather.

## Running

Run a single race:
```bash
python3 races/04_bahrain.py
```

The first run will fetch every prior race from FastF1 (slow — late-season scripts may take a few minutes on first run as they pull 20+ races' worth of session data). Subsequent runs hit the FastF1 SQLite cache and the 24-hour JSON season cache, making them fast.

## Experimental models

`models/` holds two standalone ML demos that aren't part of the main pipeline:

- **`neural_prediction.py`** — PyTorch fully-connected network (64→32→1) trained on cached FastF1 data. MSE + Adam, 200 epochs.
- **`vision_analysis.py`** — TensorFlow CNN over GPS-derived track-map PNGs, classifies circuit type (street / high-downforce / power).

Both are exploratory — the production predictor is in `utils/predictor.py`.

## License

MIT.

## Acknowledgments

- [FastF1](https://github.com/theOehrly/Fast-F1) — F1 telemetry / results API
- [Open-Meteo](https://open-meteo.com/) — free weather forecasts
- [scikit-learn](https://scikit-learn.org/) and [XGBoost](https://xgboost.readthedocs.io/)
