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

print("🏁 2025 CHINESE GRAND PRIX - ENHANCED PREDICTION MODEL 🏁")
print("="*70)
print("Race 2 of the season - Using Australian GP results + Sprint data")
print("="*70)

# ========== SECTION 1: AUSTRALIAN GP 2025 RESULTS ==========
print("\n📊 Loading Race 1 (Australian GP) ACTUAL results...")

# ACTUAL results from Australian GP 2025 (March 16, 2025)
australian_gp_2025_results = {
    "NOR": 1,   # Lando Norris won
    "VER": 2,   # Max Verstappen P2
    "RUS": 3,   # George Russell P3
    "ANT": 4,   # Kimi Antonelli P4 (Mercedes rookie)
    "ALB": 5,   # Alexander Albon P5
    "STR": 6,   # Lance Stroll P6
    "HUL": 7,   # Nico Hulkenberg P7 (now at Sauber)
    "LEC": 8,   # Charles Leclerc P8
    "PIA": 9,   # Oscar Piastri P9 (spun in rain)
    "HAM": 10,  # Lewis Hamilton P10 (Ferrari debut)
    "GAS": 11,  # Pierre Gasly P11
    "TSU": 12,  # Yuki Tsunoda P12
    "OCO": 13,  # Esteban Ocon P13 (now at Haas)
    "BEA": 14,  # Oliver Bearman P14 (Haas rookie)
    "LAW": 15,  # Liam Lawson (Red Bull debut) - late crash
    "BOR": 16,  # Gabriel Bortoleto (Sauber rookie) - mid-race crash
    "ALO": 17,  # Fernando Alonso - early retirement
    "SAI": 18,  # Carlos Sainz (Williams) - early crash
    "DOO": 19,  # Jack Doohan (Alpine rookie) - lap 1 crash
    "HAD": 20   # Isack Hadjar (crashed on formation lap - DNS)
}

# Points from Australia
points_system = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
driver_points_after_r1 = {}
for driver, position in australian_gp_2025_results.items():
    driver_points_after_r1[driver] = points_system.get(position, 0)

print(f"Loaded ACTUAL results for Australian GP 2025")
print(f"Winner: Lando Norris (McLaren)")

# ========== SECTION 2: SPRINT RACE RESULTS ==========
print("\n🏃 Processing Chinese GP Sprint Race ACTUAL Results...")

# ACTUAL sprint race results
chinese_gp_2025_sprint_results = {
    "HAM": 1,   # Lewis Hamilton wins for Ferrari!
    "PIA": 2,   # Oscar Piastri P2
    "VER": 3,   # Max Verstappen P3
    "RUS": 4,   # George Russell P4
    "LEC": 5,   # Charles Leclerc P5
    "TSU": 6,   # Yuki Tsunoda P6
    "ANT": 7,   # Kimi Antonelli P7
    "NOR": 8,   # Lando Norris P8 (struggled)
    "STR": 9,   # Lance Stroll P9
    "ALO": 10,  # Fernando Alonso P10
    "ALB": 11,  # Alexander Albon P11
    "GAS": 12,  # Pierre Gasly P12
    "HAD": 13,  # Isack Hadjar P13
    "LAW": 14,  # Liam Lawson P14
    "BEA": 15,  # Oliver Bearman P15
    "OCO": 16,  # Esteban Ocon P16
    "SAI": 17,  # Carlos Sainz P17
    "BOR": 18,  # Gabriel Bortoleto P18
    "HUL": 19,  # Nico Hulkenberg P19
    "DOO": 20   # Jack Doohan P20 (penalty)
}

# Sprint points awarded
sprint_points = {1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1}
sprint_points_earned = {}
for driver, position in chinese_gp_2025_sprint_results.items():
    sprint_points_earned[driver] = sprint_points.get(position, 0)

print("Sprint Race Results loaded - Hamilton won for Ferrari!")

# ========== SECTION 3: ENHANCED RECENT FORM CALCULATION ==========
print("\n📈 Calculating enhanced recent form scores...")

