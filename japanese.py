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

# Enable FastF1 caching
fastf1.Cache.enable_cache("f1_cache")

print("🏁 2025 JAPANESE GRAND PRIX - ENHANCED PREDICTION MODEL 🏁")
print("="*70)
print("Race 3 of 24 | Suzuka Circuit | Using 2 races of 2025 data")
print("="*70)

# ========== SECTION 1: LOAD 2025 SEASON RESULTS (ACTUAL) ==========
print("\n📊 Loading ACTUAL 2025 Season Results (2 races so far)...")

# Only 2 races have happened before Japan
season_results_2025 = {
    "Australia": {  # Race 1 - ACTUAL
        "NOR": 1, "VER": 2, "RUS": 3, "ANT": 4, "ALB": 5,
        "STR": 6, "HUL": 7, "LEC": 8, "PIA": 9, "HAM": 10,
        "GAS": 11, "TSU": 12, "OCO": 13, "BEA": 14, "LAW": 15,
        "BOR": 16, "ALO": 17, "SAI": 18, "DOO": 19, "HAD": 20
    },
    "China": {  # Race 2 - ACTUAL (with DSQs)
        "PIA": 1, "NOR": 2, "RUS": 3, "VER": 4, "OCO": 5,
        "ANT": 6, "ALB": 7, "BEA": 8, "STR": 9, "SAI": 10,
        "HAD": 11, "LAW": 12, "DOO": 13, "BOR": 14, "HUL": 15,
        "TSU": 16, "ALO": 17, "HAM": 18, "LEC": 19, "GAS": 20  # DSQs at bottom
    }
}

# Sprint race results
sprint_results_2025 = {
    "China_Sprint": {  # ACTUAL
        "HAM": 1, "PIA": 2, "VER": 3, "RUS": 4, "LEC": 5,
        "TSU": 6, "ANT": 7, "NOR": 8, "STR": 9, "ALO": 10,
        "ALB": 11, "GAS": 12, "HAD": 13, "LAW": 14, "BEA": 15,
        "OCO": 16, "SAI": 17, "BOR": 18, "HUL": 19, "DOO": 20
    }
}

print(f"Loaded {len(season_results_2025)} main races and {len(sprint_results_2025)} sprint races")

# ========== SECTION 2: CALCULATE EARLY SEASON FORM ==========
print("\n📈 Calculating early season form metrics...")

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

def calculate_recent_form():
    """Calculate form based on available races with exponential weighting"""
    races = list(season_results_2025.keys())
    
    form_scores = {}
    weights = np.exp(np.linspace(0, 1, len(races)))
    weights = weights / weights.sum()
    
    all_drivers = set()
    for race in races:
        all_drivers.update(season_results_2025[race].keys())
    
    for driver in all_drivers:
        weighted_score = 0
        total_weight = 0
        
        for i, race in enumerate(races):
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
    """Calculate if driver is improving or declining from Australia to China"""
    momentum = {}
    
    for driver in season_results_2025["Australia"]:
        if driver in season_results_2025["China"]:
            aus_pos = season_results_2025["Australia"][driver]
            china_pos = season_results_2025["China"][driver]
            # Negative = improving
            momentum[driver] = (aus_pos - china_pos)
        else:
            momentum[driver] = 0
    
    return momentum

# Calculate metrics
season_avg_positions = calculate_season_average()
recent_form = calculate_recent_form()
momentum_trend = calculate_momentum_trend()

print(f"Calculated metrics for {len(season_avg_positions)} drivers")
print(f"Top 3 on form: {sorted(recent_form.items(), key=lambda x: x[1], reverse=True)[:3]}")

# ========== SECTION 3: CHAMPIONSHIP STANDINGS AFTER 2 RACES ==========
print("\n🏆 Calculating championship standings after China...")

points_system = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
sprint_points_system = {1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}

championship_points = {}

# Main race points
for race, results in season_results_2025.items():
    for driver, position in results.items():
        if driver not in championship_points:
            championship_points[driver] = 0
        championship_points[driver] += points_system.get(position, 0)

# Sprint points
for sprint, results in sprint_results_2025.items():
    for driver, position in results.items():
        if driver not in championship_points:
            championship_points[driver] = 0
        championship_points[driver] += sprint_points_system.get(position, 0)

