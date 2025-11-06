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

# Enable FastF1 caching
fastf1.Cache.enable_cache("f1_cache")

print("🏁 2025 AUSTRALIAN GRAND PRIX - SEASON OPENER PREDICTION MODEL 🏁")
print("="*70)
print("Using: Pre-season testing + Late 2024 performance + Historical data")
print("="*70)

# ========== SECTION 1: LATE 2024 SEASON PERFORMANCE DATA ==========
print("\n📊 Loading late 2024 season performance data...")

# Results from last 6 races of 2024 (for momentum calculation)
late_2024_results = {
    "USA_2024": {
        "LEC": 1, "SAI": 2, "VER": 3, "NOR": 4, "PIA": 5, 
        "RUS": 6, "PER": 7, "HUL": 8, "LAW": 9, "COL": 10
    },
    "Mexico_2024": {
        "SAI": 1, "NOR": 2, "LEC": 3, "HAM": 4, "RUS": 5,
        "VER": 6, "MAG": 7, "PIA": 8, "HUL": 9, "PER": 10
    },
    "Brazil_2024": {
        "VER": 1, "OCO": 2, "GAS": 3, "RUS": 4, "LEC": 5,
        "NOR": 6, "TSU": 7, "PIA": 8, "LAW": 9, "HAM": 10
    },
    "Las_Vegas_2024": {
        "RUS": 1, "HAM": 2, "SAI": 3, "LEC": 4, "VER": 5,
        "NOR": 6, "PIA": 7, "HUL": 8, "TSU": 9, "PER": 10
    },
    "Qatar_2024": {
        "VER": 1, "LEC": 2, "PIA": 3, "RUS": 4, "GAS": 5,
        "SAI": 6, "ALO": 7, "ZHO": 8, "MAG": 9, "BOT": 10
    },
    "Abu_Dhabi_2024": {
        "NOR": 1, "SAI": 2, "LEC": 3, "RUS": 4, "PIA": 5,
        "VER": 6, "GAS": 7, "HUL": 8, "ALO": 9, "PIA": 10
    }
}

# Final 2024 Constructor Standings (for team strength)
final_2024_constructors = {
    "McLaren": 666,    # Champions
    "Ferrari": 652,    # Strong finish
    "Red Bull": 589,   # Lost dominance
    "Mercedes": 468,   # Improving
    "Aston Martin": 94,
    "Alpine": 65,
    "Williams": 54,
    "Racing Bulls": 46,
    "Kick Sauber": 8,
    "Haas": 58
}

# Calculate late season momentum (weighted average of last 6 races)
def calculate_late_season_momentum():
    momentum_scores = {}
    races = list(late_2024_results.keys())
    # Exponential weighting - more recent races matter more
    weights = np.exp(np.linspace(0, 2, len(races)))
    weights = weights / weights.sum()
    
    # Get all drivers
    all_drivers = set()
    for results in late_2024_results.values():
        all_drivers.update(results.keys())
    
    for driver in all_drivers:
        weighted_pos = 0
        total_weight = 0
        for i, race in enumerate(races):
            if driver in late_2024_results[race]:
                pos = late_2024_results[race][driver]
                # Convert position to points (inverted - lower position = higher score)
                points = 21 - pos
                weighted_pos += points * weights[i]
                total_weight += weights[i]
        
        if total_weight > 0:
            momentum_scores[driver] = weighted_pos / total_weight
        else:
            momentum_scores[driver] = 10  # Default middle value
    
    return momentum_scores

late_2024_momentum = calculate_late_season_momentum()
print(f"Calculated momentum scores for {len(late_2024_momentum)} drivers from late 2024")

# ========== SECTION 2: PRE-SEASON TESTING DATA (BAHRAIN FEB 26-28, 2025) ==========
print("\n🏎️ Processing pre-season testing data from Bahrain...")