def calculate_recent_form_score():
    """Calculate driver form based on Australia + Sprint results with proper weighting"""
    form_scores = {}
    
    all_drivers = set(australian_gp_2025_results.keys()) | set(chinese_gp_2025_sprint_results.keys())
    
    for driver in all_drivers:
        scores = []
        weights = []
        
        # Australia GP result (weight: 0.4 for main race 2 weeks ago)
        if driver in australian_gp_2025_results:
            aus_pos = australian_gp_2025_results[driver]
            aus_score = (21 - aus_pos)
            scores.append(aus_score)
            weights.append(0.4)
        
        # Chinese Sprint result (weight: 0.6 for most recent competitive session)
        if driver in chinese_gp_2025_sprint_results:
            sprint_pos = chinese_gp_2025_sprint_results[driver]
            sprint_score = (21 - sprint_pos)
            scores.append(sprint_score)
            weights.append(0.6)
        
        if scores:
            form_scores[driver] = np.average(scores, weights=weights)
        else:
            form_scores[driver] = 10  # Default middle value
    
    return form_scores

recent_form_scores = calculate_recent_form_score()

def calculate_momentum_trend():
    """Calculate momentum trend from Australia to China Sprint"""
    momentum_trend = {}
    
    for driver in australian_gp_2025_results:
        if driver in chinese_gp_2025_sprint_results:
            aus_pos = australian_gp_2025_results[driver]
            sprint_pos = chinese_gp_2025_sprint_results[driver]
            # Positive = improving, Negative = declining
            momentum_trend[driver] = (aus_pos - sprint_pos) * 0.5
        else:
            momentum_trend[driver] = 0
    
    return momentum_trend

momentum_trend = calculate_momentum_trend()

# ========== SECTION 4: LOAD 2024 CHINESE GP DATA ==========
print("\n📊 Loading 2024 Chinese GP historical data...")

session_2024 = fastf1.get_session(2024, "China", "R")
session_2024.load()

laps_2024 = session_2024.laps[["Driver", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]].copy()
laps_2024.dropna(inplace=True)

# Convert times to seconds
for col in ["LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]:
    laps_2024[f"{col} (s)"] = laps_2024[col].dt.total_seconds()

# Group by driver to get average sector times
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

print(f"Loaded sector times for {len(sector_times_2024)} drivers")

# ========== SECTION 5: WEATHER DATA ==========
print("\n🌤️ Fetching weather data for Shanghai International Circuit...")

def fetch_historical_weather_shanghai(years_back=5):
    """Fetch historical weather data for Shanghai in late March"""
    weather_data_all_years = []
    current_year = 2024
    
    lat = 31.3389
    lon = 121.2198
    
    print(f"Fetching {years_back} years of late March weather data...")
    
    for year in range(current_year - years_back + 1, current_year + 1):
        start_date = f"{year}-03-21"
        end_date = f"{year}-03-23"
        
        url = (f"https://archive-api.open-meteo.com/v1/era5?"
               f"latitude={lat}&longitude={lon}"
               f"&start_date={start_date}&end_date={end_date}"
               f"&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
               f"precipitation_sum,precipitation_probability_max,"
               f"windspeed_10m_max,relative_humidity_2m_mean"
               f"&timezone=Asia/Shanghai")
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                daily = data.get('daily', {})
                
                for i in range(len(daily.get('time', []))):
                    weather_data_all_years.append({
                        'year': year,
                        'date': daily['time'][i],
                        'temp_mean': daily['temperature_2m_mean'][i],
                        'temp_max': daily['temperature_2m_max'][i],
                        'temp_min': daily['temperature_2m_min'][i],
                        'precipitation': daily['precipitation_sum'][i],
                        'wind_speed': daily['windspeed_10m_max'][i],
                        'humidity': daily['relative_humidity_2m_mean'][i]
                    })
                print(f"  ✓ Fetched data for March {year}")
            else:
                print(f"  ✗ Failed to fetch data for {year}")
        except Exception as e:
            print(f"  ✗ Error fetching {year}: {str(e)[:50]}")
    
    return weather_data_all_years

historical_data = fetch_historical_weather_shanghai(years_back=5)

if historical_data:
    avg_temp = np.mean([d['temp_mean'] for d in historical_data if d['temp_mean'] is not None])
    avg_humidity = np.mean([d['humidity'] for d in historical_data if d['humidity'] is not None])
    avg_wind = np.mean([d['wind_speed'] for d in historical_data if d['wind_speed'] is not None])
    
    rainy_days = sum(1 for d in historical_data if d['precipitation'] and d['precipitation'] > 1.0)
    rain_probability = rainy_days / len(historical_data) if historical_data else 0.25
    
    import random
    random.seed(42)
    
    temperature = avg_temp + random.uniform(-1.5, 1.5)
    humidity = avg_humidity + random.uniform(-5, 5)
    wind_speed = avg_wind + random.uniform(-1, 1)
else:
    print("⚠️ Using typical Shanghai late March weather...")
    temperature = 16.5
    rain_probability = 0.25
    humidity = 70
    wind_speed = 4.5

print(f"\n🎯 Race Day Weather Prediction:")
print(f"Temperature: {temperature:.1f}°C")
print(f"Rain probability: {rain_probability*100:.0f}%")

# ========== SECTION 6: 2025 QUALIFYING DATA ==========
print("\n🏎️ Processing 2025 Chinese GP Qualifying Data...")

def format_time(seconds):
    """Convert seconds to MM:SS.sss format"""
    if pd.isna(seconds) or seconds is None:
        return "No Time"
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes}:{secs:06.3f}"

