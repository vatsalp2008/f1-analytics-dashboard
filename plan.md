# Project Status & Plan

## Where we are now

The pipeline runs cleanly end-to-end: every race script in [races/](races/) fetches real 2025 data via FastF1, pulls a live Open-Meteo forecast, trains a model, and produces a sensible podium with feature importances. The architecture is clean — 24 thin race configs feeding one shared [utils/predictor.py](utils/predictor.py) pipeline. **What we don't have yet is any measure of how accurate the predictions actually are.** Every claim about "best model" or "good weights" is currently based on smoke-test runs producing plausible-looking output, not on comparisons to actual race results.

**As of the latest merge, the project has absorbed the F1 Race Replay codebase** — a FastAPI + React + Vite dashboard that visualizes live telemetry + race replays. The two projects now share one root, one `data/`, one `requirements.txt`. The dashboard and predictions don't talk to each other *yet* — that's the next integration step.

### Merged project layout

```
f1-analytics-dashboard/
├── README.md, plan.md, requirements.txt
├── package.json, package-lock.json, node_modules/   ← from race-replay
├── .gitignore (merged), .gitattributes
│
├── backend/                    FastAPI replay/telemetry service (from race-replay)
│   ├── main.py                 API entry point
│   └── f1_service.py           telemetry processing
├── frontend/                   React + Vite SPA (from race-replay)
├── desktop/                    Legacy Arcade-based GUI replay
│   ├── main.py                 desktop entry point
│   └── src/                    desktop source
│
├── races/                      24 thin prediction CLI scripts (01–24)
├── utils/                      predictor + weather + season_metrics
├── models/                     experimental neural / vision demos
│
├── data/                       unified data
│   ├── cache/
│   │   ├── f1_cache/           predictions' FastF1 cache (parent)
│   │   └── fastf1-cache/       replay's FastF1 cache (from race-replay)
│   ├── computed_data/          pre-computed telemetry pickles (~300MB each)
│   ├── images/, resources/     UI assets
│
├── docs/                       all non-code documentation
│   ├── dashboard.md            replay project README
│   ├── roadmap.md
│   └── contributors.md
│
└── vision_output/              CV output (from predictions side)
```

---

## ✅ Done

### Phase 0 — Code-health fixes (9 bugs)

All 9 issues from the (now-deleted) `CHANGES.md` are resolved:

- **#1 Wet-feature leak** — `WetPerformanceFactor` was being fed to the model on dry days, biasing predictions toward rain specialists even when it wasn't raining. Fixed with a soft blend (`effective_wet = 1 + (factor - 1) * rain_probability`).
- **#2 Real-time weather** — replaced 5 scripts' worth of hardcoded constants + historical averages + dead OpenWeatherMap chain with [utils/weather.py](utils/weather.py) (single Open-Meteo helper, no API key, 16-day forecast window).
- **#3 Track-specialist consolidation** — 6 per-script hand-coded dicts (`albert_park_improvement`, `shanghai_circuit_factor`, etc.) consolidated into one `TRACK_SPECIALISTS` in [utils/season_metrics.py](utils/season_metrics.py). Fixed inconsistency where Antonelli was rated 1.00 (normal) at Shanghai but 1.03 (rookie) at Suzuka.
- **#4 `HighSpeedFactor`** removed from `3japan.py` — hand-coded per-team multiplier with no data behind it.
- **#5 `TireDegradation`** removed from `4bahrain.py` — same anti-pattern, also double-counted (feature + 25% prediction adjustment).
- **#6 `AvgPitStops`** removed from `4bahrain.py` — pit count is dominated by track + tire compound, not driver behavior; was mostly noise.
- **#7 `Consistency` + `Reliability` split** — old single feature treated DNFs (encoded as P19/P20) like deliberate poor finishes. Now `Consistency` filters DNFs out of the std calculation and a separate `Reliability` feature captures "% races finished."
- **#8 `DriverPrecision`** removed from `monaco.py` — was just a generic rookie hierarchy disguised as "Monaco precision," with values identical to the Suzuka rookie penalty.
- **#9 `MonacoSpecialist` triple-counting** — was used as a feature, a 10% prediction adjustment, *and* a sample-weight. Now used only as a feature.

### Phase 1 — Architecture refactor

