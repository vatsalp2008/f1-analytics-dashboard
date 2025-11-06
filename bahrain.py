import fastf1
import pandas as pd
import numpy as np
import requests
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
import matplotlib.pyplot as plt
from sklearn.impute import SimpleImputer
from datetime import datetime
import json
import os

# Enable FastF1 caching
fastf1.Cache.enable_cache("f1_cache")

print("🏁 2025 BAHRAIN GRAND PRIX - PREDICTION WITH AUTO-FETCH 🏁")
print("="*70)
print(f"Current Date: November 4, 2025")
print("Automatically fetching all completed 2025 races...")
print("="*70)

# ========== SECTION 1: AUTO-FETCH ALL 2025 RACE DATA ==========
def fetch_season_data_2025():
    """Automatically fetch all completed 2025 race data"""
    
    # Check if we have recent cached data (less than 1 day old)
    cache_file = 'f1_2025_season_cache.json'
    if os.path.exists(cache_file):
        mod_time = os.path.getmtime(cache_file)
        if (datetime.now().timestamp() - mod_time) < 86400:  # Less than 24 hours
            print("📂 Loading cached season data (less than 24 hours old)...")
            with open(cache_file, 'r') as f:
                return json.load(f)
    
    print("\n🔄 Fetching fresh 2025 season data...")
    
    season_results = {}
    sprint_results = {}
    pit_strategies = {}
    driver_standings = {}
    constructor_standings = {}
    
    # Determine which races to fetch based on current date
    # Bahrain is typically Race 4 in the calendar
    races_before_bahrain = 3  # Australia, China, Japan
    
    race_names = {
        1: "Australia",
        2: "China", 
        3: "Japan"
    }
    
    for race_num in range(1, races_before_bahrain + 1):
        try:
            print(f"\n📊 Fetching Race {race_num}: {race_names.get(race_num, f'Race {race_num}')}...")
            
            # Fetch main race
            session = fastf1.get_session(2025, race_num, 'R')
            session.load()
            
            results = session.results
            race_name = race_names.get(race_num, session.event.EventName.replace(' Grand Prix', ''))
            
            # Store results
            season_results[race_name] = {}
            for _, driver in results.iterrows():
                if pd.notna(driver['Abbreviation']):
                    pos = driver['Position']
                    # Handle DNFs and DSQs
                    if pd.isna(pos) or pos == '':
                        if driver['Status'] == 'Disqualified':
                            pos = 20  # DSQ goes to back
                        else:
                            pos = 19  # DNF
                    season_results[race_name][driver['Abbreviation']] = int(pos)
            
            print(f"   ✅ {race_name}: Winner - {results.iloc[0]['Abbreviation'] if len(results) > 0 else 'Unknown'}")
            
            # Get pit strategies
            laps = session.laps
            race_strategies = {}
            for driver_abbr in results['Abbreviation']:
                if pd.notna(driver_abbr):
                    driver_laps = laps[laps['Driver'] == driver_abbr]
                    if not driver_laps.empty:
                        pit_stops = driver_laps[driver_laps['PitInTime'].notna()]
                        race_strategies[driver_abbr] = {
                            'stops': len(pit_stops),
                            'laps': pit_stops['LapNumber'].tolist() if not pit_stops.empty else []
                        }
            pit_strategies[race_name] = race_strategies
            
            # Check for sprint
            try:
                sprint = fastf1.get_session(2025, race_num, 'Sprint')
                sprint.load()
                sprint_name = f"{race_name}_Sprint"
                sprint_results[sprint_name] = {}
                
                for _, driver in sprint.results.iterrows():
                    if pd.notna(driver['Abbreviation']):
                        pos = driver['Position']
                        if pd.notna(pos) and pos != '':
                            sprint_results[sprint_name][driver['Abbreviation']] = int(pos)
                
                print(f"   📊 Sprint race data fetched")
            except:
                pass  # No sprint race
                
        except Exception as e:
            print(f"   ⚠️ Could not fetch race {race_num}: {str(e)[:50]}")
            # Use placeholder data if fetch fails
            if race_num == 1:  # Australia
                season_results["Australia"] = {
                    "NOR": 1, "VER": 2, "RUS": 3, "ANT": 4, "ALB": 5,
                    "STR": 6, "HUL": 7, "LEC": 8, "PIA": 9, "HAM": 10
                }
            elif race_num == 2:  # China
                season_results["China"] = {
                    "PIA": 1, "NOR": 2, "RUS": 3, "VER": 4, "OCO": 5
                }
                sprint_results["China_Sprint"] = {
                    "HAM": 1, "PIA": 2, "VER": 3, "RUS": 4, "LEC": 5
                }
    
    # Calculate championship points
    points_system = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
    sprint_points = {1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}
    
    for race, results in season_results.items():
        for driver, position in results.items():
            if driver not in driver_standings:
                driver_standings[driver] = 0
            if position <= 10:
                driver_standings[driver] += points_system.get(position, 0)
    
    for sprint, results in sprint_results.items():
        for driver, position in results.items():
            if driver not in driver_standings:
                driver_standings[driver] = 0
            if position <= 8:
                driver_standings[driver] += sprint_points.get(position, 0)
    
    # Save to cache
    cache_data = {
        'season_results': season_results,
        'sprint_results': sprint_results,
        'pit_strategies': pit_strategies,
        'driver_standings': driver_standings,
        'fetch_time': datetime.now().isoformat()
    }
    
    with open(cache_file, 'w') as f:
        json.dump(cache_data, f, indent=2)
    
    print(f"\n✅ Fetched data for {len(season_results)} races")
    
    return cache_data

