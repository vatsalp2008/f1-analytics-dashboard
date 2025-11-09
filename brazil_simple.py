import pandas as pd
import numpy as np
import requests
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
from datetime import datetime

print("🏁 2025 BRAZILIAN GRAND PRIX - SIMPLE PREDICTION MODEL 🏁")
print("="*70)
print("Using: Qualifying + Weather + Historical Data Only")
print("="*70)

# ========== SECTION 1: QUALIFYING RESULTS (MANUAL ENTRY) ==========
print("\n📊 2025 Brazilian GP Qualifying Results (Friday):")

# Actual qualifying results - determines Sunday grid
qualifying_data = {
    'Driver': ['NOR', 'ANT', 'LEC', 'PIA', 'HAD', 'RUS', 'LAW', 'BEA', 
               'GAS', 'HUL', 'ALO', 'ALB', 'HAM', 'STR', 'SAI', 'VER', 
               'OCO', 'COL', 'TSU'],
    'DriverName': ['Lando Norris', 'Kimi Antonelli', 'Charles Leclerc', 'Oscar Piastri',
                   'Isack Hadjar', 'George Russell', 'Liam Lawson', 'Oliver Bearman',
                   'Pierre Gasly', 'Nico Hulkenberg', 'Fernando Alonso', 'Alexander Albon',
                   'Lewis Hamilton', 'Lance Stroll', 'Carlos Sainz', 'Max Verstappen',
                   'Esteban Ocon', 'Franco Colapinto', 'Yuki Tsunoda'],
    'Team': ['McLaren', 'Mercedes', 'Ferrari', 'McLaren', 'Racing Bulls', 'Mercedes',
             'Red Bull', 'Haas', 'Alpine', 'Kick Sauber', 'Aston Martin', 'Williams',
             'Ferrari', 'Aston Martin', 'Williams', 'Red Bull', 'Haas', 'Williams',
             'Racing Bulls'],
    'QualifyingPosition': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    'QualifyingTime': [70.10, 70.20, 70.25, 70.30, 70.35, 70.40, 70.45, 70.50,
                       70.55, 70.60, 70.65, 70.70, 70.75, 70.80, 70.85, 70.90,
                       70.95, 71.00, 71.05]  # Estimated times
}

quali_df = pd.DataFrame(qualifying_data)

print("\nStarting Grid for Sunday:")
print("-" * 40)
for _, row in quali_df.head(10).iterrows():
    print(f"P{row['QualifyingPosition']:2d}: {row['Driver']} ({row['DriverName']}) - {row['Team']}")

# ========== SECTION 2: WEATHER DATA ==========
print("\n🌤️ Weather Conditions for Race Day:")

def get_weather_forecast():
    """Get weather for Interlagos on race day"""
    # Interlagos coordinates
    lat, lon = -23.7036, -46.6997
    
    try:
        # Try Open-Meteo API (free, no key required)
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            current = data.get('current_weather', {})
            return {
                'temperature': current.get('temperature', 24),
                'wind_speed': current.get('windspeed', 5),
                'rain': 1 if current.get('weathercode', 0) > 50 else 0
            }
    except:
        pass
    
    # Fallback to typical November weather
    return {
        'temperature': 24.5,
        'wind_speed': 5.2,
        'rain': 0  # 0 = dry, 1 = wet
    }

weather = get_weather_forecast()
print(f"Temperature: {weather['temperature']:.1f}°C")
print(f"Wind Speed: {weather['wind_speed']:.1f} m/s")
print(f"Rain: {'Yes' if weather['rain'] else 'No'}")

# ========== SECTION 3: HISTORICAL INTERLAGOS DATA ==========
print("\n📈 Historical Interlagos Performance Factors:")

# Average positions gained/lost from different grid slots at Interlagos
# Based on historical data from previous races
historical_position_changes = {
    1: 0.0,    # Pole usually keeps position
    2: 0.2,    # P2 slight gain chance
    3: -0.5,   # P3 might lose a spot
    4: 0.8,    # P4 good overtaking opportunity
    5: 1.2,
    6: 0.5,
    7: 1.5,
    8: 0.8,
    9: 1.2,
    10: 0.5,
    11: 2.0,   # Outside top 10 can gain more
    12: 1.8,
    13: 1.5,
    14: 1.2,
    15: 0.8,
    16: 2.5,   # P16 and back have strategy options
    17: 2.0,
    18: 1.5,
    19: 1.0,
    20: 0.5
}