# Simulated pre-season testing data (in reality, you'd get this from actual testing)
# These would come from real testing times
preseason_testing = {
    "Fastest_Laps": {
        "VER": 90.234,  # Red Bull showing pace
        "NOR": 90.156,  # McLaren very strong
        "LEC": 90.445,  # Ferrari solid
        "HAM": 90.523,  # Mercedes/Ferrari (Hamilton moved)
        "PIA": 90.234,  # McLaren strong
        "SAI": 90.667,  # Williams (moved from Ferrari)
        "RUS": 90.445,  # Mercedes
        "ALO": 91.234,  # Aston Martin
        "TSU": 91.123,  # Racing Bulls
        "GAS": 91.445,  # Alpine
        "STR": 91.556,  # Aston Martin
        "ALB": 91.234,  # Williams
        "HUL": 91.667,  # Kick Sauber
        "OCO": 91.234   # Alpine
    },
    "Long_Run_Pace": {  # Average lap time over 10+ lap runs
        "VER": 92.556,
        "NOR": 92.445,
        "PIA": 92.667,
        "LEC": 92.778,
        "HAM": 92.889,
        "RUS": 92.990,
        "SAI": 93.123,
        "ALO": 93.556,
        "TSU": 93.667,
        "GAS": 93.778,
        "STR": 93.889,
        "ALB": 93.445,
        "HUL": 94.123,
        "OCO": 93.667
    },
    "Laps_Completed": {  # Reliability indicator
        "Red Bull": 456,
        "McLaren": 512,  # Most laps - good reliability
        "Ferrari": 423,
        "Mercedes": 445,
        "Aston Martin": 234,  # Fewer laps - potential issues
        "Alpine": 345,
        "Williams": 389,
        "Racing Bulls": 367,
        "Kick Sauber": 234,
        "Haas": 301
    },
    "Sandbagging_Factor": {  # Teams known to hide pace in testing
        "Mercedes": 0.98,  # Typically sandbagging
        "Red Bull": 0.99,  # Slight sandbagging
        "Ferrari": 1.00,  # Usually show true pace
        "McLaren": 1.01,  # Might be pushing more
        "Others": 1.00
    }
}

# ========== SECTION 3: LOAD 2024 AUSTRALIAN GP DATA ==========
print("\n📊 Loading 2024 Australian GP historical data...")

session_2024 = fastf1.get_session(2024, "Australia", "R")
session_2024.load()

laps_2024 = session_2024.laps[["Driver", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]].copy()
laps_2024.dropna(inplace=True)