championship_standings = sorted(championship_points.items(), key=lambda x: x[1], reverse=True)
print("Current Top 5 Championship Standings:")
for i, (driver, points) in enumerate(championship_standings[:5]):
    print(f"  {i+1}. {driver}: {points} pts")

# ========== SECTION 4: LOAD SUZUKA 2024 DATA ==========
print("\n🏁 Loading Suzuka 2024 historical data...")

session_2024 = fastf1.get_session(2024, "Japan", "R")
session_2024.load()

laps_2024 = session_2024.laps[["Driver", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]].copy()
laps_2024.dropna(inplace=True)

# Convert to seconds
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

print(f"Loaded 2024 Suzuka data for {len(sector_times_2024)} drivers")

# ========== SECTION 5: 2025 JAPANESE GP QUALIFYING DATA ==========
print("\n🏎️ Processing 2025 Japanese GP Qualifying Data...")

def format_time(seconds):
    """Convert seconds to MM:SS.sss format"""
    if pd.isna(seconds) or seconds is None:
        return "No Time"
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes}:{secs:06.3f}"

# 2025 Japanese GP Qualifying (Saturday)
# Replace with actual when available
qualifying_2025 = pd.DataFrame({
    "Driver": ["VER", "NOR", "PIA", "RUS", "LEC", 
               "HAM", "SAI", "ALO", "TSU", "GAS",
               "ALB", "OCO", "STR", "HUL", "ANT",
               "BEA", "LAW", "DOO", "BOR", "HAD"],
    "DriverFullName": ["Max Verstappen", "Lando Norris", "Oscar Piastri", "George Russell",
                       "Charles Leclerc", "Lewis Hamilton", "Carlos Sainz", "Fernando Alonso",
                       "Yuki Tsunoda", "Pierre Gasly", "Alexander Albon", "Esteban Ocon",
                       "Lance Stroll", "Nico Hülkenberg", "Kimi Antonelli",
                       "Oliver Bearman", "Liam Lawson", "Jack Doohan", "Gabriel Bortoleto", "Isack Hadjar"],
    "QualifyingTime (s)": [88.567, 88.621, 88.695, 88.734, 88.812,
                           88.896, 88.953, 89.021, 89.087, 89.156,
                           89.234, 89.312, 89.398, 89.476, 89.523,
                           89.601, 89.678, 89.745, 89.823, 89.901],
    "QualifyingPosition": list(range(1, 21))
})

qualifying_2025["QualifyingTime_Display"] = qualifying_2025["QualifyingTime (s)"].apply(format_time)

print("Qualifying Results:")
print("-" * 50)
for _, row in qualifying_2025[:10].iterrows():
    print(f"P{row['QualifyingPosition']:2d}: {row['Driver']} - {row['QualifyingTime_Display']}")

# ========== SECTION 6: CALCULATE RACE PACE FROM EARLY SEASON ==========
print("\n🏁 Calculating race pace from 2025 season...")

def calculate_average_race_pace():
    """Calculate each driver's average race pace from 2 races"""
    race_pace = {}
    base_pace = 91.2  # Base Suzuka lap time
    
    # Weight China more (more recent)
    weights = [0.4, 0.6]  # Australia, China
    
    for driver in set().union(*[set(r.keys()) for r in season_results_2025.values()]):
        weighted_position = 0
        total_weight = 0
        
        races = list(season_results_2025.keys())
        for i, race in enumerate(races):
            if driver in season_results_2025[race]:
                pos = season_results_2025[race][driver]
                weighted_position += pos * weights[i]
                total_weight += weights[i]
        
        if total_weight > 0:
            avg_pos = weighted_position / total_weight
            race_pace[driver] = base_pace + (avg_pos - 1) * 0.2
        else:
            race_pace[driver] = base_pace + 3.0
    
    return race_pace

average_race_pace_2025 = calculate_average_race_pace()

# ========== SECTION 7: WEATHER DATA ==========
print("\n🌤️ Fetching weather data for Suzuka...")

# Suzuka coordinates
lat = 34.8431
lon = 136.5406

# Typical early April weather at Suzuka
temperature = 18.5
rain_probability = 0.30  # 30% chance - spring weather can be variable
humidity = 72
wind_speed = 4.5