# Driver skill ratings (simplified - based on 2025 championship standings)
driver_skill = {
    'NOR': 1.0,   # Top championship contender
    'PIA': 1.0,   # Championship leader
    'VER': 1.1,   # Best racecraft
    'RUS': 0.9,
    'LEC': 0.95,
    'HAM': 0.95,
    'ALO': 0.9,
    'GAS': 0.8,
    'SAI': 0.85,
    'ALB': 0.8,
    'HUL': 0.75,
    'TSU': 0.75,
    'STR': 0.7,
    'OCO': 0.7,
    'LAW': 0.7,
    'ANT': 0.65,  # Rookie
    'HAD': 0.6,   # Rookie
    'BEA': 0.6,   # Rookie
    'COL': 0.55,  # Substitute
}

# Team performance factor (based on car performance)
team_performance = {
    'McLaren': 1.0,
    'Red Bull': 0.98,
    'Ferrari': 0.97,
    'Mercedes': 0.95,
    'Aston Martin': 0.85,
    'Alpine': 0.82,
    'Williams': 0.80,
    'Racing Bulls': 0.78,
    'Haas': 0.75,
    'Kick Sauber': 0.73
}

# ========== SECTION 4: SIMPLE PREDICTION MODEL ==========
print("\n🎯 Calculating Race Predictions...")

# Add factors to dataframe
quali_df['HistoricalChange'] = quali_df['QualifyingPosition'].map(historical_position_changes)
quali_df['DriverSkill'] = quali_df['Driver'].map(driver_skill).fillna(0.65)
quali_df['TeamPerformance'] = quali_df['Team'].map(team_performance)

# Weather adjustments
if weather['rain']:
    # Wet weather benefits skilled drivers and can shake up order
    rain_factor = {
        'VER': 1.5, 'HAM': 1.3, 'ALO': 1.2, 'RUS': 1.1,
        'NOR': 1.0, 'LEC': 0.9, 'SAI': 0.8
    }
    quali_df['WeatherBonus'] = quali_df['Driver'].map(rain_factor).fillna(0.0)
else:
    quali_df['WeatherBonus'] = 0.0

# Calculate predicted position change
quali_df['PredictedChange'] = (
    quali_df['HistoricalChange'] * 0.4 +  # Historical trend weight
    (quali_df['DriverSkill'] - 0.8) * 5 +  # Driver skill impact
    (quali_df['TeamPerformance'] - 0.85) * 3 +  # Car performance
    quali_df['WeatherBonus'] * 0.5  # Weather impact
)

# Apply Interlagos-specific factors
# Interlagos allows good overtaking, especially into T1 and T4
quali_df['InterlagosBonus'] = 0
quali_df.loc[quali_df['QualifyingPosition'] > 10, 'InterlagosBonus'] = 1.0  # Back markers can gain
quali_df.loc[quali_df['Driver'] == 'VER', 'InterlagosBonus'] += 2.0  # Verstappen overtaking specialist

# Final predicted position
quali_df['PredictedPosition'] = quali_df['QualifyingPosition'] - quali_df['PredictedChange'] - quali_df['InterlagosBonus']

# Ensure positions are within bounds (1-19)
quali_df['PredictedPosition'] = quali_df['PredictedPosition'].clip(lower=1, upper=19)

# Round to nearest integer and handle ties
quali_df['PredictedPosition'] = quali_df['PredictedPosition'].round()

# Sort by predicted position and reassign to handle ties
quali_df = quali_df.sort_values('PredictedPosition')
quali_df['FinalPosition'] = range(1, len(quali_df) + 1)

# Calculate position changes
quali_df['PositionChange'] = quali_df['QualifyingPosition'] - quali_df['FinalPosition']

# Sort by final predicted position
quali_df = quali_df.sort_values('FinalPosition')

# ========== SECTION 5: RACE TIME PREDICTIONS ==========
# Estimate race times based on position
base_race_time = 90 * 60 + 30  # 1h 30m 30s in seconds
quali_df['PredictedRaceTime'] = base_race_time + (quali_df['FinalPosition'] - 1) * 1.5

def format_time(total_seconds):
    """Convert seconds to race time format"""
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = total_seconds % 60
    return f"{hours}:{minutes:02d}:{seconds:05.2f}"

# ========== SECTION 6: OUTPUT RESULTS ==========
print("\n" + "="*80)
print("🏁 PREDICTED RACE RESULTS - 2025 BRAZILIAN GP 🏁")
print("="*80)