# Convert times to seconds
for col in ["LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]:
    laps_2024[f"{col} (s)"] = laps_2024[col].dt.total_seconds()

# Aggregate sector times by driver
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

# ========== SECTION 4: WEATHER DATA FOR MELBOURNE ==========
print("\n🌤️ Fetching historical March weather data for Melbourne GP...")

import json
from datetime import datetime, timedelta

def fetch_historical_weather_melbourne(years_back=5):
    """
    Fetch historical weather data for Melbourne in mid-March
    Using Open-Meteo API (free, no key required)
    """
    weather_data_all_years = []
    current_year = 2024  # Last complete year
    
    # Melbourne coordinates
    lat = -37.8497
    lon = 144.968
    
    print(f"Fetching {years_back} years of March weather data...")
    
    for year in range(current_year - years_back + 1, current_year + 1):
        # Get data for March 14-16 (typical race weekend)
        start_date = f"{year}-03-14"
        end_date = f"{year}-03-16"
        
        # Open-Meteo API URL (free, no key needed)
        url = (f"https://archive-api.open-meteo.com/v1/era5?"
               f"latitude={lat}&longitude={lon}"
               f"&start_date={start_date}&end_date={end_date}"
               f"&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
               f"precipitation_sum,precipitation_probability_max,"
               f"windspeed_10m_max,relative_humidity_2m_mean"
               f"&timezone=Australia/Melbourne")
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                daily = data.get('daily', {})
                
                # Extract race weekend data
                for i in range(len(daily.get('time', []))):
                    weather_data_all_years.append({
                        'year': year,
                        'date': daily['time'][i],
                        'temp_max': daily['temperature_2m_max'][i],
                        'temp_min': daily['temperature_2m_min'][i],
                        'temp_mean': daily['temperature_2m_mean'][i],
                        'precipitation': daily['precipitation_sum'][i],
                        'precipitation_prob': daily.get('precipitation_probability_max', [0])[i] if daily.get('precipitation_probability_max') else 0,
                        'wind_speed': daily['windspeed_10m_max'][i],
                        'humidity': daily['relative_humidity_2m_mean'][i]
                    })
                print(f"  ✓ Fetched data for March {year}")
            else:
                print(f"  ✗ Failed to fetch data for {year}")
        except Exception as e:
            print(f"  ✗ Error fetching {year}: {e}")
    
    return weather_data_all_years

# Try to fetch historical data
historical_data = fetch_historical_weather_melbourne(years_back=5)

# Calculate averages from historical data
if historical_data:
    # Calculate averages
    avg_temp = np.mean([d['temp_mean'] for d in historical_data if d['temp_mean'] is not None])
    avg_temp_max = np.mean([d['temp_max'] for d in historical_data if d['temp_max'] is not None])
    avg_temp_min = np.mean([d['temp_min'] for d in historical_data if d['temp_min'] is not None])
    avg_precipitation = np.mean([d['precipitation'] for d in historical_data if d['precipitation'] is not None])
    avg_humidity = np.mean([d['humidity'] for d in historical_data if d['humidity'] is not None])
    avg_wind = np.mean([d['wind_speed'] for d in historical_data if d['wind_speed'] is not None])
    
    # Calculate rain probability (days with >1mm rain)
    rainy_days = sum(1 for d in historical_data if d['precipitation'] and d['precipitation'] > 1.0)
    rain_probability = rainy_days / len(historical_data) if historical_data else 0.18
    
    # Add realistic variation for race day
    import random
    random.seed(42)
    
    temperature = avg_temp + random.uniform(-1.5, 1.5)
    humidity = avg_humidity + random.uniform(-5, 5)
    wind_speed = avg_wind + random.uniform(-1, 1)
    
    print(f"\n📊 Historical March Analysis (based on {len(historical_data)} data points):")
    print(f"Average temperature: {avg_temp:.1f}°C (range: {avg_temp_min:.1f}-{avg_temp_max:.1f}°C)")
    print(f"Rain frequency: {rain_probability*100:.0f}% of days")
    print(f"Average humidity: {avg_humidity:.0f}%")
    print(f"Average wind speed: {avg_wind:.1f} m/s")
    
    # Show year-by-year for context
    print(f"\n📅 Recent March race weekends in Melbourne:")
    years_summary = {}
    for d in historical_data:
        year = d['year']
        if year not in years_summary:
            years_summary[year] = {'temps': [], 'rain': []}
        years_summary[year]['temps'].append(d['temp_mean'])
        years_summary[year]['rain'].append(d['precipitation'])
    
    for year in sorted(years_summary.keys(), reverse=True):
        year_data = years_summary[year]
        avg_temp_year = np.mean(year_data['temps'])
        total_rain = sum(year_data['rain'])
        print(f"  {year}: {avg_temp_year:.1f}°C, {total_rain:.1f}mm rain")
    
else:
    # Fallback to manually set historical averages if API fails
    print("⚠️ Could not fetch historical data, using typical March averages...")
    
    HISTORICAL_MARCH_WEATHER = {
        "avg_temperature": 23,
        "rain_probability": 0.18,
        "humidity": 62,
        "wind_speed": 4.2,
    }
    
    import random
    random.seed(42)
    
    temperature = HISTORICAL_MARCH_WEATHER["avg_temperature"] + random.uniform(-2, 2)
    rain_probability = HISTORICAL_MARCH_WEATHER["rain_probability"] + random.uniform(-0.05, 0.10)
    humidity = HISTORICAL_MARCH_WEATHER["humidity"] + random.uniform(-5, 5)
    wind_speed = HISTORICAL_MARCH_WEATHER["wind_speed"] + random.uniform(-1, 1.5)

# Ensure values are within reasonable bounds
temperature = max(15, min(35, temperature))
rain_probability = max(0, min(1, rain_probability))
humidity = max(40, min(90, humidity))
wind_speed = max(0, min(15, wind_speed))

print(f"\n🎯 2025 Race Day Prediction (March 16):")
print(f"Temperature: {temperature:.1f}°C")
print(f"Rain probability: {rain_probability*100:.0f}%")
print(f"Humidity: {humidity:.0f}%")
print(f"Wind: {wind_speed:.1f} m/s")

# ========== SECTION 5: 2025 QUALIFYING DATA ==========
print("\n🏎️ Processing 2025 Australian GP Qualifying Data...")

# Helper function for time formatting
def format_time(seconds):
    """Convert seconds to MM:SS.sss format"""
    if pd.isna(seconds) or seconds is None:
        return "No Time"
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes}:{secs:06.3f}"