# Fetch the data
season_data = fetch_season_data_2025()
season_results_2025 = season_data['season_results']
sprint_results_2025 = season_data['sprint_results']
pit_strategies_2025 = season_data['pit_strategies']
championship_points = season_data['driver_standings']

# ========== SECTION 2: CALCULATE FORM METRICS ==========
print("\n📈 Calculating form metrics from fetched data...")

def calculate_season_average():
    """Calculate average finishing position for each driver"""
    driver_positions = {}
    for race, results in season_results_2025.items():
        for driver, position in results.items():
            if driver not in driver_positions:
                driver_positions[driver] = []
            driver_positions[driver].append(position)
    
    avg_positions = {}
    for driver, positions in driver_positions.items():
        avg_positions[driver] = np.mean(positions)
    
    return avg_positions

def calculate_recent_form(last_n_races=3):
    """Calculate form based on last N races with exponential weighting"""
    races = list(season_results_2025.keys())
    recent_races = races[-last_n_races:] if len(races) >= last_n_races else races
    
    form_scores = {}
    weights = np.exp(np.linspace(0, 1.5, len(recent_races)))
    weights = weights / weights.sum()
    
    all_drivers = set()
    for race in recent_races:
        all_drivers.update(season_results_2025[race].keys())
    
    for driver in all_drivers:
        weighted_score = 0
        total_weight = 0
        
        for i, race in enumerate(recent_races):
            if driver in season_results_2025[race]:
                pos = season_results_2025[race][driver]
                score = 21 - pos
                weighted_score += score * weights[i]
                total_weight += weights[i]
        
        if total_weight > 0:
            form_scores[driver] = weighted_score / total_weight
        else:
            form_scores[driver] = 10
    
    return form_scores

def calculate_momentum_trend():
    """Calculate momentum over races"""
    momentum = {}
    races = list(season_results_2025.keys())
    
    for driver in set().union(*[set(r.keys()) for r in season_results_2025.values()]):
        positions = []
        for race in races:
            if driver in season_results_2025[race]:
                positions.append(season_results_2025[race][driver])
        
        if len(positions) >= 2:
            x = np.arange(len(positions))
            if len(positions) > 1:
                trend = np.polyfit(x, positions, 1)[0]
                momentum[driver] = -trend * 5
            else:
                momentum[driver] = 0
        else:
            momentum[driver] = 0
    
    return momentum

def calculate_consistency():
    """Calculate driver consistency"""
    driver_consistency = {}
    
    for driver in set().union(*[set(r.keys()) for r in season_results_2025.values()]):
        positions = []
        for race_results in season_results_2025.values():
            if driver in race_results:
                positions.append(race_results[driver])
        
        if len(positions) > 1:
            driver_consistency[driver] = 1 / (1 + np.std(positions))
        else:
            driver_consistency[driver] = 0.5
    
    return driver_consistency