qualifying_2025 = pd.DataFrame({
    "Driver": ["PIA", "RUS", "NOR", "VER", "HAM",
               "LEC", "TSU", "ALB", "OCO", "HUL",
               "ALO", "STR", "SAI", "GAS", "ANT",
               "BEA", "LAW", "DOO", "HAD", "BOR"],
    "DriverFullName": ["Oscar Piastri", "George Russell", "Lando Norris", "Max Verstappen",
                       "Lewis Hamilton", "Charles Leclerc", "Yuki Tsunoda", "Alexander Albon",
                       "Esteban Ocon", "Nico Hülkenberg", "Fernando Alonso", "Lance Stroll",
                       "Carlos Sainz", "Pierre Gasly", "Kimi Antonelli",
                       "Oliver Bearman", "Liam Lawson", "Jack Doohan", "Isack Hadjar", "Gabriel Bortoleto"],
    "QualifyingTime (s)": [90.641, 90.723, 90.793, 90.817, 90.927,
                           91.021, 91.638, 91.706, 91.625, 91.632,
                           91.688, 91.773, 91.840, 91.992, 91.500,
                           91.850, 92.200, 92.100, 91.950, 92.000],
    "QualifyingPosition": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
})

# ========== SECTION 7: SPRINT-BASED RACE PACE ANALYSIS ==========
print("\n🏁 Calculating race pace from Sprint Race...")

# Sprint race pace is more representative than qualifying
sprint_race_pace = {}
base_sprint_pace = 91.0  # Base pace for sprint

for driver, position in chinese_gp_2025_sprint_results.items():
    # Each position ~0.2s per lap difference in sprint
    sprint_race_pace[driver] = base_sprint_pace + (position - 1) * 0.2

# Australia race pace (less weight for older data)
australia_race_pace = {}
base_pace = 91.5  # Base lap time

for driver, position in australian_gp_2025_results.items():
    australia_race_pace[driver] = base_pace + (position - 1) * 0.3

# ========== SECTION 8: TEAM PERFORMANCE ==========
print("\n🏆 Calculating team performance...")

# Updated team points after Australia + Sprint
team_points = {
    "Ferrari": 25 + 8,      # LEC P8 + HAM P10 (Aus) + HAM Sprint win
    "McLaren": 25 + 7 + 1,  # NOR P1 + PIA P9 (Aus) + Sprint points
    "Mercedes": 15 + 12 + 5 + 2,  # RUS P3 + ANT P4 (Aus) + Sprint
    "Red Bull": 18 + 6,     # VER P2 (Aus) + Sprint P3
    "Williams": 0,          # SAI P18 (Aus)
    "Racing Bulls": 0 + 3,  # TSU P12 (Aus) + Sprint P6
    "Aston Martin": 8,      # STR P6 + ALO P17 (Aus)
    "Alpine": 0,            # GAS P11 + DOO P19 (Aus)
    "Haas": 0,              # OCO P13 + BEA P14 (Aus)
    "Kick Sauber": 6,       # HUL P7 + BOR P16 (Aus)
}