qualifying_2025 = pd.DataFrame({
    "Driver": ["NOR", "PIA", "VER", "RUS", "TSU",
               "ALB", "LEC", "HAM", "GAS", "SAI", "ALO", "STR"],
    "DriverFullName": ["Lando Norris", "Oscar Piastri", "Max Verstappen", "George Russell", 
                       "Yuki Tsunoda", "Alexander Albon", "Charles Leclerc", "Lewis Hamilton", 
                       "Pierre Gasly", "Carlos Sainz", "Fernando Alonso", "Lance Stroll"],
    "QualifyingTime (s)": [75.096, 75.180, 75.481, 75.546, 75.670,
                           75.737, 75.755, 75.973, 75.980, 76.062, 76.400, 76.500],
    "QualifyingTime_Display": ["1:15.096", "1:15.180", "1:15.481", "1:15.546", "1:15.670",
                               "1:15.737", "1:15.755", "1:15.973", "1:15.980", "1:16.062", 
                               "1:16.400", "1:16.500"],
    "QualifyingPosition": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
})

print("\n📋 QUALIFYING RESULTS:")
print("-" * 50)
for _, row in qualifying_2025.iterrows():
    print(f"P{row['QualifyingPosition']:2d}: {row['Driver']:3s} ({row['DriverFullName']:20s}) - {row['QualifyingTime_Display']}")

# ========== SECTION 6: DRIVER & TEAM CHANGES FOR 2025 ==========
print("\n🔄 Processing driver changes for 2025...")

driver_changes_2025 = {
    "HAM": {"from": "Mercedes", "to": "Ferrari", "adaptation_factor": 1.02},  # New team penalty
    "SAI": {"from": "Ferrari", "to": "Williams", "adaptation_factor": 1.01},
    "HUL": {"from": "Haas", "to": "Kick Sauber", "adaptation_factor": 1.005},
    # Other drivers stay with same teams
}

# ========== SECTION 7: CALCULATE ENHANCED FEATURES ==========
print("\n🔧 Calculating enhanced features based on all data sources...")

# Base race pace from testing long runs
qualifying_2025["TestingPace"] = qualifying_2025["Driver"].map(preseason_testing["Long_Run_Pace"]).fillna(94.0)

# Testing reliability factor (based on team laps completed)
driver_to_team_2025 = {
    "VER": "Red Bull", "NOR": "McLaren", "PIA": "McLaren", 
    "LEC": "Ferrari", "HAM": "Ferrari",  # Hamilton moved
    "RUS": "Mercedes", "SAI": "Williams",  # Sainz moved
    "GAS": "Alpine", "ALO": "Aston Martin", 
    "TSU": "Racing Bulls", "HUL": "Kick Sauber", 
    "OCO": "Alpine", "STR": "Aston Martin", "ALB": "Williams"
}

team_reliability = {}
max_laps = max(preseason_testing["Laps_Completed"].values())
for team, laps in preseason_testing["Laps_Completed"].items():
    team_reliability[team] = laps / max_laps

qualifying_2025["Team"] = qualifying_2025["Driver"].map(driver_to_team_2025)
qualifying_2025["ReliabilityScore"] = qualifying_2025["Team"].map(team_reliability).fillna(0.7)

# Late 2024 momentum
qualifying_2025["Late2024Momentum"] = qualifying_2025["Driver"].map(late_2024_momentum).fillna(10)

# Team trajectory based on 2024 finish and testing
team_trajectory = {
    "McLaren": 1.00,   # Maintained championship form
    "Ferrari": 1.02,   # Strong finish to 2024
    "Red Bull": 0.98,  # Lost some dominance
    "Mercedes": 1.03,  # Improving trajectory
    "Aston Martin": 0.95,  # Struggled late 2024
    "Alpine": 1.01,
    "Williams": 1.02,  # Getting Sainz boost
    "Racing Bulls": 1.00,
    "Kick Sauber": 0.98,
    "Haas": 0.99
}
qualifying_2025["TeamTrajectory"] = qualifying_2025["Team"].map(team_trajectory).fillna(1.0)

