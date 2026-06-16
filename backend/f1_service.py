import os
from pathlib import Path

import fastf1
import fastf1.plotting
import numpy as np
import pandas as pd
import pickle
import gzip
from datetime import timedelta
from typing import Dict, List, Any

# FPS for the replay
FPS = 25
DT = 1 / FPS

# Shared FastF1 cache — same path the prediction pipeline uses
# (utils/predictor.py). Absolute so it doesn't depend on cwd when uvicorn
# is launched from arbitrary directories.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = PROJECT_ROOT / "data" / "cache" / "f1_cache"

def enable_cache():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE_DIR))

def get_tyre_compound_int(compound: str) -> int:
    mapping = {'SOFT': 1, 'MEDIUM': 2, 'HARD': 3, 'INTERMEDIATE': 4, 'WET': 5}
    return mapping.get(str(compound).upper(), 0)

def load_session(year: int, round_number: int, session_type: str = 'R'):
    enable_cache()
    session = fastf1.get_session(year, round_number, session_type)
    session.load(telemetry=True, weather=True)
    return session

def get_driver_colors(session):
    try:
        color_mapping = fastf1.plotting.get_driver_color_mapping(session)
        rgb_colors = {}
        for driver, hex_color in color_mapping.items():
            hex_color = str(hex_color).lstrip('#')
            if len(hex_color) >= 6:
                hex_color = hex_color[-6:]
                rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
                rgb_colors[driver] = f"rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"
            else:
                rgb_colors[driver] = "rgb(255, 255, 255)"
        return rgb_colors
    except Exception as e:
        print(f"Error getting driver colors: {e}")
        return {d: "rgb(255, 255, 255)" for d in session.drivers}

def get_race_telemetry_json(year: int, round_number: int, session_type: str = 'R'):
    enable_cache()

    # v2: drops drivers whose telemetry hasn't started / has ended (was previously
    # frozen at first/last recorded position by np.interp's default clamping).
    # v2: payload now includes country_code + date for the race header.
    # Old v1 cache files are left on disk but no longer read.
    processed_dir = os.path.join('.fastf1-cache', 'processed')
    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)

    cache_filename = f"{year}_{round_number}_{session_type}_v2_processed.pkl.gz"
    cache_path = os.path.join(processed_dir, cache_filename)
    
    if os.path.exists(cache_path):
        try:
            with gzip.open(cache_path, 'rb') as f:
                print(f"Loading processed cache from {cache_path}")
                return pickle.load(f)
        except Exception as e:
            print(f"Error loading processed cache: {e}")

    session = load_session(year, round_number, session_type)
    drivers = session.drivers
    driver_codes = {num: session.get_driver(num)["Abbreviation"] for num in drivers}

    driver_data = {}
    global_t_min, global_t_max, max_lap_number = None, None, 0

    for driver_no in drivers:
        code = driver_codes[driver_no]
        laps_driver = session.laps.pick_drivers(driver_no)
        if laps_driver.empty: continue
        max_lap_number = max(max_lap_number, int(laps_driver.LapNumber.max()))

        t_all, x_all, y_all, dist_all = [], [], [], []
        lap_all, tyre_all, speed_all, gear_all = [], [], [], []
        drs_all, throttle_all, brake_all = [], [], []

        for _, lap in laps_driver.iterlaps():
            tel = lap.get_telemetry()
            if tel.empty: continue
            t_all.append(tel["SessionTime"].dt.total_seconds().to_numpy())
            x_all.append(tel["X"].to_numpy())
            y_all.append(tel["Y"].to_numpy())
            dist_all.append(tel["Distance"].to_numpy())
            lap_all.append(np.full(len(tel), lap.LapNumber))
            tyre_all.append(np.full(len(tel), get_tyre_compound_int(lap.Compound)))
            speed_all.append(tel["Speed"].to_numpy())
            gear_all.append(tel["nGear"].to_numpy())
            drs_all.append(tel["DRS"].to_numpy())
            throttle_all.append(tel["Throttle"].to_numpy())
            brake_all.append(tel["Brake"].to_numpy())

        if not t_all: continue
        t_cat = np.concatenate(t_all)
        order = np.argsort(t_cat)
        driver_data[code] = {
            "t": t_cat[order], "x": np.concatenate(x_all)[order], "y": np.concatenate(y_all)[order],
            "dist": np.concatenate(dist_all)[order], "lap": np.concatenate(lap_all)[order],
            "tyre": np.concatenate(tyre_all)[order], "speed": np.concatenate(speed_all)[order],
            "gear": np.concatenate(gear_all)[order], "drs": np.concatenate(drs_all)[order],
            "throttle": np.concatenate(throttle_all)[order], "brake": np.concatenate(brake_all)[order],
        }
        global_t_min = min(global_t_min, driver_data[code]["t"].min()) if global_t_min is not None else driver_data[code]["t"].min()
        global_t_max = max(global_t_max, driver_data[code]["t"].max()) if global_t_max is not None else driver_data[code]["t"].max()

    if not driver_data: return None
    timeline = np.arange(global_t_min, global_t_max, DT) - global_t_min
    resampled_drivers = {}
    for code, data in driver_data.items():
        t_shifted = data["t"] - global_t_min
        # left=NaN / right=NaN so drivers whose telemetry hasn't started yet (or
        # has ended due to DNF/red-flag) don't get clamped to their first/last
        # recorded position — we'll drop them from the frame instead.
        resampled_drivers[code] = {
            "x": np.interp(timeline, t_shifted, data["x"], left=np.nan, right=np.nan),
            "y": np.interp(timeline, t_shifted, data["y"], left=np.nan, right=np.nan),
            "dist": np.interp(timeline, t_shifted, data["dist"], left=np.nan, right=np.nan),
            "lap": np.interp(timeline, t_shifted, data["lap"], left=np.nan, right=np.nan),
            "speed": np.interp(timeline, t_shifted, data["speed"]),
            "gear": np.interp(timeline, t_shifted, data["gear"]),
            "drs": np.interp(timeline, t_shifted, data["drs"]),
            "tyre": np.interp(timeline, t_shifted, data["tyre"]),
        }

    frames = []
    for i in range(len(timeline)):
        frame_drivers = {}
        for code, res in resampled_drivers.items():
            # Skip drivers who aren't on track at this moment (NaN position).
            if np.isnan(res["x"][i]) or np.isnan(res["y"][i]):
                continue
            frame_drivers[code] = {
                "x": float(res["x"][i]), "y": float(res["y"][i]), "dist": float(res["dist"][i]),
                "lap": int(res["lap"][i]), "speed": float(res["speed"][i]), "gear": int(res["gear"][i]),
                "drs": int(res["drs"][i]), "tyre": int(res["tyre"][i]),
            }
        sorted_drivers = sorted(frame_drivers.items(), key=lambda x: x[1]["dist"], reverse=True)
        for pos, (code, _) in enumerate(sorted_drivers):
            frame_drivers[code]["position"] = pos + 1
        frames.append({"t": float(round(timeline[i], 2)), "drivers": frame_drivers})

    track_map = []
    try:
        fastest_lap = session.laps.pick_fastest()
        if fastest_lap is not None:
            tel = fastest_lap.get_telemetry()
            track_map = [{"x": float(x), "y": float(y)} for x, y in zip(tel["X"].to_numpy(), tel["Y"].to_numpy())]
    except: pass

    event_name = session.event['EventName']
    ev_date = session.event.get('EventDate')
    date_str = ev_date.strftime("%Y-%m-%d") if pd.notna(ev_date) else None
    result = {
        "frames": frames, "driver_colors": get_driver_colors(session),
        "total_laps": int(max_lap_number),
        "event_name": event_name,
        "country_code": COUNTRY_CODES.get(event_name, ""),
        "date": date_str,
        "track_map": track_map
    }

    # Save to processed cache
    try:
        with gzip.open(cache_path, 'wb') as f:
            print(f"Saving processed data to {cache_path}")
            pickle.dump(result, f)
    except Exception as e:
        print(f"Error saving processed cache: {e}")

    return result