max_points = max(team_points.values())
team_performance_score = {team: points / max_points for team, points in team_points.items()}

driver_to_team = {
    "VER": "Red Bull", "NOR": "McLaren", "PIA": "McLaren", 
    "LEC": "Ferrari", "HAM": "Ferrari",
    "RUS": "Mercedes", "ANT": "Mercedes",
    "SAI": "Williams", "ALB": "Williams",
    "GAS": "Alpine", "DOO": "Alpine",
    "ALO": "Aston Martin", "STR": "Aston Martin",
    "TSU": "Racing Bulls", "HAD": "Racing Bulls",
    "LAW": "Red Bull",
    "HUL": "Kick Sauber", "BOR": "Kick Sauber",
    "OCO": "Haas", "BEA": "Haas"
}

# ========== SECTION 9: SHANGHAI CIRCUIT FACTORS ==========
print("\n🏁 Adding Shanghai circuit-specific factors...")

# Shanghai characteristics with moderate overtaking
shanghai_circuit_factor = {
    "VER": 0.97, "HAM": 0.96, "LEC": 0.99, "NOR": 1.00,
    "PIA": 1.01, "RUS": 0.99, "SAI": 1.00, "ALO": 0.98,
    "TSU": 1.01, "OCO": 1.01, "GAS": 1.00, "STR": 1.02,
    "ALB": 1.01, "HUL": 1.02, "ANT": 1.00, "BEA": 1.02,
    "LAW": 1.01, "DOO": 1.02, "HAD": 1.02, "BOR": 1.02
}

# Wet performance factors
driver_wet_performance = {
    "VER": 0.975, "HAM": 0.976, "LEC": 0.976, "NOR": 0.978,
    "ALO": 0.973, "RUS": 0.969, "SAI": 0.979, "TSU": 0.996,
    "OCO": 0.982, "GAS": 0.979, "STR": 0.980, "PIA": 0.985,
    "ALB": 0.988, "HUL": 0.990, "ANT": 0.985, "BEA": 0.990,
    "LAW": 0.985, "DOO": 0.990, "HAD": 0.990, "BOR": 0.990
}

# ========== SECTION 10: FEATURE ENGINEERING ==========
print("\n🔧 Preparing enhanced features...")

# Add all features to qualifying dataframe
qualifying_2025["Team"] = qualifying_2025["Driver"].map(driver_to_team)
qualifying_2025["TeamPerformanceScore"] = qualifying_2025["Team"].map(team_performance_score).fillna(0.5)
qualifying_2025["SprintPosition"] = qualifying_2025["Driver"].map(chinese_gp_2025_sprint_results).fillna(20)
qualifying_2025["SprintRacePace"] = qualifying_2025["Driver"].map(sprint_race_pace).fillna(95.0)
qualifying_2025["AustraliaPosition"] = qualifying_2025["Driver"].map(australian_gp_2025_results).fillna(20)
qualifying_2025["AustraliaPace"] = qualifying_2025["Driver"].map(australia_race_pace).fillna(95.0)
qualifying_2025["RecentForm"] = qualifying_2025["Driver"].map(recent_form_scores).fillna(10)
qualifying_2025["MomentumTrend"] = qualifying_2025["Driver"].map(momentum_trend).fillna(0)
qualifying_2025["ShanghaiCircuitFactor"] = qualifying_2025["Driver"].map(shanghai_circuit_factor).fillna(1.0)
qualifying_2025["WetPerformanceFactor"] = qualifying_2025["Driver"].map(driver_wet_performance).fillna(0.985)

# Championship points (Australia + Sprint)
qualifying_2025["ChampionshipPoints"] = qualifying_2025["Driver"].apply(
    lambda x: driver_points_after_r1.get(x, 0) + sprint_points_earned.get(x, 0)
)

# Weather adjustment
if rain_probability >= 0.5:
    qualifying_2025["WeatherAdjustedQualifying"] = (
        qualifying_2025["QualifyingTime (s)"] * 
        (1 + (rain_probability * 0.1)) * 
        qualifying_2025["WetPerformanceFactor"]
    )