# Testing vs Qualifying correlation (how well testing predicted quali)
testing_quali_delta = {}
for driver in qualifying_2025["Driver"]:
    if driver in preseason_testing["Fastest_Laps"]:
        testing_pos = sorted(preseason_testing["Fastest_Laps"].items(), key=lambda x: x[1]).index((driver, preseason_testing["Fastest_Laps"][driver])) + 1
        quali_pos = qualifying_2025[qualifying_2025["Driver"] == driver]["QualifyingPosition"].values[0]
        testing_quali_delta[driver] = abs(testing_pos - quali_pos) / 10  # Normalize
    else:
        testing_quali_delta[driver] = 0.5

qualifying_2025["TestingAccuracy"] = qualifying_2025["Driver"].map(testing_quali_delta)

# Driver adaptation factor (for those who changed teams)
adaptation_factors = {}
for driver in qualifying_2025["Driver"]:
    if driver in driver_changes_2025:
        adaptation_factors[driver] = driver_changes_2025[driver]["adaptation_factor"]
    else:
        adaptation_factors[driver] = 1.0  # No change

qualifying_2025["AdaptationFactor"] = qualifying_2025["Driver"].map(adaptation_factors)

# Weather-adjusted qualifying
driver_wet_performance = {
    "VER": 0.975, "HAM": 0.976, "LEC": 0.976, "NOR": 0.978,
    "ALO": 0.973, "RUS": 0.969, "SAI": 0.979, "TSU": 0.996,
    "OCO": 0.982, "GAS": 0.979, "STR": 0.980, "PIA": 0.985,
    "ALB": 0.988, "HUL": 0.990
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

# Year-over-year improvement at Albert Park (historical data)
albert_park_improvement = {
    "VER": 0.98,  # Consistently fast here
    "HAM": 0.97,  # Multiple wins
    "LEC": 0.99,
    "NOR": 0.99,
    "PIA": 0.98,  # Home advantage
    "RUS": 0.99,
    "SAI": 1.00,
    "ALO": 0.98,  # Experience
    "TSU": 1.01,
    "OCO": 1.01,
    "GAS": 1.00,
    "STR": 1.02,
    "ALB": 1.01,
    "HUL": 1.02
}
qualifying_2025["AlbertParkFactor"] = qualifying_2025["Driver"].map(albert_park_improvement).fillna(1.0)

# ========== SECTION 8: MERGE ALL DATA ==========
print("\n🔄 Merging all data sources...")

merged_data = qualifying_2025.merge(
    sector_times_2024[["Driver", "TotalSectorTime (s)"]], 
    on="Driver", 
    how="left"
)

# Add weather and calculated features
merged_data["RainProbability"] = rain_probability
merged_data["Temperature"] = temperature
merged_data["Humidity"] = humidity / 100
merged_data["WindSpeed"] = wind_speed / 10
merged_data["StartingPositionAdvantage"] = 1 / (merged_data["QualifyingPosition"] ** 0.5)

# Season opener specific features
merged_data["IsSeasonOpener"] = 1  # Binary flag
merged_data["PreSeasonTestingWeight"] = 0.3  # How much to weight testing data

# Filter for drivers with data
valid_drivers = merged_data["Driver"].isin(laps_2024["Driver"].unique())
merged_data_filtered = merged_data[valid_drivers].copy()

print(f"\n📊 Data Summary:")
print(f"Drivers with complete data: {len(merged_data_filtered)}")
print(f"Features from: Pre-season testing + Late 2024 + Historical Melbourne data")

# ========== SECTION 9: FEATURE ENGINEERING ==========
print("\n🔧 Preparing comprehensive feature set...")

feature_columns = [
    "WeatherAdjustedQualifying",
    "TestingPace",               # From pre-season testing
    "ReliabilityScore",           # Team reliability from testing
    "Late2024Momentum",           # Form from end of 2024
    "TeamTrajectory",             # Team improvement trend
    "TestingAccuracy",            # How well testing predicted quali
    "AdaptationFactor",           # Driver team changes
    "AlbertParkFactor",           # Track-specific performance
    "RainProbability",
    "Temperature",
    "Humidity",
    "WindSpeed",
    "StartingPositionAdvantage",
    "TotalSectorTime (s)",
    "WetPerformanceFactor"
]

X = merged_data_filtered[feature_columns].copy()
y = laps_2024.groupby("Driver")["LapTime (s)"].mean().reindex(merged_data_filtered["Driver"])

# Impute missing values
imputer = SimpleImputer(strategy="median")
X_imputed = imputer.fit_transform(X)

print(f"Feature set: {X.shape[1]} features including testing and late 2024 data")

# ========== SECTION 10: MODEL TRAINING ==========
print("\n🤖 Training enhanced season-opener model...")

if len(X_imputed) < 4:
    X_train, y_train = X_imputed, y
    X_test, y_test = X_imputed, y
else:
    test_size = min(0.3, max(0.2, 3/len(X_imputed)))
    X_train, X_test, y_train, y_test = train_test_split(
        X_imputed, y, test_size=test_size, random_state=42
    )

# Enhanced model with more trees for season opener uncertainty
model = GradientBoostingRegressor(
    n_estimators=200,  # More trees for season opener
    learning_rate=0.03,  # Lower learning rate for stability
    max_depth=5,
    min_samples_split=2,
    min_samples_leaf=1,
    subsample=0.8,
    random_state=42,
    verbose=0
)

model.fit(X_train, y_train)
print("Model training complete!")

# ========== SECTION 11: PREDICTIONS WITH SEASON-OPENER ADJUSTMENTS ==========
print("\n🎯 Generating season-opener predictions...")

merged_data_filtered["PredictedRaceTime (s)"] = model.predict(X_imputed)

# Apply season-opener specific adjustments
for idx, row in merged_data_filtered.iterrows():
    # Testing correlation adjustment
    testing_weight = 0.15  # How much to trust testing times
    if row["Driver"] in preseason_testing["Long_Run_Pace"]:
        testing_adjustment = (row["TestingPace"] - 92.5) * testing_weight
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] += testing_adjustment
    
    # New team penalty (for Hamilton, Sainz, etc.)
    if row["AdaptationFactor"] > 1.0:
        merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] *= row["AdaptationFactor"]
    
    # Qualifying position influence (less than street circuits)
    quali_position = row["QualifyingPosition"]
    position_weight = 0.05
    quali_adjustment = (quali_position - 1) * 0.15 * position_weight
    merged_data_filtered.loc[idx, "PredictedRaceTime (s)"] += quali_adjustment