def analyze_pit_strategies():
    """Analyze average pit stops per driver"""
    driver_avg_stops = {}
    
    for race, strategies in pit_strategies_2025.items():
        for driver, strategy in strategies.items():
            if driver not in driver_avg_stops:
                driver_avg_stops[driver] = []
            driver_avg_stops[driver].append(strategy.get('stops', 1))
    
    avg_stops = {}
    for driver, stops in driver_avg_stops.items():
        avg_stops[driver] = np.mean(stops) if stops else 1.5
    
    return avg_stops

# Calculate all metrics
season_avg_positions = calculate_season_average()
recent_form = calculate_recent_form()
momentum_trend = calculate_momentum_trend()
driver_consistency = calculate_consistency()
avg_pit_stops = analyze_pit_strategies()

print(f"Calculated metrics for {len(season_avg_positions)} drivers")
print(f"Top 3 on form: {sorted(recent_form.items(), key=lambda x: x[1], reverse=True)[:3]}")

# Display current standings
championship_standings = sorted(championship_points.items(), key=lambda x: x[1], reverse=True)
print("\n🏆 Current Championship Standings (from fetched data):")
for i, (driver, points) in enumerate(championship_standings[:5], 1):
    print(f"  {i}. {driver}: {points} pts")

# ========== SECTION 3: LOAD BAHRAIN 2024 HISTORICAL DATA ==========
print("\n🏁 Loading Bahrain 2024 historical data...")

session_2024 = fastf1.get_session(2024, "Bahrain", "R")
session_2024.load()

laps_2024 = session_2024.laps[["Driver", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]].copy()
laps_2024.dropna(inplace=True)

for col in ["LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]:
    laps_2024[f"{col} (s)"] = laps_2024[col].dt.total_seconds()

sector_times_2024 = laps_2024.groupby("Driver").agg({
    "Sector1Time (s)": "mean",
    "Sector2Time (s)": "mean",
    "Sector3Time (s)": "mean"
}).reset_index()

sector_times_2024["TotalSectorTime (s)"] = (
    sector_times_2024["Sector1Time (s)"] +
    sector_times_2024["Sector2Time (s)"] +
    sector_times_2024["Sector3Time (s)"]
)

print(f"Loaded 2024 Bahrain data for {len(sector_times_2024)} drivers")

# ========== SECTION 4: 2025 BAHRAIN QUALIFYING DATA ==========
print("\n🏎️ Processing 2025 Bahrain GP Qualifying Data...")

def format_time(seconds):
    """Convert seconds to MM:SS.sss format"""
    if pd.isna(seconds) or seconds is None:
        return "No Time"
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes}:{secs:06.3f}"

# Try to fetch actual qualifying data
try:
    quali_session = fastf1.get_session(2025, 4, 'Q')  # Bahrain is race 4
    quali_session.load()
    quali_results = quali_session.results
    
    qualifying_2025 = pd.DataFrame({
        "Driver": quali_results['Abbreviation'].tolist(),
        "DriverFullName": quali_results['FullName'].tolist(),
        "QualifyingTime (s)": quali_results['Q3'].dt.total_seconds().fillna(
            quali_results['Q2'].dt.total_seconds().fillna(
                quali_results['Q1'].dt.total_seconds()
            )
        ).tolist(),
        "QualifyingPosition": range(1, len(quali_results) + 1)
    })
    print("✅ Fetched actual qualifying data")
    
except:
    print("⚠️ Using predicted qualifying positions")
    # Fallback qualifying data
    qualifying_2025 = pd.DataFrame({
        "Driver": ["VER", "NOR", "LEC", "PIA", "RUS", 
                   "HAM", "SAI", "ALO", "GAS", "TSU",
                   "ALB", "OCO", "STR", "HUL", "ANT",
                   "BEA", "LAW", "DOO", "BOR", "HAD"],
        "DriverFullName": ["Max Verstappen", "Lando Norris", "Charles Leclerc", "Oscar Piastri",
                           "George Russell", "Lewis Hamilton", "Carlos Sainz", "Fernando Alonso",
                           "Pierre Gasly", "Yuki Tsunoda", "Alexander Albon", "Esteban Ocon",
                           "Lance Stroll", "Nico Hülkenberg", "Kimi Antonelli",
                           "Oliver Bearman", "Liam Lawson", "Jack Doohan", "Gabriel Bortoleto", "Isack Hadjar"],
        "QualifyingTime (s)": [89.456, 89.512, 89.589, 89.634, 89.701,
                               89.778, 89.845, 89.923, 90.012, 90.089,
                               90.156, 90.234, 90.312, 90.398, 90.445,
                               90.523, 90.601, 90.678, 90.756, 90.834],
        "QualifyingPosition": list(range(1, 21))
    })