print(f"Race Day Weather Forecast:")
print(f"Temperature: {temperature:.1f}°C")
print(f"Rain probability: {rain_probability*100:.0f}%")
print(f"Humidity: {humidity:.0f}%")
print(f"Wind: {wind_speed:.1f} m/s")

# ========== SECTION 8: TEAM PERFORMANCE ==========
print("\n🏎️ Calculating team standings after 2 races...")

team_points = {}
driver_to_team = {
    "VER": "Red Bull", "LAW": "Red Bull",
    "NOR": "McLaren", "PIA": "McLaren",
    "LEC": "Ferrari", "HAM": "Ferrari",
    "RUS": "Mercedes", "ANT": "Mercedes",
    "SAI": "Williams", "ALB": "Williams",
    "GAS": "Alpine", "DOO": "Alpine",
    "ALO": "Aston Martin", "STR": "Aston Martin",
    "TSU": "Racing Bulls", "HAD": "Racing Bulls",
    "HUL": "Kick Sauber", "BOR": "Kick Sauber",
    "OCO": "Haas", "BEA": "Haas"
}

for driver, points in championship_points.items():
    if driver in driver_to_team:
        team = driver_to_team[driver]
        if team not in team_points:
            team_points[team] = 0
        team_points[team] += points

max_team_points = max(team_points.values()) if team_points else 1
team_performance_score = {team: points / max_team_points for team, points in team_points.items()}

print("Top 5 Constructor Standings:")
sorted_teams = sorted(team_points.items(), key=lambda x: x[1], reverse=True)
for i, (team, points) in enumerate(sorted_teams[:5]):
    print(f"  {i+1}. {team}: {points} pts")

# ========== SECTION 9: SUZUKA-SPECIFIC FACTORS ==========
print("\n🏁 Calculating Suzuka-specific factors...")

# Suzuka characteristics
suzuka_quali_importance = 0.45  # Moderate - overtaking possible but challenging

# Historical Suzuka performance
suzuka_specialists = {
    "VER": 0.96,  # Red Bull traditionally strong
    "HAM": 0.97,  # Multiple wins
    "ALO": 0.98,  # Good history
    "TSU": 0.98,  # Home race advantage
    "SAI": 0.99,
    "LEC": 0.99,
    "NOR": 1.00,
    "RUS": 1.00,
    "PIA": 1.01,
    "GAS": 1.01,
    "OCO": 1.01,
    "STR": 1.02,
    "ALB": 1.01,
    "HUL": 1.02,
    "ANT": 1.03,  # Rookie
    "BEA": 1.03,
    "LAW": 1.02,
    "DOO": 1.03,
    "BOR": 1.03,
    "HAD": 1.03
}

# High speed circuit factor (favors certain cars)
high_speed_factor = {
    "Red Bull": 0.98,
    "McLaren": 0.99,
    "Ferrari": 1.00,
    "Mercedes": 1.01,
    "Williams": 1.02,
    "Alpine": 1.02,
    "Aston Martin": 1.01,
    "Racing Bulls": 1.01,
    "Haas": 1.02,
    "Kick Sauber": 1.03
}

# Position change at Suzuka (moderate difficulty)
MAX_POSITIONS_GAINED_SUZUKA = 5
MAX_POSITIONS_LOST_SUZUKA = 8

# ========== SECTION 10: FEATURE ENGINEERING ==========
print("\n🔧 Building feature set...")

# Add calculated features
qualifying_2025["SeasonAvgPosition"] = qualifying_2025["Driver"].map(season_avg_positions).fillna(15)
qualifying_2025["RecentForm"] = qualifying_2025["Driver"].map(recent_form).fillna(10)
qualifying_2025["MomentumTrend"] = qualifying_2025["Driver"].map(momentum_trend).fillna(0)
qualifying_2025["ChampionshipPoints"] = qualifying_2025["Driver"].map(championship_points).fillna(0)
qualifying_2025["AverageRacePace2025"] = qualifying_2025["Driver"].map(average_race_pace_2025).fillna(94)
qualifying_2025["Team"] = qualifying_2025["Driver"].map(driver_to_team)
qualifying_2025["TeamPerformanceScore"] = qualifying_2025["Team"].map(team_performance_score).fillna(0.3)
qualifying_2025["SuzukaSpecialist"] = qualifying_2025["Driver"].map(suzuka_specialists).fillna(1.0)
qualifying_2025["HighSpeedFactor"] = qualifying_2025["Team"].map(high_speed_factor).fillna(1.01)

