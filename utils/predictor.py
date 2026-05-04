"""Shared race-prediction pipeline. Each race file builds a RaceConfig and calls run_prediction."""
from dataclasses import dataclass
from datetime import datetime
import json
from pathlib import Path
from typing import Optional

import fastf1
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from .weather import fetch_race_day_weather
from .season_metrics import TRACK_SPECIALISTS, calculate_consistency_and_reliability


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = PROJECT_ROOT / "data" / "cache" / "f1_cache"
SEASON_CACHE = PROJECT_ROOT / "data" / "f1_2025_season_cache.json"

POINTS = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
SPRINT_POINTS = {1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}
DNF_DSQ_POSITIONS = {19, 20}


@dataclass
class RaceConfig:
    """Per-race configuration. Defaults match a typical permanent-circuit GP."""
    round_number: int            # 1-24
    race_name: str               # display name e.g. "Australian Grand Prix"
    fastf1_name: str             # what fastf1.get_session expects, e.g. "Australia"
    lat: float
    lon: float
    circuit_key: str = ""        # key into TRACK_SPECIALISTS; "" if no entry yet
    has_sprint: bool = False
    quali_weight: float = 0.50   # weight on qualifying-position adjustment
    form_weight: float = 0.50    # weight on recent-form adjustment
    max_positions_gained: int = 8
    max_positions_lost: int = 12
    model_type: str = "gbm"      # "gbm" or "xgboost"
    historical_year: int = 2024  # year for sector-time training data


# ─── FastF1 cache ──────────────────────────────────────────────────────────────

def _enable_fastf1_cache():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE_DIR))


# ─── Data fetching ─────────────────────────────────────────────────────────────

def fetch_completed_races(up_to_round: int) -> dict:
    """Fetch 2025 races from round 1 to (up_to_round - 1).

    Uses 24h JSON cache. Refetches if cache is stale OR doesn't cover enough rounds.
    """
    if SEASON_CACHE.exists():
        with SEASON_CACHE.open() as f:
            cache = json.load(f)
        is_fresh = (datetime.now().timestamp() - SEASON_CACHE.stat().st_mtime) < 86400
        is_complete = len(cache.get("season_results", {})) >= (up_to_round - 1)
        if is_fresh and is_complete:
            print("📂 Using cached season data (<24h old, complete)")
            return cache

    if up_to_round <= 1:
        # Round 1: nothing to fetch
        return {"season_results": {}, "sprint_results": {}, "driver_standings": {}, "fetch_time": datetime.now().isoformat()}

    print(f"🔄 Fetching races 1..{up_to_round - 1}")
    season_results = {}
    sprint_results = {}

    for race_num in range(1, up_to_round):
        try:
            session = fastf1.get_session(2025, race_num, "R")
            session.load()
            race_name = session.event.EventName.replace(" Grand Prix", "")
            results = {}
            for _, driver in session.results.iterrows():
                if pd.isna(driver.get("Abbreviation")):
                    continue
                pos = driver.get("Position")
                if pd.isna(pos) or pos == "":
                    pos = 20 if "Disqualified" in str(driver.get("Status", "")) else 19
                results[driver["Abbreviation"]] = int(pos)
            season_results[race_name] = results
            print(f"  ✅ R{race_num}: {race_name}")

            try:
                sprint = fastf1.get_session(2025, race_num, "Sprint")
                sprint.load()
                s_results = {}
                for _, d in sprint.results.iterrows():
                    if pd.notna(d.get("Abbreviation")) and pd.notna(d.get("Position")):
                        s_results[d["Abbreviation"]] = int(d["Position"])
                if s_results:
                    sprint_results[f"{race_name}_Sprint"] = s_results
                    print(f"     🏃 Sprint included")
            except Exception:
                pass
        except Exception as exc:
            print(f"  ⚠️ R{race_num}: {str(exc)[:60]}")

    standings = {}
    for results in season_results.values():
        for d, p in results.items():
            standings[d] = standings.get(d, 0) + POINTS.get(p, 0)
    for results in sprint_results.values():
        for d, p in results.items():
            standings[d] = standings.get(d, 0) + SPRINT_POINTS.get(p, 0)

    cache = {
        "season_results": season_results,
        "sprint_results": sprint_results,
        "driver_standings": standings,
        "fetch_time": datetime.now().isoformat(),
    }
    SEASON_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with SEASON_CACHE.open("w") as f:
        json.dump(cache, f, indent=2)
    print(f"✅ Cached {len(season_results)} races + {len(sprint_results)} sprints")
    return cache