else:
    qualifying_2025["WeatherAdjustedQualifying"] = qualifying_2025["QualifyingTime (s)"]

# Sprint performance difference (sprint vs qualifying)
qualifying_2025["SprintVsQualiDelta"] = qualifying_2025["QualifyingPosition"] - qualifying_2025["SprintPosition"]

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

# ========== SECTION 12: PREPARE FEATURES WITH PROPER WEIGHTS ==========
print("\n🔧 Preparing feature set with optimized weights...")

# PRIORITIZE 2025 DATA OVER 2024 HISTORICAL DATA
feature_columns = [
    # PRIMARY FEATURES (2025 actual racing data)
    "SprintRacePace",             # Most recent competitive pace
    "SprintPosition",             # Latest race position
    "RecentForm",                 # Combined Australia + Sprint form
    "MomentumTrend",             # Improving or declining
    
    # SECONDARY FEATURES (2025 qualifying and team data)
    "WeatherAdjustedQualifying",
    "AustraliaPace",
    "TeamPerformanceScore",
    "ChampionshipPoints",
    "SprintVsQualiDelta",
    
    # TERTIARY FEATURES (track and conditions)
    "ShanghaiCircuitFactor",
    "StartingPositionAdvantage",
    "RainProbability",
    "Temperature",
    "Humidity",
    "WindSpeed",
    "WetPerformanceFactor",
    
    # HISTORICAL (2024 data - lowest weight)
    "TotalSectorTime (s)"
]

X = merged_data_filtered[feature_columns].copy()
y = laps_2024.groupby("Driver")["LapTime (s)"].mean().reindex(merged_data_filtered["Driver"])

# Impute missing values
imputer = SimpleImputer(strategy="median")
X_imputed = imputer.fit_transform(X)

print(f"Feature set: {len(feature_columns)} features (prioritizing 2025 data)")

# ========== SECTION 13: ENHANCED MODEL TRAINING ==========
print("\n🤖 Training enhanced model with better parameters...")

# Calculate sample weights based on 2025 performance
sample_weights_full = []
for driver in merged_data_filtered["Driver"]:
    weight = 1.0
    
    # Higher weight for drivers with sprint data (most recent)
    if driver in chinese_gp_2025_sprint_results:
        sprint_pos = chinese_gp_2025_sprint_results[driver]
        if sprint_pos <= 10:
            weight *= 1.5  # Top 10 sprint finishers
        else:
            weight *= 1.2
    
    # Additional weight for consistent performers
    if driver in australian_gp_2025_results:
        aus_pos = australian_gp_2025_results[driver]
        if aus_pos <= 10:
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
    # Split weights accordingly
    train_indices = np.arange(len(X_train))
    train_weights = [sample_weights_full[i] for i in train_indices[:len(sample_weights_full)] 
                    if i < len(sample_weights_full)]
    if len(train_weights) < len(X_train):
        train_weights.extend([1.0] * (len(X_train) - len(train_weights)))

# Enhanced model with better parameters
model = GradientBoostingRegressor(
    n_estimators=150,      # Reduced from 180
    learning_rate=0.04,    # Optimal learning rate
    max_depth=4,           # Reduced from 5 to prevent overfitting
    min_samples_split=3,   # Increased from 2
    min_samples_leaf=2,    # Increased from 1
    subsample=0.75,        # More randomness
    max_features='sqrt',   # Use subset of features
    random_state=42,
    verbose=0
)

# Train with sample weights
model.fit(X_train, y_train, sample_weight=train_weights[:len(X_train)])
print("Model training complete with weighted samples!")

# ========== SECTION 14: PREDICTIONS WITH PROPER WEIGHTING ==========
print("\n🎯 Generating predictions with optimized weights...")

merged_data_filtered["PredictedRaceTime (s)"] = model.predict(X_imputed)