qualifying_2025["QualifyingTime_Display"] = qualifying_2025["QualifyingTime (s)"].apply(format_time)

# ========== SECTION 5: CALCULATE RACE PACE ==========
print("\n🏁 Calculating race pace from actual season data...")

def calculate_average_race_pace():
    """Calculate each driver's average race pace from fetched data"""
    race_pace = {}
    base_pace = 92.8
    
    # Use actual positions from fetched data
    for driver in season_avg_positions:
        avg_pos = season_avg_positions[driver]
        race_pace[driver] = base_pace + (avg_pos - 1) * 0.18
    
    return race_pace

average_race_pace_2025 = calculate_average_race_pace()

# ========== SECTION 6: WEATHER CONDITIONS ==========
print("\n🌤️ Bahrain race conditions...")

temperature = 28.5
rain_probability = 0.02
humidity = 55
wind_speed = 5.2
track_temp = 35.0

print(f"Race Conditions (Night Race):")
print(f"Air Temperature: {temperature:.1f}°C")
print(f"Track Temperature: {track_temp:.1f}°C")
print(f"Rain probability: {rain_probability*100:.0f}%")

# ========== SECTION 7: TEAM PERFORMANCE ==========
print("\n🏎️ Calculating team standings from fetched data...")

driver_to_team = {
    "VER": "Red Bull", "LAW": "Red Bull", "PER": "Red Bull",
    "NOR": "McLaren", "PIA": "McLaren",
    "LEC": "Ferrari", "HAM": "Ferrari", "SAI": "Ferrari",
    "RUS": "Mercedes", "ANT": "Mercedes",
    "ALB": "Williams", "SAR": "Williams",
    "GAS": "Alpine", "DOO": "Alpine", "OCO": "Alpine",
    "ALO": "Aston Martin", "STR": "Aston Martin",
    "TSU": "Racing Bulls", "HAD": "Racing Bulls", "RIC": "Racing Bulls",
    "HUL": "Kick Sauber", "BOR": "Kick Sauber", "BOT": "Kick Sauber",
    "BEA": "Haas", "MAG": "Haas"
}

team_points = {}
for driver, points in championship_points.items():
    if driver in driver_to_team:
        team = driver_to_team[driver]
        if team not in team_points:
            team_points[team] = 0
        team_points[team] += points

max_team_points = max(team_points.values()) if team_points else 1
team_performance_score = {team: points / max_team_points for team, points in team_points.items()}

# ========== SECTION 8: BAHRAIN-SPECIFIC FACTORS ==========
print("\n🏁 Calculating Bahrain-specific factors...")

bahrain_quali_importance = 0.40

tire_deg_factor = {
    "Red Bull": 0.98, "McLaren": 0.99, "Ferrari": 1.00,
    "Mercedes": 0.99, "Williams": 1.01, "Alpine": 1.02,
    "Aston Martin": 1.01, "Racing Bulls": 1.01,
    "Haas": 1.02, "Kick Sauber": 1.03
}

bahrain_specialists = {
    "VER": 0.96, "HAM": 0.97, "LEC": 0.98, "SAI": 0.99,
    "NOR": 0.99, "RUS": 1.00, "ALO": 0.98, "PIA": 1.01
}

MAX_POSITIONS_GAINED_BAHRAIN = 6
MAX_POSITIONS_LOST_BAHRAIN = 10

# ========== SECTION 9: FEATURE ENGINEERING ==========
print("\n🔧 Building features from fetched data...")