# Last race (China)
china_positions = season_results_2025["China"]
qualifying_2025["LastRacePosition"] = qualifying_2025["Driver"].map(china_positions).fillna(20)

# Sprint performance
china_sprint_positions = sprint_results_2025["China_Sprint"]
qualifying_2025["LastSprintPosition"] = qualifying_2025["Driver"].map(china_sprint_positions).fillna(20)

# Weather adjustments
driver_wet_performance = {
    "VER": 0.975, "HAM": 0.976, "LEC": 0.976, "NOR": 0.978,
    "ALO": 0.973, "RUS": 0.969, "SAI": 0.979, "TSU": 0.996,
    "OCO": 0.982, "GAS": 0.979, "STR": 0.980, "PIA": 0.985,
    "ALB": 0.988, "HUL": 0.990, "ANT": 0.985, "BEA": 0.990,
    "LAW": 0.985, "DOO": 0.990, "BOR": 0.990, "HAD": 0.990
}
qualifying_2025["WetPerformanceFactor"] = qualifying_2025["Driver"].map(driver_wet_performance).fillna(0.985)

if rain_probability >= 0.5:
    qualifying_2025["WeatherAdjustedQualifying"] = (
        qualifying_2025["QualifyingTime (s)"] * 
        (1 + (rain_probability * 0.1)) * 
        qualifying_2025["WetPerformanceFactor"]
    )
else:
    qualifying_2025["WeatherAdjustedQualifying"] = qualifying_2025["QualifyingTime (s)"]

# Starting position advantage
qualifying_2025["StartingPositionAdvantage"] = 1 / (qualifying_2025["QualifyingPosition"] ** 0.5)

# ========== SECTION 11: MERGE DATA ==========
print("\n🔄 Merging all data sources...")

merged_data = qualifying_2025.merge(
    sector_times_2024[["Driver", "TotalSectorTime (s)"]], 
    on="Driver", 
    how="left"
)

# Add weather features
merged_data["RainProbability"] = rain_probability
merged_data["Temperature"] = temperature
merged_data["Humidity"] = humidity / 100
merged_data["WindSpeed"] = wind_speed / 10

# Filter for drivers with data
valid_drivers = merged_data["Driver"].isin(laps_2024["Driver"].unique())
merged_data_filtered = merged_data[valid_drivers].copy()

print(f"Drivers with complete data: {len(merged_data_filtered)}")

# ========== SECTION 12: PREPARE FEATURES ==========
print("\n🎯 Preparing feature set...")

# Feature priority for early season (less historical data weight)
feature_columns = [
    # PRIMARY (2025 actual data)
    "WeatherAdjustedQualifying",
    "AverageRacePace2025",
    "RecentForm",
    "LastRacePosition",
    "LastSprintPosition",
    "SeasonAvgPosition",
    
    # SECONDARY (Team/Driver factors)
    "MomentumTrend",
    "ChampionshipPoints",
    "TeamPerformanceScore",
    "SuzukaSpecialist",
    "HighSpeedFactor",
    "StartingPositionAdvantage",
    
    # TERTIARY (Conditions)
    "RainProbability",
    "Temperature",
    "Humidity",
    "WindSpeed",
    "WetPerformanceFactor",
    
    # HISTORICAL (2024 data - lower weight)
    "TotalSectorTime (s)"
]

X = merged_data_filtered[feature_columns].copy()
y = laps_2024.groupby("Driver")["LapTime (s)"].mean().reindex(merged_data_filtered["Driver"])

# Impute missing values
imputer = SimpleImputer(strategy="median")
X_imputed = imputer.fit_transform(X)

print(f"Feature set: {len(feature_columns)} features")

# ========== SECTION 13: MODEL TRAINING ==========
print("\n🤖 Training model with early season data...")

