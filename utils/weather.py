"""Real-time race-day weather forecast via Open-Meteo (free, no API key)."""
from datetime import datetime, timedelta

import requests

# Used when the forecast API call fails. Predictions assume a mild dry day.
NEUTRAL_FALLBACK = {
    "temperature": 20.0,
    "rain_probability": 0.10,
    "humidity": 60.0,
    "wind_speed": 4.0,
    "description": "fallback (API failed)",
    "source": "NEUTRAL_FALLBACK",
}


def _next_sunday(today=None):
    """Return the YYYY-MM-DD of the next Sunday. If today is Sunday, returns next week."""
    today = today or datetime.now()
    days_ahead = (6 - today.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")


def fetch_race_day_weather(lat, lon, race_date=None, timezone="auto"):
    """Open-Meteo forecast for the given coordinates and date.

    Args:
        lat, lon: circuit latitude / longitude.
        race_date: 'YYYY-MM-DD' for the target race day. Defaults to next Sunday.
        timezone: Open-Meteo tz string. 'auto' uses the location's local time.

    Returns: dict with keys temperature, rain_probability, humidity, wind_speed,
    description, source. On failure, returns NEUTRAL_FALLBACK with a warning.
    """
    if race_date is None:
        race_date = _next_sunday()

    url = (
        "https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        "&daily=temperature_2m_max,temperature_2m_min,"
        "precipitation_probability_max,"
        "windspeed_10m_max,relative_humidity_2m_mean"
        f"&timezone={timezone}"
        f"&start_date={race_date}&end_date={race_date}"
    )

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        daily = response.json().get("daily", {})

        if not daily.get("time"):
            raise ValueError(f"Open-Meteo returned no daily data for {race_date}")

        return {
            "temperature": (daily["temperature_2m_max"][0] + daily["temperature_2m_min"][0]) / 2,
            "rain_probability": (daily.get("precipitation_probability_max", [0])[0] or 0) / 100,
            "humidity": daily.get("relative_humidity_2m_mean", [60])[0] or 60,
            "wind_speed": daily.get("windspeed_10m_max", [4])[0] or 4,
            "description": f"Open-Meteo forecast for {race_date}",
            "source": "open-meteo",
        }
    except Exception as exc:
        print(f"⚠️ Weather forecast fetch failed for ({lat}, {lon}) on {race_date}: {exc}")
        print("   Using NEUTRAL_FALLBACK — predictions assume mild dry conditions.")
        return {**NEUTRAL_FALLBACK, "description": f"fallback (API failed: {exc})"}