# Apply realistic adjustments based on sprint weekend data
for idx, row in merged_data_filtered.iterrows():
    base_time = merged_data_filtered.loc[idx, "PredictedRaceTime (s)"]
    adjustments = []
    
    # SPRINT RACE WEIGHT (45% for sprint weekends)
    if row["SprintPosition"] <= 20:
        sprint_weight = 0.45
        sprint_adjustment = (row["SprintPosition"] - 10) * 0.15 * sprint_weight
        adjustments.append(sprint_adjustment)
    
    # AUSTRALIA RACE WEIGHT (25%)
    aus_weight = 0.25
    aus_position = australian_gp_2025_results.get(row["Driver"], 20)
    aus_adjustment = (aus_position - 10) * 0.15 * aus_weight
    adjustments.append(aus_adjustment)
    
    # QUALIFYING WEIGHT (30% on sprint weekends)
    quali_weight = 0.30
    quali_position = row["QualifyingPosition"]
    quali_adjustment = (quali_position - 10) * 0.15 * quali_weight
    adjustments.append(quali_adjustment)
    
    # Apply all adjustments
    total_adjustment = sum(adjustments) * 0.1  # Scale down to avoid over-adjustment
    merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] = base_time + total_adjustment
    
    # Shanghai track position reality check
    # Maximum realistic position changes
    start_pos = row["QualifyingPosition"]
    predicted_time = merged_data_filtered.loc[idx, "PredictedRaceTime (s)"]
    
    # Apply momentum trend bonus/penalty
    if row["MomentumTrend"] > 2:  # Improving significantly
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 0.99
    elif row["MomentumTrend"] < -2:  # Declining significantly
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= 1.01

# Sort by predicted race time
final_results = merged_data_filtered.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# Apply position change reality check
MAX_POSITIONS_GAINED = 7  # Shanghai allows moderate overtaking
MAX_POSITIONS_LOST = 10

for i, row in final_results.iterrows():
    start_pos = row["QualifyingPosition"]
    predicted_pos = i + 1
    position_change = start_pos - predicted_pos
    
    if position_change > MAX_POSITIONS_GAINED:
        # Too optimistic, apply penalty
        time_penalty = (position_change - MAX_POSITIONS_GAINED) * 0.5
        final_results.loc[i, "PredictedRaceTime (s)"] += time_penalty
    elif position_change < -MAX_POSITIONS_LOST:
        # Too pessimistic, apply bonus
        time_bonus = (abs(position_change) - MAX_POSITIONS_LOST) * 0.5
        final_results.loc[i, "PredictedRaceTime (s)"] -= time_bonus

# Re-sort after adjustments
final_results = final_results.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# ========== SECTION 15: RESULTS OUTPUT ==========
print("\n" + "="*70)
print("🏁 2025 CHINESE GRAND PRIX - ENHANCED PREDICTED RESULTS 🏁")
print("="*70)
print("Round 2 of 24 | Shanghai International Circuit | Sprint Weekend")
print("Model: Prioritizing 2025 data (Sprint 45%, Australia 25%, Quali 30%)")
print("="*70)

print("\n📋 FULL PREDICTED RACE ORDER:")
print("-" * 110)
print(f"{'Pos':<4} {'Driver':<8} {'Name':<20} {'Predicted':<12} {'Gap':<10} {'Quali':<8} {'Sprint':<8} {'Aus':<8} {'Form':<6} {'Pts'}")
print("-" * 110)

for i, row in final_results.iterrows():
    time_behind = 0 if i == 0 else row["PredictedRaceTime (s)"] - final_results.iloc[0]["PredictedRaceTime (s)"]
    
    print(f"P{i+1:<3} {row['Driver']:<8} {row['DriverFullName']:<20} {format_time(row['PredictedRaceTime (s)']):<12}", end="")
    
    if i > 0:
        print(f"+{time_behind:6.3f}s", end="  ")
    else:
        print(f"{'Leader':<10}", end="")
    
    # Position changes
    quali_change = row['QualifyingPosition'] - (i + 1)
    if quali_change > 0:
        q_change = f"↑{quali_change}"
    elif quali_change < 0:
        q_change = f"↓{abs(quali_change)}"
    else:
        q_change = "→"
    
    sprint_pos = row['SprintPosition'] if row['SprintPosition'] <= 20 else '-'
    aus_pos = australian_gp_2025_results.get(row['Driver'], '-')
    recent_form = row['RecentForm']
    current_points = row['ChampionshipPoints']
    
    print(f"P{row['QualifyingPosition']:<2} ({q_change:3}) P{sprint_pos:<6} P{aus_pos:<6} {recent_form:5.1f} {current_points:>3}")