def fetch_qualifying(config: RaceConfig) -> Optional[pd.DataFrame]:
    """Pull actual qualifying via FastF1. Returns None if unavailable."""
    try:
        session = fastf1.get_session(2025, config.round_number, "Q")
        session.load()
        rows = []
        for _, r in session.results.iterrows():
            if pd.isna(r.get("Abbreviation")):
                continue
            t = None
            for col in ("Q3", "Q2", "Q1"):
                v = r.get(col)
                if pd.notna(v):
                    t = v.total_seconds()
                    break
            rows.append({
                "Driver": r["Abbreviation"],
                "DriverFullName": r.get("FullName", r["Abbreviation"]),
                "QualifyingTime": t,
                "QualifyingPosition": int(r["Position"]) if pd.notna(r.get("Position")) else len(rows) + 1,
            })
        if not rows:
            return None
        df = pd.DataFrame(rows).sort_values("QualifyingPosition").reset_index(drop=True)
        print(f"  ✅ Qualifying: {len(df)} drivers")
        return df
    except Exception as exc:
        print(f"  ⚠️ Qualifying fetch failed: {str(exc)[:60]}")
        return None


def fetch_sprint_for_round(config: RaceConfig) -> dict:
    """Pull this round's sprint result if applicable."""
    if not config.has_sprint:
        return {}
    try:
        sprint = fastf1.get_session(2025, config.round_number, "Sprint")
        sprint.load()
        results = {}
        for _, d in sprint.results.iterrows():
            if pd.notna(d.get("Abbreviation")) and pd.notna(d.get("Position")):
                results[d["Abbreviation"]] = int(d["Position"])
        return results
    except Exception:
        return {}


def fetch_historical_lap_times(config: RaceConfig) -> Optional[pd.Series]:
    """Average lap times per driver from a previous-year race at this circuit.

    Used as the regression target when training the per-race model.
    """
    try:
        session = fastf1.get_session(config.historical_year, config.fastf1_name, "R")
        session.load()
        laps = session.laps[["Driver", "LapTime"]].copy().dropna()
        if laps.empty:
            return None
        laps["LapTime_s"] = laps["LapTime"].dt.total_seconds()
        return laps.groupby("Driver")["LapTime_s"].mean()
    except Exception as exc:
        print(f"  ⚠️ {config.historical_year} historical fetch failed: {str(exc)[:50]}")
        return None


# ─── Metrics ───────────────────────────────────────────────────────────────────

def compute_season_metrics(season_results: dict, sprint_results: dict) -> dict:
    """Compute season_average / recent_form / sprint_average / momentum / consistency / reliability."""
    if not season_results:
        return {k: {} for k in (
            "season_average", "recent_form", "sprint_average",
            "momentum", "consistency", "reliability",
        )}

    driver_positions = {}
    for results in season_results.values():
        for d, p in results.items():
            driver_positions.setdefault(d, []).append(p)
    season_average = {d: float(np.mean(p)) for d, p in driver_positions.items()}

    races = list(season_results.keys())
    recent = races[-5:]
    weights = np.exp(np.linspace(0, 1, len(recent)))
    weights /= weights.sum()

    recent_form = {}
    for d in set().union(*(set(season_results[r].keys()) for r in recent)):
        positions, w = [], []
        for i, r in enumerate(recent):
            if d in season_results[r]:
                positions.append(season_results[r][d])
                w.append(weights[i])
        if positions:
            recent_form[d] = 21 - float(np.average(positions, weights=w))

    sprint_perf = {}
    for results in sprint_results.values():
        for d, p in results.items():
            sprint_perf.setdefault(d, []).append(p)
    sprint_average = {d: float(np.mean(p)) for d, p in sprint_perf.items()}

    last_6 = races[-6:]
    momentum = {}
    for d in set().union(*(set(season_results[r].keys()) for r in last_6)):
        positions = [season_results[r][d] for r in last_6 if d in season_results[r]]
        if len(positions) >= 3:
            x = np.arange(len(positions))
            momentum[d] = float(-np.polyfit(x, positions, 1)[0] * 3)
        else:
            momentum[d] = 0.0

    consistency, reliability = calculate_consistency_and_reliability(season_results)

    return {
        "season_average": season_average,
        "recent_form": recent_form,
        "sprint_average": sprint_average,
        "momentum": momentum,
        "consistency": consistency,
        "reliability": reliability,
    }