# Calculate sample weights based on 2025 performance
sample_weights_full = []
for driver in merged_data_filtered["Driver"]:
    weight = 1.0
    
    # Higher weight for consistent early performers
    if driver in recent_form:
        if recent_form[driver] > 15:
            weight *= 1.3
    
    # Weight by China performance (most recent)
    if driver in china_positions:
        if china_positions[driver] <= 10:
            weight *= 1.2
    
    sample_weights_full.append(weight)

# Split data
if len(X_imputed) < 4:
    X_train, y_train = X_imputed, y
    X_test, y_test = X_imputed, y
    train_weights = sample_weights_full
else:
    test_size = min(0.3, max(0.2, 3/len(X_imputed)))
    X_train, X_test, y_train, y_test = train_test_split(
        X_imputed, y, test_size=test_size, random_state=42
    )
    train_weights = sample_weights_full[:len(X_train)]

# Model optimized for early season (more uncertainty)
model = GradientBoostingRegressor(
    n_estimators=150,
    learning_rate=0.04,
    max_depth=4,
    min_samples_split=3,
    min_samples_leaf=2,
    subsample=0.75,
    max_features='sqrt',
    random_state=42,
    verbose=0
)

model.fit(X_train, y_train, sample_weight=train_weights[:len(X_train)])
print("Model training complete!")

# ========== SECTION 14: PREDICTIONS ==========
print("\n🎯 Generating predictions...")

merged_data_filtered["PredictedRaceTime (s)"] = model.predict(X_imputed)

# Apply adjustments based on weights
for idx, row in merged_data_filtered.iterrows():
    base_time = merged_data_filtered.loc[idx, "PredictedRaceTime (s)"]
    
    # QUALIFYING WEIGHT (45% at Suzuka)
    quali_weight = 0.45
    quali_position = row["QualifyingPosition"]
    quali_adjustment = (quali_position - 1) * 0.2 * quali_weight
    
    # RECENT FORM WEIGHT (35% - important early season)
    form_weight = 0.35
    if row["RecentForm"] > 0:
        form_adjustment = (10 - row["RecentForm"]) * 0.1 * form_weight
    else:
        form_adjustment = 0
    
    # SUZUKA SPECIALIST WEIGHT (20%)
    specialist_weight = 0.20
    specialist_factor = row["SuzukaSpecialist"]
    specialist_adjustment = (specialist_factor - 1.0) * 10 * specialist_weight
    
    # Apply adjustments
    total_adjustment = quali_adjustment + form_adjustment + specialist_adjustment
    merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] = base_time + total_adjustment
    
    # Momentum bonus/penalty
    if row["MomentumTrend"] > 5:
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 0.99
    elif row["MomentumTrend"] < -5:
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 1.01
    
    # Home race boost for Tsunoda
    if row["Driver"] == "TSU":
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 0.995

# Sort by predicted time
final_results = merged_data_filtered.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# Apply Suzuka position limits
for i, row in final_results.iterrows():
    start_pos = row["QualifyingPosition"]
    predicted_pos = i + 1
    position_change = start_pos - predicted_pos
    
    if position_change > MAX_POSITIONS_GAINED_SUZUKA:
        time_penalty = (position_change - MAX_POSITIONS_GAINED_SUZUKA) * 0.5
        final_results.loc[i, "PredictedRaceTime (s)"] += time_penalty
    elif position_change < -MAX_POSITIONS_LOST_SUZUKA:
        time_bonus = (abs(position_change) - MAX_POSITIONS_LOST_SUZUKA) * 0.5
        final_results.loc[i, "PredictedRaceTime (s)"] -= time_bonus

# Re-sort
final_results = final_results.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# ========== SECTION 15: RESULTS OUTPUT ==========
print("\n" + "="*70)
print("🏁 2025 JAPANESE GRAND PRIX - PREDICTED RESULTS 🏁")
print("="*70)
print("Race 3 of 24 | Suzuka Circuit")
print("Model: 45% Qualifying, 35% Recent Form, 20% Suzuka Factors")
print("="*70)

print("\n📋 PREDICTED RACE ORDER:")
print("-" * 110)
print(f"{'Pos':<4} {'Driver':<8} {'Name':<20} {'Predicted':<12} {'Gap':<10} {'Grid':<6} {'China':<8} {'Aus':<8} {'Pts'}")
print("-" * 110)

