# 🏎️ F1 Analytics Dashboard

Machine-learning race predictions **+** interactive telemetry replay for the 2025 Formula 1 season, in a single project.

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![FastF1](https://img.shields.io/badge/FastF1-3.6-red)](https://github.com/theOehrly/Fast-F1)
[![scikit-learn](https://img.shields.io/badge/sklearn-1.7-orange)](https://scikit-learn.org/)

## What it does

Three things, in one repo:

1. **Race predictions** — 24 CLI scripts (one per 2025 round) that fetch real data via FastF1, pull a live Open-Meteo forecast, train a GBM/XGBoost model on the previous-year lap times, and output a ranked finishing order.
2. **Web dashboard** — FastAPI backend + React/Vite frontend that visualizes live race telemetry and produces interactive race replays.
3. **Desktop replay GUI** — legacy Arcade-based standalone app for the same race-replay visualization, without a browser.

Both halves share one [data/](data/) directory and one [requirements.txt](requirements.txt). The dashboard and the predictions modules **do not yet talk to each other** — that's the next integration step (see [plan.md](plan.md)).

## Project structure

```
f1-analytics-dashboard/
├── README.md, plan.md, requirements.txt, package.json
│
├── races/                   24 prediction CLI scripts (01_australia.py … 24_abu_dhabi.py)
├── utils/                   shared prediction pipeline
│   ├── predictor.py         the pipeline (~280 lines)
│   ├── weather.py           Open-Meteo forecast helper
│   └── season_metrics.py    TRACK_SPECIALISTS + Consistency/Reliability
├── models/                  experimental ML demos (PyTorch FC net, TF CNN)
│
├── backend/                 FastAPI service for the web dashboard
│   ├── main.py              API entry point + CORS + routes
│   └── f1_service.py        FastF1 telemetry processing
├── frontend/                React + Vite SPA
│   ├── src/                 React components (RaceMenu, ReplayEngine, …)
│   └── package.json
├── desktop/                 legacy Arcade GUI replay
│   ├── main.py              desktop entry point
│   └── src/                 desktop source
│
├── data/                    unified data root
│   ├── cache/
│   │   ├── f1_cache/        predictions' FastF1 cache
│   │   └── fastf1-cache/    replay's FastF1 cache  (to be merged)
│   ├── computed_data/       pre-computed telemetry pickles (~300MB each)
│   ├── images/              UI assets
│   └── resources/           preview images
│
├── docs/                    non-code documentation
│   ├── dashboard.md         full race-replay README (preserved verbatim)
│   ├── roadmap.md           planned replay features
│   └── contributors.md
│
└── vision_output/           CV demo output (track-map PNGs)
```

## Setup

Python:

```bash
python3 -m venv f1env
source f1env/bin/activate
pip install -r requirements.txt
```

Node (for the web dashboard only):

```bash
npm install                    # root-level orchestrator deps
cd frontend && npm install     # React app deps
```

No API keys needed. Open-Meteo's free forecast endpoint covers weather; FastF1 covers everything else.

## Running

### Predictions (CLI, one script per race)

```bash
python3 races/04_bahrain.py        # any of the 24 race files
```

The first run for any round will pull all prior 2025 races from FastF1 (slow — late-season scripts fetch 20+ races). Subsequent runs hit FastF1's local SQLite cache and finish in seconds.

### Web dashboard (FastAPI + React)

```bash
npm run dev                        # starts FastAPI on :8000 and Vite dev server on :5173
```

Open `http://localhost:5173` for the dashboard.

### Desktop replay (Arcade GUI)

```bash
python3 desktop/main.py            # opens the GUI menu
python3 desktop/main.py --year 2025 --round 12          # jump straight into a race
python3 desktop/main.py --year 2025 --round 12 --qualifying
```

Full desktop CLI flag reference lives in [docs/dashboard.md](docs/dashboard.md).

## Pipeline overview (predictions)

For each race the predictor:

1. **Fetches every completed 2025 race** before this round via FastF1.
2. **Computes per-driver metrics**: season average, exp-weighted recent form (last 5), sprint average, momentum (linear trend over last 6), consistency (1/(1+std) of finished positions), reliability (% finished). DNFs filtered out of consistency.
3. **Pulls live weather** for race-day Sunday (Open-Meteo, no API key).
4. **Fetches qualifying** for this round (Q3→Q2→Q1 fallback).
5. **Optionally fetches sprint** if the round has one.
6. **Loads previous-year lap times** as the regression target.
7. **Trains** a `GradientBoostingRegressor` (or `XGBRegressor` if `model_type="xgboost"`).
8. **Applies adjustments** — qualifying weight, recent-form weight, momentum bonus/penalty.
9. **Clamps position changes** to circuit-realistic bounds.
10. **Outputs** ranked predictions, podium, MAE, top-5 features.

### Per-race tuning

Each race script is ~15 lines and exposes its tuning via `RaceConfig`:

```python
# races/08_monaco.py
CONFIG = RaceConfig(
    round_number=8,
    race_name="Monaco Grand Prix",
    fastf1_name="Monaco",
    circuit_key="Monaco",
    lat=43.7347,
    lon=7.4206,
    quali_weight=0.80,            # Monaco: qualifying-dominant
    form_weight=0.20,
    max_positions_gained=3,
    max_positions_lost=5,
)
```

Tuning highlights:

| Round | Race | Quali / Form | Max gained / lost |
|-------|------|--------------|-------------------|
| 08 | Monaco | 0.80 / 0.20 | 3 / 5 |
| 18 | Singapore | 0.70 / 0.30 | 4 / 6 |
| 14 | Hungary | 0.65 / 0.35 | 5 / 8 |
| 16 | Italy (Monza) | 0.45 / 0.55 | 10 / 12 |
| Others | — | 0.50 / 0.50 | 8 / 12 |

Sprint weekends: rounds **2, 6, 13, 19, 21, 23**.
XGBoost flagship: round **21** (Brazil) — every other round uses GBM by default.

## Status

See [plan.md](plan.md) for the live project status — what's done, what's still pending, and what the next step is.

Current high-level state:

- ✅ Predictions pipeline works end-to-end for all 24 rounds
- ✅ Race-replay dashboard merged into the same repo, sharing `data/` and `requirements.txt`
- 🟡 The two halves don't talk to each other yet — no predictions exposed via the FastAPI backend, no Predictions tab in the React frontend
- ❌ No accuracy validation yet — MAE numbers from prediction runs are not directly comparable to actual race results

## License

MIT.

## Acknowledgments

- [FastF1](https://github.com/theOehrly/Fast-F1) — F1 telemetry / results API
- [Open-Meteo](https://open-meteo.com/) — free weather forecasts
- [scikit-learn](https://scikit-learn.org/) and [XGBoost](https://xgboost.readthedocs.io/)
- [F1 Race Replay](https://github.com/IAmTomShaw/f1-race-replay) by Tom Shaw — the upstream race-replay project absorbed into this repo