# Sort by predicted race time
final_results = merged_data_filtered.sort_values("PredictedRaceTime (s)").reset_index(drop=True)

# ========== SECTION 12: RESULTS OUTPUT ==========
print("\n" + "="*70)
print("🏁 2025 AUSTRALIAN GRAND PRIX - PREDICTED RESULTS 🏁")
print("="*70)
print("SEASON OPENER - Using pre-season testing & late 2024 performance")
print("="*70)

# Display full race prediction
print("\n📋 FULL PREDICTED RACE ORDER:")
print("-" * 90)
print(f"{'Pos':<4} {'Driver':<8} {'Name':<20} {'Predicted':<12} {'Gap':<10} {'Quali':<8} {'Testing'}")
print("-" * 90)

for i, row in final_results.iterrows():
    time_behind = 0 if i == 0 else row["PredictedRaceTime (s)"] - final_results.iloc[0]["PredictedRaceTime (s)"]
    
    print(f"P{i+1:<3} {row['Driver']:<8} {row['DriverFullName']:<20} {format_time(row['PredictedRaceTime (s)']):<12}", end="")
    
    if i > 0:
        print(f"+{time_behind:6.3f}s", end="  ")
    else:
        print(f"{'Leader':<10}", end="")
    
    # Position change from qualifying
    quali_change = row['QualifyingPosition'] - (i + 1)
    if quali_change > 0:
        change_str = f"↑{quali_change}"
    elif quali_change < 0:
        change_str = f"↓{abs(quali_change)}"
    else:
        change_str = "→"
    
    print(f"P{row['QualifyingPosition']:<2} ({change_str:3})", end="  ")
    print(f"{format_time(row['TestingPace'])}")