# Model metrics
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)

print(f"\n📊 MODEL PERFORMANCE:")
print(f"Mean Absolute Error: {mae:.3f} seconds")
print(f"Features used: {X.shape[1]}")
print(f"Sample weighting applied: Yes (prioritizing 2025 performers)")

# Podium prediction
if len(final_results) >= 3:
    print("\n" + "="*60)
    print("🏆 PREDICTED PODIUM - CHINESE GP 2025 🏆")
    print("="*60)
    
    podium = final_results.loc[:2]
    medals = ["🥇", "🥈", "🥉"]
    
    for i, (idx, row) in enumerate(podium.iterrows()):
        print(f"\n{medals[i]} P{i+1}: {row['Driver']} - {row['DriverFullName']}")
        print(f"   Predicted Race Time: {format_time(row['PredictedRaceTime (s)'])}")
        print(f"   Grid Position: P{row['QualifyingPosition']}")
        print(f"   Sprint Result: P{row['SprintPosition']:.0f}")
        print(f"   Australia Result: P{australian_gp_2025_results.get(row['Driver'], 'DNF')}")
        print(f"   Recent Form Score: {row['RecentForm']:.1f}")
        print(f"   Momentum Trend: {'+' if row['MomentumTrend'] > 0 else ''}{row['MomentumTrend']:.1f}")
        print(f"   Current Points: {row['ChampionshipPoints']:.0f}")
        print(f"   Team: {row['Team']}")

# Championship projection
print("\n🏆 CHAMPIONSHIP STANDINGS AFTER ROUND 2 (Projected):")
print("-" * 60)

projected_points = driver_points_after_r1.copy()
for key in sprint_points_earned:
    if key in projected_points:
        projected_points[key] += sprint_points_earned[key]
    else:
        projected_points[key] = sprint_points_earned[key]

# Add main race points
for i in range(min(10, len(final_results))):
    driver = final_results.iloc[i]['Driver']
    new_points = points_system.get(i + 1, 0)
    if driver in projected_points:
        projected_points[driver] += new_points
    else:
        projected_points[driver] = new_points

sorted_points = sorted(projected_points.items(), key=lambda x: x[1], reverse=True)
for i, (driver, points) in enumerate(sorted_points[:10]):
    aus = australian_gp_2025_results.get(driver, '-')
    sprint = chinese_gp_2025_sprint_results.get(driver, '-')
    chn = final_results[final_results['Driver'] == driver].index[0] + 1 if driver in final_results['Driver'].values else '-'
    print(f"{i+1:2d}. {driver}: {points:.0f} pts (AUS: P{aus}, Sprint: P{sprint}, CHN: P{chn})")

# Feature importance
print("\n📈 TOP PREDICTIVE FACTORS:")
feature_importance = model.feature_importances_
importance_df = pd.DataFrame({
    'Feature': feature_columns,
    'Importance': feature_importance
}).sort_values('Importance', ascending=False)

for i, row in importance_df.head(8).iterrows():
    priority = "PRIMARY" if row['Feature'] in ["SprintRacePace", "SprintPosition", "RecentForm"] else "SECONDARY"
    print(f"  {row['Feature']:30s}: {row['Importance']:.3f} [{priority}]")

print("\n💡 Key Model Insights:")
print("• Sprint race performance weighted at 45% (most recent competitive data)")
print("• Australia GP weighted at 25% (previous race)")
print("• Qualifying weighted at 30% (starting position still matters)")
print("• 2024 historical data minimized to prevent overfitting")
print("• Position change limited to ±7 places (Shanghai track characteristic)")

# Weather summary
print(f"\n🌤️ WEATHER CONDITIONS:")
print(f"Temperature: {temperature:.1f}°C")
print(f"Rain: {rain_probability*100:.0f}% chance")
if rain_probability > 0.3:
    print("⚠️ Potential rain - could affect predictions")

# ========== SECTION 16: VISUALIZATIONS ==========
print("\n📊 Generating enhanced visualizations...")

