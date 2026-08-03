import React, { useMemo } from 'react';
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';

const WeatherImpact = ({ weather, frames }) => {
  const weatherImpact = useMemo(() => {
    if (!weather || !frames) return null;

    const drivers = {};
    frames.forEach((frame) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!drivers[code]) {
          drivers[code] = {
            code,
            speeds: [],
            positions: [],
          };
        }
        drivers[code].speeds.push(data.speed);
        drivers[code].positions.push(data.position);
      });
    });

    return {
      temperature: weather.temperature || 20,
      humidity: weather.humidity || 60,
      rainProbability: (weather.rain_probability || 0) * 100,
      windSpeed: weather.wind_speed || 0,
      driverCount: Object.keys(drivers).length,
      avgSpeed:
        Object.values(drivers).reduce((sum, d) => sum + (d.speeds.reduce((a, b) => a + b, 0) / d.speeds.length || 0), 0) /
          Object.keys(drivers).length || 0,
    };
  }, [weather, frames]);

  if (!weatherImpact) return null;

  const getWeatherRating = () => {
    if (weatherImpact.rainProbability > 70) return { label: 'Wet', color: '#00bfff' };
    if (weatherImpact.rainProbability > 30) return { label: 'Changeable', color: '#90ee90' };
    if (weatherImpact.temperature > 25) return { label: 'Hot', color: '#ff6b6b' };
    return { label: 'Dry', color: '#ffd700' };
  };

  const rating = getWeatherRating();

  return (
    <div className="weather-impact">
      <div className="impact-header">
        <h3>Weather Impact</h3>
        <span className="rating" style={{ borderColor: rating.color, color: rating.color }}>
          {rating.label}
        </span>
      </div>

      <div className="impact-grid">
        <div className="impact-card">
          <Thermometer size={18} />
          <span className="label">Temperature</span>
          <span className="value">{weatherImpact.temperature.toFixed(0)}°C</span>
        </div>

        <div className="impact-card">
          <Droplets size={18} />
          <span className="label">Humidity</span>
          <span className="value">{weatherImpact.humidity.toFixed(0)}%</span>
        </div>

        <div className="impact-card">
          <Wind size={18} />
          <span className="label">Wind</span>
          <span className="value">{weatherImpact.windSpeed.toFixed(1)} m/s</span>
        </div>

        <div className="impact-card">
          <Cloud size={18} />
          <span className="label">Rain Chance</span>
          <span className="value">{weatherImpact.rainProbability.toFixed(0)}%</span>
        </div>
      </div>

      <div className="impact-analysis">
        <div className="analysis-item">
          <span className="analysis-label">Drivers on Track</span>
          <span className="analysis-value">{weatherImpact.driverCount}</span>
        </div>
        <div className="analysis-item">
          <span className="analysis-label">Average Speed</span>
          <span className="analysis-value">{weatherImpact.avgSpeed.toFixed(0)} km/h</span>
        </div>
      </div>

      <style jsx>{`
        .weather-impact {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .impact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .impact-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .rating {
          padding: 0.4rem 0.8rem;
          border: 2px solid;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .impact-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .impact-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .impact-card:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .impact-card svg {
          color: var(--accent-red);
        }

        .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .value {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .impact-analysis {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(225, 6, 0, 0.15);
        }

        .analysis-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem;
        }

        .analysis-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .analysis-value {
          font-weight: 700;
          color: var(--accent-red);
        }
      `}</style>
    </div>
  );
};

export default WeatherImpact;