# Model metrics
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)

print(f"\n📊 MODEL PERFORMANCE:")
print(f"Mean Absolute Error: {mae:.3f} seconds")
print(f"Features used: {X.shape[1]} (including testing & late 2024 data)")

# Podium prediction with detailed analysis
if len(final_results) >= 3:
    print("\n" + "="*60)
    print("🏆 PREDICTED PODIUM - AUSTRALIAN GP 2025 🏆")
    print("="*60)
    
    podium = final_results.loc[:2]
    medals = ["🥇", "🥈", "🥉"]
    
    for i, (idx, row) in enumerate(podium.iterrows()):
        print(f"\n{medals[i]} P{i+1}: {row['Driver']} - {row['DriverFullName']}")
        print(f"   Predicted Race Time: {format_time(row['PredictedRaceTime (s)'])}")
        print(f"   Qualified: P{row['QualifyingPosition']}")
        print(f"   Testing Pace: {format_time(row['TestingPace'])}")
        print(f"   Late 2024 Momentum: {row['Late2024Momentum']:.1f}")
        print(f"   Team: {row['Team']}")
        
        # Special notes for driver changes
        if row['Driver'] == 'HAM':
            print(f"   ⚠️ New team (Ferrari) - adaptation period expected")
        elif row['Driver'] == 'SAI':
            print(f"   ⚠️ New team (Williams) - adaptation period expected")
        
        # Position change
        quali_change = row['QualifyingPosition'] - (i + 1)
        if quali_change != 0:
            change_dir = "gained" if quali_change > 0 else "lost"
            print(f"   Position Change: {change_dir} {abs(quali_change)} place(s)")

# Key insights section
print("\n" + "="*60)
print("💡 KEY INSIGHTS - SEASON OPENER")
print("="*60)

# Testing correlation
print("\n📊 PRE-SEASON TESTING CORRELATION:")
testing_order = sorted(preseason_testing["Fastest_Laps"].items(), key=lambda x: x[1])[:5]
print("Top 5 in testing:")
for i, (driver, time) in enumerate(testing_order):
    predicted_pos = final_results[final_results['Driver'] == driver].index[0] + 1 if driver in final_results['Driver'].values else 'N/A'
    print(f"  Testing P{i+1}: {driver} ({format_time(time)}) → Predicted P{predicted_pos}")

# Team performance expectations
print("\n🏁 TEAM PERFORMANCE OUTLOOK:")
team_avg_positions = final_results.groupby('Team').apply(lambda x: x.index[0] + 1 if len(x) > 0 else 20).sort_values()
for team, avg_pos in team_avg_positions.items():
    trajectory = team_trajectory.get(team, 1.0)
    trend = "↑" if trajectory > 1.0 else "↓" if trajectory < 1.0 else "→"
    print(f"  {team}: Best predicted P{avg_pos} {trend}")

# Driver changes impact
print("\n🔄 DRIVER CHANGES IMPACT:")
for driver, change_info in driver_changes_2025.items():
    if driver in final_results['Driver'].values:
        predicted_pos = final_results[final_results['Driver'] == driver].index[0] + 1
        print(f"  {driver}: {change_info['from']} → {change_info['to']} (Predicted P{predicted_pos})")

# Feature importance
print("\n📈 TOP PREDICTIVE FACTORS:")
feature_importance = model.feature_importances_
importance_df = pd.DataFrame({
    'Feature': feature_columns,
    'Importance': feature_importance
}).sort_values('Importance', ascending=False)

for i, row in importance_df.head(5).iterrows():
    print(f"  {row['Feature']:30s}: {row['Importance']:.3f}")

# Weather impact analysis at the end
print(f"\n🌤️ WEATHER IMPACT (March Historical Data):")
print(f"Temperature: {temperature:.1f}°C (Typical March: 20-26°C)")
print(f"Rain: {rain_probability*100:.0f}% chance")
print(f"Humidity: {humidity:.0f}%")
print(f"Wind: {wind_speed:.1f} m/s")