for i, row in final_results.iterrows():
    time_behind = 0 if i == 0 else row["PredictedRaceTime (s)"] - final_results.iloc[0]["PredictedRaceTime (s)"]
    
    print(f"P{i+1:<3} {row['Driver']:<8} {row['DriverFullName']:<20} {format_time(row['PredictedRaceTime (s)']):<12}", end="")
    
    if i > 0:
        print(f"+{time_behind:6.3f}s", end="  ")
    else:
        print(f"{'Leader':<10}", end="")
    
    quali_change = row['QualifyingPosition'] - (i + 1)
    if quali_change > 0:
        change_symbol = f"↑{quali_change}"
    elif quali_change < 0:
        change_symbol = f"↓{abs(quali_change)}"
    else:
        change_symbol = "→"
    
    china_pos = china_positions.get(row['Driver'], '-')
    aus_pos = season_results_2025["Australia"].get(row['Driver'], '-')
    pts = row['ChampionshipPoints']
    
    print(f"P{row['QualifyingPosition']:<2}({change_symbol:3}) P{china_pos:<7} P{aus_pos:<7} {pts:>3}")

# Model performance
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)

print(f"\n📊 MODEL PERFORMANCE:")
print(f"Mean Absolute Error: {mae:.3f} seconds")
print(f"Features used: {len(feature_columns)}")

# Podium
if len(final_results) >= 3:
    print("\n" + "="*60)
    print("🏆 PREDICTED PODIUM - JAPANESE GP 2025 🏆")
    print("="*60)
    
    podium = final_results.loc[:2]
    medals = ["🥇", "🥈", "🥉"]
    
    for i, (idx, row) in enumerate(podium.iterrows()):
        print(f"\n{medals[i]} P{i+1}: {row['Driver']} - {row['DriverFullName']}")
        print(f"   Predicted Time: {format_time(row['PredictedRaceTime (s)'])}")
        print(f"   Grid Position: P{row['QualifyingPosition']}")
        print(f"   China Result: P{row['LastRacePosition']:.0f}")
        print(f"   Current Points: {row['ChampionshipPoints']:.0f}")
        print(f"   Team: {row['Team']}")
        
        if row['Driver'] == 'TSU':
            print(f"   🇯🇵 Home race advantage!")

# Championship projection
print("\n🏆 CHAMPIONSHIP PROJECTION AFTER JAPAN:")
print("-" * 60)

projected_points = championship_points.copy()
for i in range(min(10, len(final_results))):
    driver = final_results.iloc[i]['Driver']
    new_points = points_system.get(i + 1, 0)
    if driver in projected_points:
        projected_points[driver] += new_points
    else:
        projected_points[driver] = new_points

sorted_points = sorted(projected_points.items(), key=lambda x: x[1], reverse=True)
for i, (driver, points) in enumerate(sorted_points[:10]):
    current = championship_points.get(driver, 0)
    gained = points - current
    jpn_pos = final_results[final_results['Driver'] == driver].index[0] + 1 if driver in final_results['Driver'].values else '-'
    print(f"{i+1:2d}. {driver}: {points:.0f} pts (+{gained:.0f}) - Japan: P{jpn_pos}")

# Key insights
print("\n💡 KEY INSIGHTS:")
print("-" * 60)
print(f"• Qualifying importance: {suzuka_quali_importance*100:.0f}%")
print(f"• Weather: {rain_probability*100:.0f}% rain chance - could shake things up")
print(f"• Home advantage: Tsunoda gets boost at Suzuka")
print(f"• Early season: Only 2 races of data, predictions have higher uncertainty")

# Feature importance
print("\n📈 TOP PREDICTIVE FACTORS:")
feature_importance = model.feature_importances_
importance_df = pd.DataFrame({
    'Feature': feature_columns,
    'Importance': feature_importance
}).sort_values('Importance', ascending=False)

for i, row in importance_df.head(5).iterrows():
    print(f"  {row['Feature']:30s}: {row['Importance']:.3f}")

print("\n" + "="*70)
print("✅ JAPANESE GP PREDICTION COMPLETE")
print("="*70)
print("Note: Early season predictions based on only 2 races of data")
print("Accuracy will improve as more 2025 races are completed")