- **24 thin race scripts** in [races/](races/), numbered `01_australia.py` through `24_abu_dhabi.py`. Each is ~15 lines: just a `RaceConfig` and a call to `run_prediction()`.
- **Shared [utils/predictor.py](utils/predictor.py)** owns the full pipeline: fetch prior races, compute metrics, get weather, fetch qualifying, train model, produce predictions.
- **Two more shared modules**: [utils/weather.py](utils/weather.py), [utils/season_metrics.py](utils/season_metrics.py).
- **Deleted**: `scripts/legacy/`, `scripts/venue_specific/`, `models/21brazilXGBoost.py`, `CHANGES.md`, and the 24-hour JSON aggregation cache (every run now re-aggregates from FastF1's own SQLite cache).
- **Updated** [README.md](README.md) to match the new structure.

### Phase 2 — Smoke tests passed

| Round | Script | Model | MAE | Podium |
|-------|--------|-------|-----|--------|
| 1 | [01_australia.py](races/01_australia.py) | GBM | 0.723s | NOR / LEC / RUS |
| 4 | [04_bahrain.py](races/04_bahrain.py) | GBM | 1.040s | VER / LEC / HAM |
| 19 | [19_usa.py](races/19_usa.py) | GBM | 1.226s | LEC / NOR / VER |
| 21 | [21_brazil.py](races/21_brazil.py) | **XGBoost** | **0.631s** | NOR / LEC / ANT |

The MAE numbers are *not* directly comparable across races — different training sets, different target distributions, partly-synthetic targets for rookies. They confirm the pipeline runs end-to-end; they don't tell us anything about real prediction quality.

---

## ❌ Not done — ranked by value

### 0. Wire predictions into the unified dashboard — **new top priority**

After the recent merge of the race-replay project, both halves share one root but don't talk to each other. To deliver "one dashboard with predictions + visualizations":

1. **Backend**: add `backend/predictions_service.py` that imports `utils.predictor.run_prediction` and exposes endpoints like `GET /api/predictions/{year}/{round}`. The existing `backend/main.py` (FastAPI) just needs to register the new routes.
2. **Frontend**: add a "Predictions" tab/view in `frontend/` alongside the existing Race Menu and Replay views. New React component fetches from the new backend endpoint and renders the predicted finishing order.
3. **Unify FastF1 caches**: predictions use `data/cache/f1_cache/`, replay uses `data/cache/fastf1-cache/`. Pick one canonical path and update both sides' code.
4. **Single launch story**: extend the existing `npm run dev` script so the backend boots with both replay *and* predictions endpoints. Maybe add `npm run predict <round>` to run a CLI prediction without booting the web stack.

No code yet — this is the "wire it together" step that turns the merged tree into a working unified dashboard.

### 1. Backtest against actual 2025 results — **highest value (predictions side)**

Loop over rounds 1–20 (already happened), run each prediction, compare predicted finishing order to actual results, score with something meaningful (Spearman correlation + top-3 hit rate + weighted position error). Until this exists, every other improvement below is guesswork. **This is the next thing to build.**

### 2. Replace hand-coded `TRACK_SPECIALISTS` with FastF1-derived values

Current dict has 90 hand-curated entries like `"Monaco": {"LEC": 0.95, ...}`. A driver's average finishing position over the last 2–3 seasons at each circuit is computable from FastF1 — that's real signal, not a guess. The backtest from #1 will probably show the hand-coded values are doing the wrong thing for at least some drivers.

### 3. Per-race model tuning

Only [21_brazil.py](races/21_brazil.py) uses XGBoost; everyone else defaults to GBM. After the backtest, we'll know which races actually benefit from XGBoost vs GBM (or possibly a simpler model). Right now this is set by tradition, not by evidence.

### 4. Training-target problem

Each race trains on its *own circuit's* previous-year lap times, with synthetic targets for rookies. That's a weak signal. Possible improvement: train on aggregated 2025 race data across all circuits and predict race *position* directly rather than lap time. Bigger refactor — only worth it if the backtest shows the current approach is clearly broken.

### 5. Experimental models in [models/](models/)

[neural_prediction.py](models/neural_prediction.py) (PyTorch FC net) and [vision_analysis.py](models/vision_analysis.py) (TF CNN over track-map images) are still standalone demos, not part of the main pipeline. Intentional — they're interesting as ML experiments but not as production predictors. Probably stay that way.

---

## 🟡 Known stale items after the merge

These are deliberate consequences of doing a structure-only merge — i.e. moving files without running anything. None block the next step (wiring predictions into the dashboard); all need addressing before the merged dashboard actually runs.

1. **Backend Python deps not installed.** The IDE flags `fastapi`, `uvicorn`, `arcade`, and `pyglet` as missing from the `f1env` virtualenv. They're listed in [requirements.txt](requirements.txt) but `pip install -r requirements.txt` was never re-run after the merge. Same for any backend-specific deps the FastAPI service quietly relies on.
2. **Backend imports survived the lift, but unverified.** [backend/main.py](backend/main.py) still imports from `backend.f1_service` — works because we lifted the whole `backend/` directory together, so the relative imports inside it are intact. No Python imports are *known* to be broken, but nothing was actually run to confirm.
3. **Frontend never re-installed.** The `frontend/` directory came over with its existing `node_modules/`, so it *should* still work. But `npm install` was not re-run after the move, and `package.json` paths (e.g. `proxy` settings, dev-server config in `vite.config.js`) haven't been re-checked for the new location. May or may not run cleanly on first `npm run dev`.

---

## 🟢 Recommended next step

**Wire predictions into the dashboard (#0).** The structural merge is done — both halves share one root, one `data/`, one `requirements.txt`. The next step is to actually make them talk to each other: a `backend/predictions_service.py` that calls into `utils/predictor.run_prediction`, and a Predictions tab in `frontend/` that hits it.

After that, **build the backtest (#1)** — until accuracy is measured, every other prediction-side improvement is guesswork.