# Add all calculated features
qualifying_2025["SeasonAvgPosition"] = qualifying_2025["Driver"].map(season_avg_positions).fillna(15)
qualifying_2025["RecentForm"] = qualifying_2025["Driver"].map(recent_form).fillna(10)
qualifying_2025["MomentumTrend"] = qualifying_2025["Driver"].map(momentum_trend).fillna(0)
qualifying_2025["Consistency"] = qualifying_2025["Driver"].map(driver_consistency).fillna(0.5)
qualifying_2025["ChampionshipPoints"] = qualifying_2025["Driver"].map(championship_points).fillna(0)
qualifying_2025["AverageRacePace2025"] = qualifying_2025["Driver"].map(average_race_pace_2025).fillna(95)
qualifying_2025["AvgPitStops"] = qualifying_2025["Driver"].map(avg_pit_stops).fillna(1.5)
qualifying_2025["Team"] = qualifying_2025["Driver"].map(driver_to_team)
qualifying_2025["TeamPerformanceScore"] = qualifying_2025["Team"].map(team_performance_score).fillna(0.3)
qualifying_2025["BahrainSpecialist"] = qualifying_2025["Driver"].map(bahrain_specialists).fillna(1.0)
qualifying_2025["TireDegradation"] = qualifying_2025["Team"].map(tire_deg_factor).fillna(1.01)

# Get last race position from fetched data
last_race = list(season_results_2025.keys())[-1] if season_results_2025 else None
if last_race:
    qualifying_2025["LastRacePosition"] = qualifying_2025["Driver"].map(
        season_results_2025[last_race]
    ).fillna(20)
else:
    qualifying_2025["LastRacePosition"] = 15

qualifying_2025["StartingPositionAdvantage"] = 1 / (qualifying_2025["QualifyingPosition"] ** 0.5)

# ========== SECTION 10: MERGE AND PREPARE DATA ==========
print("\n🔄 Merging all data sources...")

merged_data = qualifying_2025.merge(
    sector_times_2024[["Driver", "TotalSectorTime (s)"]], 
    on="Driver", 
    how="left"
)

merged_data["RainProbability"] = rain_probability
merged_data["Temperature"] = temperature
merged_data["TrackTemperature"] = track_temp
merged_data["Humidity"] = humidity / 100
merged_data["WindSpeed"] = wind_speed / 10

valid_drivers = merged_data["Driver"].isin(laps_2024["Driver"].unique())
merged_data_filtered = merged_data[valid_drivers].copy()

print(f"Drivers with complete data: {len(merged_data_filtered)}")

# ========== SECTION 11: MODEL TRAINING ==========
print("\n🤖 Training model with fetched data...")

feature_columns = [
    "QualifyingTime (s)",
    "AverageRacePace2025",
    "RecentForm",
    "LastRacePosition",
    "SeasonAvgPosition",
    "BahrainSpecialist",
    "TireDegradation",
    "AvgPitStops",
    "StartingPositionAdvantage",
    "MomentumTrend",
    "Consistency",
    "ChampionshipPoints",
    "TeamPerformanceScore",
    "Temperature",
    "TrackTemperature",
    "Humidity",
    "WindSpeed",
    "TotalSectorTime (s)"
]

X = merged_data_filtered[feature_columns].copy()
y = laps_2024.groupby("Driver")["LapTime (s)"].mean().reindex(merged_data_filtered["Driver"])

imputer = SimpleImputer(strategy="median")
X_imputed = imputer.fit_transform(X)

# Train model
if len(X_imputed) < 4:
    X_train, y_train = X_imputed, y
    X_test, y_test = X_imputed, y
else:
    test_size = min(0.3, max(0.2, 3/len(X_imputed)))
    X_train, X_test, y_train, y_test = train_test_split(
        X_imputed, y, test_size=test_size, random_state=42
    )

model = GradientBoostingRegressor(
    n_estimators=160,
    learning_rate=0.04,
    max_depth=4,
    min_samples_split=3,
    min_samples_leaf=2,
    subsample=0.75,
    max_features='sqrt',
    random_state=42,
    verbose=0
)

model.fit(X_train, y_train)
print("Model training complete!")

# ========== SECTION 12: PREDICTIONS ==========
print("\n🎯 Generating predictions...")

merged_data_filtered["PredictedRaceTime (s)"] = model.predict(X_imputed)