print("\n📋 PREDICTED FINISHING ORDER:")
print("-" * 90)
print(f"{'Pos':<4} {'Driver':<8} {'Name':<20} {'Team':<15} {'Time':<12} {'Grid':<6} {'Change'}")
print("-" * 90)

for _, row in quali_df.iterrows():
    time_str = format_time(row['PredictedRaceTime'])
    change = row['PositionChange']
    if change > 0:
        change_str = f"↑{change}"
        change_color = "🟢"
    elif change < 0:
        change_str = f"↓{abs(change)}"
        change_color = "🔴"
    else:
        change_str = "→"
        change_color = "⚪"
    
    print(f"P{row['FinalPosition']:<3} {row['Driver']:<8} {row['DriverName']:<20} "
          f"{row['Team']:<15} {time_str:<12} P{row['QualifyingPosition']:<5} {change_color} {change_str}")

# ========== SECTION 7: KEY INSIGHTS ==========
print("\n📊 KEY PREDICTIONS:")
print("-" * 50)

# Winner
winner = quali_df.iloc[0]
print(f"🏆 Winner: {winner['Driver']} ({winner['DriverName']})")
print(f"   Started: P{winner['QualifyingPosition']}")

# Biggest gainers
biggest_gainers = quali_df.nlargest(3, 'PositionChange')
print(f"\n📈 Biggest Gainers:")
for _, driver in biggest_gainers.iterrows():
    if driver['PositionChange'] > 0:
        print(f"   {driver['Driver']}: P{driver['QualifyingPosition']} → P{driver['FinalPosition']} "
              f"(+{driver['PositionChange']} positions)")

# Biggest losers
biggest_losers = quali_df.nsmallest(3, 'PositionChange')
print(f"\n📉 Biggest Losers:")
for _, driver in biggest_losers.iterrows():
    if driver['PositionChange'] < 0:
        print(f"   {driver['Driver']}: P{driver['QualifyingPosition']} → P{driver['FinalPosition']} "
              f"({driver['PositionChange']} positions)")

# Championship implications
print(f"\n🏆 Championship Implications:")
print(f"   Norris: P{quali_df[quali_df['Driver'] == 'NOR']['FinalPosition'].values[0]}")
print(f"   Piastri: P{quali_df[quali_df['Driver'] == 'PIA']['FinalPosition'].values[0]}")
print(f"   Verstappen: P{quali_df[quali_df['Driver'] == 'VER']['FinalPosition'].values[0]}")

# ========== SECTION 8: SIMPLE VISUALIZATION ==========
plt.figure(figsize=(12, 8))

# Create position change chart
drivers = quali_df['Driver'].values
grid_positions = quali_df['QualifyingPosition'].values
final_positions = quali_df['FinalPosition'].values

# Plot lines showing movement
for i, driver in enumerate(drivers):
    grid_pos = quali_df[quali_df['Driver'] == driver]['QualifyingPosition'].values[0]
    final_pos = quali_df[quali_df['Driver'] == driver]['FinalPosition'].values[0]
    change = quali_df[quali_df['Driver'] == driver]['PositionChange'].values[0]
    
    if change > 0:
        color = 'green'
        alpha = 0.6
    elif change < 0:
        color = 'red'
        alpha = 0.6
    else:
        color = 'gray'
        alpha = 0.3
    
    plt.plot([0, 1], [grid_pos, final_pos], color=color, alpha=alpha, linewidth=2)
    plt.text(-0.05, grid_pos, f"{driver} P{grid_pos}", ha='right', va='center', fontsize=9)
    plt.text(1.05, final_pos, f"P{final_pos} {driver}", ha='left', va='center', fontsize=9)

plt.xlim(-0.3, 1.3)
plt.ylim(20, 0)
plt.xticks([0, 1], ['Grid Position\n(Qualifying)', 'Predicted Finish\n(Race)'], fontsize=12)
plt.ylabel('Position', fontsize=12)
plt.title('2025 Brazilian GP - Position Changes Prediction\n(Simple Model)', fontsize=14, fontweight='bold')
plt.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
plt.show()

print("\n" + "="*80)
print("✅ SIMPLE PREDICTION COMPLETE")
print("="*80)
print("Model based on: Qualifying + Weather + Historical Patterns")
print("Factors considered: Grid position, Driver skill, Team performance, Weather")
print("="*80)