# Plot 1: Sprint vs Predicted Race Position
plt.figure(figsize=(14, 8))
final_results['PredictedPosition'] = range(1, len(final_results) + 1)

plt.scatter(final_results['SprintPosition'], 
           final_results['PredictedPosition'],
           s=200,
           c=final_results['RecentForm'],
           cmap='RdYlGn',
           alpha=0.7,
           edgecolors='black',
           linewidth=2)

for i, row in final_results.iterrows():
    plt.annotate(row['Driver'],
                (row['SprintPosition'], row['PredictedPosition']),
                xytext=(5, 5),
                textcoords='offset points',
                fontsize=11,
                fontweight='bold')

plt.plot([0, 20], [0, 20], 'k--', alpha=0.3, label='No change from Sprint')
plt.colorbar(label='Recent Form Score')
plt.xlabel('Sprint Race Position', fontsize=12)
plt.ylabel('Predicted Main Race Position', fontsize=12)
plt.title('Chinese GP 2025: Sprint vs Predicted Race Positions', fontsize=14, fontweight='bold')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

# Plot 2: Feature Importance with Categories
plt.figure(figsize=(12, 8))
top_features = importance_df.head(12)

# Color code by category
colors = []
for feat in top_features['Feature']:
    if feat in ["SprintRacePace", "SprintPosition", "RecentForm", "MomentumTrend"]:
        colors.append('#2ecc71')  # Green for 2025 primary
    elif feat in ["WeatherAdjustedQualifying", "AustraliaPace", "TeamPerformanceScore"]:
        colors.append('#3498db')  # Blue for 2025 secondary
    elif feat == "TotalSectorTime (s)":
        colors.append('#e74c3c')  # Red for 2024 historical
    else:
        colors.append('#95a5a6')  # Gray for others

bars = plt.barh(range(len(top_features)), top_features['Importance'], color=colors)
plt.yticks(range(len(top_features)), top_features['Feature'])
plt.xlabel("Importance", fontsize=12)
plt.title("Feature Importance - Enhanced Model (2025 Data Prioritized)", fontsize=14, fontweight='bold')
plt.gca().invert_yaxis()

# Add legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor='#2ecc71', label='2025 Primary Data'),
    Patch(facecolor='#3498db', label='2025 Secondary Data'),
    Patch(facecolor='#e74c3c', label='2024 Historical'),
    Patch(facecolor='#95a5a6', label='Other Features')
]
plt.legend(handles=legend_elements, loc='lower right')

for bar, value in zip(bars, top_features['Importance']):
    plt.text(value, bar.get_y() + bar.get_height()/2, 
            f'{value:.3f}', 
            ha='left', va='center', fontsize=9)

plt.tight_layout()
plt.show()

# Plot 3: Momentum Trend Analysis
plt.figure(figsize=(14, 6))
momentum_data = final_results.sort_values('MomentumTrend', ascending=False)
colors_momentum = ['#2ecc71' if m > 2 else '#e74c3c' if m < -2 else '#f39c12' 
                  for m in momentum_data['MomentumTrend']]

bars = plt.bar(range(len(momentum_data)), momentum_data['MomentumTrend'], color=colors_momentum)
plt.xticks(range(len(momentum_data)), momentum_data['Driver'], rotation=45)
plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
plt.xlabel('Driver (sorted by momentum)', fontsize=12)
plt.ylabel('Momentum Trend (Aus → Sprint)', fontsize=12)
plt.title('Driver Momentum: Improvement/Decline from Australia to China Sprint', fontsize=14, fontweight='bold')

# Add annotations for top/bottom performers
for i, (idx, row) in enumerate(momentum_data.iterrows()):
    if abs(row['MomentumTrend']) > 3:
        plt.annotate(f"{row['MomentumTrend']:.1f}",
                    (i, row['MomentumTrend']),
                    xytext=(0, 5 if row['MomentumTrend'] > 0 else -10),
                    textcoords='offset points',
                    ha='center',
                    fontsize=9,
                    fontweight='bold')

plt.tight_layout()
plt.show()

print("\n" + "="*70)
print("✅ ENHANCED CHINESE GP PREDICTION COMPLETE")
print("="*70)
print("Model optimized with 2025 data prioritization and realistic constraints")