if rain_probability > 0.3:
    print("⚠️ Higher than average rain probability for March")
    print("   Could favor drivers with strong wet weather skills")
    wet_specialists = ["VER", "HAM", "ALO", "RUS"]
    for driver in wet_specialists:
        if driver in final_results['Driver'].values:
            pos = final_results[final_results['Driver'] == driver].index[0] + 1
            print(f"   {driver}: Wet specialist at P{pos}")
elif rain_probability < 0.1:
    print("☀️ Dry conditions expected - typical March weather")
else:
    print("⛅ Typical March conditions - dry with slight rain chance")

# Additional March-specific notes
print("\n📅 MARCH RACE CONDITIONS AT ALBERT PARK:")
print("• Autumn in Melbourne - generally stable weather")
print("• Track temperature typically 35-45°C in March sunshine")
print("• Lower sun angle than summer races - different shadows/visibility")
print("• First race of season - track will be green (low rubber)")
print("• Cooler than October-November (when you ran this simulation)")

# ========== SECTION 13: VISUALIZATIONS ==========
print("\n📊 Generating visualizations...")

# Plot 1: Testing vs Predicted Race Position
plt.figure(figsize=(14, 8))
final_results['PredictedPosition'] = range(1, len(final_results) + 1)

# Get testing positions
testing_positions = {}
testing_sorted = sorted(preseason_testing["Long_Run_Pace"].items(), key=lambda x: x[1])
for i, (driver, _) in enumerate(testing_sorted):
    testing_positions[driver] = i + 1

final_results['TestingPosition'] = final_results['Driver'].map(testing_positions).fillna(20)

plt.scatter(final_results['TestingPosition'], 
           final_results['PredictedPosition'],
           s=200,
           c=final_results['Late2024Momentum'],
           cmap='RdYlGn',
           alpha=0.7,
           edgecolors='black',
           linewidth=2)

for i, row in final_results.iterrows():
    plt.annotate(row['Driver'],
                (row['TestingPosition'], row['PredictedPosition']),
                xytext=(5, 5),
                textcoords='offset points',
                fontsize=11,
                fontweight='bold')

plt.plot([0, 15], [0, 15], 'k--', alpha=0.3, label='Perfect correlation')
plt.colorbar(label='Late 2024 Momentum')
plt.xlabel('Pre-Season Testing Position', fontsize=12)
plt.ylabel('Predicted Race Position', fontsize=12)
plt.title('Australian GP 2025: Testing vs Predicted Race Positions (Season Opener)', fontsize=14, fontweight='bold')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

# Plot 2: Feature Importance
plt.figure(figsize=(10, 8))
top_features = importance_df.head(10)
colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(top_features)))
bars = plt.barh(range(len(top_features)), top_features['Importance'], color=colors)
plt.yticks(range(len(top_features)), top_features['Feature'])
plt.xlabel("Importance", fontsize=12)
plt.title("Feature Importance - Season Opener Prediction Model", fontsize=14, fontweight='bold')
plt.gca().invert_yaxis()

for bar, value in zip(bars, top_features['Importance']):
    plt.text(value, bar.get_y() + bar.get_height()/2, 
            f'{value:.3f}', 
            ha='left', va='center', fontsize=9)

plt.tight_layout()
plt.show()

# Plot 3: Late 2024 Momentum vs Predicted Position
plt.figure(figsize=(12, 6))
bars = plt.bar(final_results['Driver'], 
              final_results['Late2024Momentum'],
              color=['green' if m > 12 else 'red' if m < 8 else 'yellow' 
                     for m in final_results['Late2024Momentum']])

plt.axhline(y=10, color='black', linestyle='--', alpha=0.5, label='Average momentum')
plt.xlabel('Driver (by predicted finish order)', fontsize=12)
plt.ylabel('Late 2024 Momentum Score', fontsize=12)
plt.title('Driver Momentum from Late 2024 Season', fontsize=14, fontweight='bold')
plt.xticks(rotation=45)
plt.legend()
plt.tight_layout()
plt.show()

print("\n" + "="*70)
print("✅ SEASON OPENER PREDICTION COMPLETE")
print("="*70)
print("\nNote: This prediction heavily weights pre-season testing data")
print("and late 2024 performance since no 2025 races have occurred yet.")
print("Actual race may vary significantly as teams reveal true pace!")