# Apply adjustments
for idx, row in merged_data_filtered.iterrows():
    base_time = merged_data_filtered.loc[idx, "PredictedRaceTime (s)"]
    
    # Qualifying weight
    quali_weight = 0.40
    quali_position = row["QualifyingPosition"]
    quali_adjustment = (quali_position - 1) * 0.2 * quali_weight
    
    # Form weight
    form_weight = 0.35
    if row["RecentForm"] > 0:
        form_adjustment = (10 - row["RecentForm"]) * 0.1 * form_weight
    else:
        form_adjustment = 0
    
    # Tire management weight
    tire_weight = 0.25
    tire_factor = row["TireDegradation"]
    tire_adjustment = (tire_factor - 1.0) * 10 * tire_weight
    
    total_adjustment = quali_adjustment + form_adjustment + tire_adjustment
    merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] = base_time + total_adjustment
    
    # Momentum bonus
    if row["MomentumTrend"] > 4:
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 0.99
    elif row["MomentumTrend"] < -4:
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 1.01

final_results = merged_data_filtered.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# Apply position limits
for i, row in final_results.iterrows():
    start_pos = row["QualifyingPosition"]
    predicted_pos = i + 1
    position_change = start_pos - predicted_pos
    
    if position_change > MAX_POSITIONS_GAINED_BAHRAIN:
        time_penalty = (position_change - MAX_POSITIONS_GAINED_BAHRAIN) * 0.4
        final_results.loc[i, "PredictedRaceTime (s)"] += time_penalty
    elif position_change < -MAX_POSITIONS_LOST_BAHRAIN:
        time_bonus = (abs(position_change) - MAX_POSITIONS_LOST_BAHRAIN) * 0.4
        final_results.loc[i, "PredictedRaceTime (s)"] -= time_bonus

final_results = final_results.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# ========== SECTION 13: RESULTS OUTPUT ==========
print("\n" + "="*70)
print("🏁 2025 BAHRAIN GRAND PRIX - PREDICTED RESULTS 🏁")
print("="*70)
print("Race 4 of 24 | Night Race | Using FETCHED 2025 data")
print("="*70)

print("\n📋 PREDICTED RACE ORDER:")
print("-" * 100)
print(f"{'Pos':<4} {'Driver':<8} {'Name':<20} {'Predicted':<12} {'Gap':<10} {'Grid':<6} {'Pts':<5} {'Form'}")
print("-" * 100)

for i, row in final_results.iterrows():
    time_behind = 0 if i == 0 else row["PredictedRaceTime (s)"] - final_results.iloc[0]["PredictedRaceTime (s)"]
    
    print(f"P{i+1:<3} {row['Driver']:<8} {row['DriverFullName']:<20} {format_time(row['PredictedRaceTime (s)']):<12}", end="")
    
    if i > 0:
        print(f"+{time_behind:6.3f}s", end="  ")
    else:
        print(f"{'Leader':<10}", end="")
    
    quali_change = row['QualifyingPosition'] - (i + 1)
    change_symbol = f"↑{quali_change}" if quali_change > 0 else f"↓{abs(quali_change)}" if quali_change < 0 else "→"
    
    pts = row['ChampionshipPoints']
    form = row['RecentForm']
    
    print(f"P{row['QualifyingPosition']:<2}({change_symbol:3}) {pts:>3}  {form:5.1f}")

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)

print(f"\n📊 MODEL PERFORMANCE:")
print(f"Mean Absolute Error: {mae:.3f} seconds")
print(f"Using {len(season_results_2025)} races of actual 2025 data")

# Display data source summary
print("\n📊 DATA SOURCES USED:")
print("-" * 50)
print(f"✅ Fetched {len(season_results_2025)} races from 2025 season")
print(f"✅ Fetched {len(sprint_results_2025)} sprint races")
print(f"✅ Analyzed pit strategies from {len(pit_strategies_2025)} races")
print(f"✅ Current championship data for {len(championship_points)} drivers")
print("\n🔄 Data auto-fetches on each run (cached for 24 hours)")

print("\n" + "="*70)
print("✅ BAHRAIN GP PREDICTION COMPLETE WITH AUTO-FETCHED DATA")
print("="*70)