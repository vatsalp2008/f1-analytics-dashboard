import React from 'react';
import { Cloud, Droplets, Wind, Thermometer, Eye } from 'lucide-react';

const SessionContext = ({ eventName, date, weather, sessionType = 'Race' }) => {
  if (!weather) {
    return (
      <div className="session-context">
        <div className="context-header">
          <h3>{eventName}</h3>
        </div>
        <div className="loading">Loading weather data...</div>
      </div>
    );
  }

  const getWeatherIcon = (description) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
    return '🌤️';
  };

  return (
    <div className="session-context">
      <div className="context-header">
        <h3>{eventName}</h3>
        <span className="session-type">{sessionType}</span>
      </div>

      {date && <div className="context-date">{new Date(date).toLocaleDateString()}</div>}

      <div className="weather-grid">
        <div className="weather-item">
          <div className="weather-icon">
            <Thermometer size={18} />
          </div>
          <div className="weather-info">
            <span className="label">Temperature</span>
            <span className="value">{weather.temperature || 20}°C</span>
          </div>
        </div>

        <div className="weather-item">
          <div className="weather-icon">
            <Droplets size={18} />
          </div>
          <div className="weather-info">
            <span className="label">Humidity</span>
            <span className="value">{weather.humidity || 60}%</span>
          </div>
        </div>

        <div className="weather-item">
          <div className="weather-icon">
            <Wind size={18} />
          </div>
          <div className="weather-info">
            <span className="label">Wind Speed</span>
            <span className="value">{weather.wind_speed || 0} m/s</span>
          </div>
        </div>

        <div className="weather-item">
          <div className="weather-icon">
            <Cloud size={18} />
          </div>
          <div className="weather-info">
            <span className="label">Rain Chance</span>
            <span className="value">{Math.round((weather.rain_probability || 0) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="weather-summary">
        <span className="weather-emoji">{getWeatherIcon(weather.description)}</span>
        <span className="weather-desc">{weather.description || 'Data unavailable'}</span>
      </div>

      <style jsx>{`
        .session-context {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .context-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .context-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--text-primary);
          font-weight: 700;
        }

        .session-type {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: rgba(225, 6, 0, 0.2);
          color: var(--accent-red);
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
        }

        .context-date {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .weather-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .weather-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .weather-item:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .weather-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(225, 6, 0, 0.15);
          border-radius: 50%;
          flex-shrink: 0;
          color: var(--accent-red);
        }

        .weather-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
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
          font-size: 0.95rem;
        }

        .weather-summary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(225, 6, 0, 0.08);
          border-left: 3px solid var(--accent-red);
          border-radius: 4px;
        }

        .weather-emoji {
          font-size: 1.5rem;
        }

        .weather-desc {
          font-size: 0.85rem;
          color: var(--text-primary);
          flex: 1;
        }

        .loading {
          padding: 1rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default SessionContext;