# ─── Main pipeline ─────────────────────────────────────────────────────────────

def run_prediction(config: RaceConfig):
    print(f"\n🏁 2025 {config.race_name.upper()} 🏁")
    print("=" * 70)
    print(f"Round {config.round_number} of 24" + ("  🏃 Sprint weekend" if config.has_sprint else ""))
    print("=" * 70)

    _enable_fastf1_cache()

    print("\n📡 Loading 2025 season data...")
    season_data = fetch_completed_races(config.round_number)
    season_results = season_data["season_results"]
    sprint_results = season_data["sprint_results"]
    standings = season_data["driver_standings"]

    print("\n📊 Computing season metrics...")
    metrics = compute_season_metrics(season_results, sprint_results)
    if standings:
        leader, pts = max(standings.items(), key=lambda x: x[1])
        print(f"  Championship leader: {leader} ({pts} pts)")

    print("\n🌤️ Fetching weather forecast...")
    weather = fetch_race_day_weather(lat=config.lat, lon=config.lon)
    print(f"  Temperature: {weather['temperature']:.1f}°C  |  Rain: {weather['rain_probability']*100:.0f}%")

    print("\n🏎️ Fetching qualifying...")
    qualifying = fetch_qualifying(config)
    if qualifying is None or qualifying.empty:
        print("⚠️ No qualifying available — cannot run prediction.")
        return None

    sprint_pos = fetch_sprint_for_round(config)
    if sprint_pos:
        print(f"  ✅ Sprint: {len(sprint_pos)} drivers")

    print(f"\n📚 Loading {config.historical_year} {config.fastf1_name} for training target...")
    historical_laps = fetch_historical_lap_times(config)

    # ── Feature engineering ─────────────────────────────────────────────────
    specialists = TRACK_SPECIALISTS.get(config.circuit_key, {})

    qualifying["SeasonAverage"] = qualifying["Driver"].map(metrics["season_average"]).fillna(15)
    qualifying["RecentForm"] = qualifying["Driver"].map(metrics["recent_form"]).fillna(10)
    qualifying["SprintAverage"] = qualifying["Driver"].map(metrics["sprint_average"]).fillna(15)
    qualifying["SprintPosition"] = qualifying["Driver"].map(sprint_pos).fillna(20)
    qualifying["Momentum"] = qualifying["Driver"].map(metrics["momentum"]).fillna(0)
    qualifying["Consistency"] = qualifying["Driver"].map(metrics["consistency"]).fillna(0.5)
    qualifying["Reliability"] = qualifying["Driver"].map(metrics["reliability"]).fillna(0.5)
    qualifying["ChampionshipPoints"] = qualifying["Driver"].map(standings).fillna(0)
    qualifying["CircuitSpecialist"] = qualifying["Driver"].map(specialists).fillna(1.0)
    qualifying["RainProbability"] = weather["rain_probability"]
    qualifying["Temperature"] = weather["temperature"] / 30
    qualifying["Humidity"] = weather["humidity"] / 100
    qualifying["WindSpeed"] = weather["wind_speed"] / 10
    qualifying["StartingPositionAdvantage"] = 1 / (qualifying["QualifyingPosition"] ** 0.5)

    feature_columns = [
        "QualifyingTime", "QualifyingPosition",
        "SeasonAverage", "RecentForm", "SprintAverage", "SprintPosition",
        "Momentum", "Consistency", "Reliability",
        "ChampionshipPoints", "CircuitSpecialist", "StartingPositionAdvantage",
        "RainProbability", "Temperature", "Humidity", "WindSpeed",
    ]
    X = qualifying[feature_columns].copy()

    # Training target — historical lap times if available, else synthetic from qualifying
    if historical_laps is not None and not historical_laps.empty:
        median_lap = float(historical_laps.median())
        y = pd.Series(
            [historical_laps.get(d, median_lap + (qp - 1) * 0.15)
             for d, qp in zip(qualifying["Driver"], qualifying["QualifyingPosition"])],
            index=qualifying.index,
        )
    else:
        valid_q = qualifying["QualifyingTime"].dropna()
        base = float(valid_q.median()) if not valid_q.empty else 90.0
        y = pd.Series(
            [base + (qp - 1) * 0.15 for qp in qualifying["QualifyingPosition"]],
            index=qualifying.index,
        )

    imputer = SimpleImputer(strategy="median")
    X_imputed = imputer.fit_transform(X)

    if len(X_imputed) >= 4:
        X_train, X_test, y_train, y_test = train_test_split(X_imputed, y, test_size=0.25, random_state=42)
    else:
        X_train, X_test, y_train, y_test = X_imputed, X_imputed, y, y

    if config.model_type == "xgboost":
        try:
            import xgboost as xgb
            model = xgb.XGBRegressor(
                n_estimators=300, max_depth=4, learning_rate=0.04,
                subsample=0.75, colsample_bytree=0.75,
                reg_alpha=0.1, reg_lambda=1.0,
                random_state=42, n_jobs=-1, verbosity=0,
            )
        except ImportError:
            print("  ⚠️ XGBoost unavailable, using GBM")
            model = GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.04, random_state=42)
    else:
        model = GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.04, random_state=42)

    model.fit(X_train, y_train)
    qualifying["PredictedRaceTime"] = model.predict(X_imputed)

    # ── Per-race adjustments ────────────────────────────────────────────────
    for idx, row in qualifying.iterrows():
        base_time = qualifying.loc[idx, "PredictedRaceTime"]
        quali_adj = (row["QualifyingPosition"] - 10) * 0.15 * config.quali_weight
        form_adj = (10 - row["RecentForm"]) * 0.08 * config.form_weight
        qualifying.loc[idx, "PredictedRaceTime"] = base_time + quali_adj + form_adj
        if row["Momentum"] > 3:
            qualifying.loc[idx, "PredictedRaceTime"] *= 0.995
        elif row["Momentum"] < -3:
            qualifying.loc[idx, "PredictedRaceTime"] *= 1.005

    final = qualifying.sort_values("PredictedRaceTime").reset_index(drop=True)
    for i, row in final.iterrows():
        change = row["QualifyingPosition"] - (i + 1)
        if change > config.max_positions_gained:
            final.loc[i, "PredictedRaceTime"] += (change - config.max_positions_gained) * 0.3
        elif change < -config.max_positions_lost:
            final.loc[i, "PredictedRaceTime"] -= (abs(change) - config.max_positions_lost) * 0.3
    final = final.sort_values("PredictedRaceTime").reset_index(drop=True)

    # ── Output ──────────────────────────────────────────────────────────────
    print("\n📋 PREDICTED RACE ORDER:")
    print("-" * 80)
    print(f"{'Pos':<4} {'Driver':<8} {'Name':<22} {'Grid':<6} {'Δ':<5} {'Form':>6}")
    for i in range(min(20, len(final))):
        r = final.iloc[i]
        change = int(r["QualifyingPosition"] - (i + 1))
        sym = f"↑{change}" if change > 0 else f"↓{abs(change)}" if change < 0 else "→"
        name = str(r.get("DriverFullName", ""))[:20]
        print(f"P{i+1:<3} {r['Driver']:<8} {name:<22} P{int(r['QualifyingPosition']):<5} {sym:<5} {r['RecentForm']:6.1f}")

    if len(final) >= 3:
        print("\n🏆 PREDICTED PODIUM:")
        for medal, i in zip(("🥇", "🥈", "🥉"), range(3)):
            r = final.iloc[i]
            print(f"  {medal} {r['Driver']:<5} {r.get('DriverFullName', '')}")

    if len(X_test) > 0:
        mae = mean_absolute_error(y_test, model.predict(X_test))
        print(f"\n📊 Model MAE: {mae:.3f}s  ({config.model_type.upper()}, {len(feature_columns)} features)")

    importance = pd.DataFrame({
        "Feature": feature_columns,
        "Importance": model.feature_importances_,
    }).sort_values("Importance", ascending=False)
    print("\n📈 Top 5 features:")
    for _, row in importance.head(5).iterrows():
        print(f"  {row['Feature']:<28} {row['Importance']:.3f}")

    print("\n" + "=" * 70)
    print(f"✅ {config.race_name.upper()} PREDICTION COMPLETE")
    print("=" * 70)
    return final