# ISO 3166-1 alpha-2 country codes by FastF1 EventName. Hardcoded since
# FastF1's `Country` column varies and would need its own name-to-ISO map.
# Used by the frontend to render a country flag emoji (regional indicators).
COUNTRY_CODES = {
    "Bahrain Grand Prix": "BH",
    "Saudi Arabian Grand Prix": "SA",
    "Australian Grand Prix": "AU",
    "Japanese Grand Prix": "JP",
    "Chinese Grand Prix": "CN",
    "Miami Grand Prix": "US",
    "Emilia Romagna Grand Prix": "IT",
    "Monaco Grand Prix": "MC",
    "Canadian Grand Prix": "CA",
    "Spanish Grand Prix": "ES",
    "Austrian Grand Prix": "AT",
    "British Grand Prix": "GB",
    "Hungarian Grand Prix": "HU",
    "Belgian Grand Prix": "BE",
    "Dutch Grand Prix": "NL",
    "Italian Grand Prix": "IT",
    "Azerbaijan Grand Prix": "AZ",
    "Singapore Grand Prix": "SG",
    "United States Grand Prix": "US",
    "Mexico City Grand Prix": "MX",
    "São Paulo Grand Prix": "BR",
    "Las Vegas Grand Prix": "US",
    "Qatar Grand Prix": "QA",
    "Abu Dhabi Grand Prix": "AE",
}


def get_events(year: int):
    events = fastf1.get_event_schedule(year)
    result = []
    for _, event in events.iterrows():
        if event['EventFormat'] == 'testing': continue
        name = event['EventName']
        # EventDate is the Sunday race date as a pandas Timestamp; emit ISO yyyy-mm-dd.
        ev_date = event.get('EventDate')
        date_str = ev_date.strftime("%Y-%m-%d") if pd.notna(ev_date) else None
        result.append({
            "round": int(event['RoundNumber']),
            "name": name,
            "location": event['Location'],
            "country_code": COUNTRY_CODES.get(name, ""),
            "date": date_str,
            "has_sprint": event['EventFormat'] in ['sprint', 'sprint_qualifying', 'sprint_shootout']
        })
    return result
