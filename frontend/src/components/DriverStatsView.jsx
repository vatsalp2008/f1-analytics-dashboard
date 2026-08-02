import React, { useState } from 'react';
import axios from 'axios';
import { Trophy, Zap, Flag, Target } from 'lucide-react';
import CountUp from '../reactbits/CountUp/CountUp';

const DriverStatsView = ({ apiBaseUrl }) => {
  const [driverCode, setDriverCode] = useState('HAM');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDriverStats = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiBaseUrl}/driver/${code}`);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Driver not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (driverCode.trim()) {
      fetchDriverStats(driverCode.toUpperCase());
    }
  };

  return (
    <div className="driver-stats-view">
      <div className="search-section">
        <h3>Driver Statistics</h3>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Driver code (e.g., HAM, VER, ALO)"
            value={driverCode}
            onChange={(e) => setDriverCode(e.target.value)}
            maxLength={3}
            className="driver-input"
          />
          <button type="submit" disabled={loading}>Search</button>
        </form>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {stats && !loading && (
        <div className="stats-card rise-in">
          <div className="driver-header">
            <div>
              <h2>{stats.first_name} {stats.last_name}</h2>
              <p className="driver-code">{stats.code} • {stats.nationality}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <Trophy size={20} />
              <div>
                <span className="stat-label">Wins</span>
                <span className="stat-value">
                  <CountUp to={stats.wins} duration={0.8} />
                </span>
              </div>
            </div>

            <div className="stat-box">
              <Zap size={20} />
              <div>
                <span className="stat-label">Pole Positions</span>
                <span className="stat-value">
                  <CountUp to={stats.poles} duration={0.8} />
                </span>
              </div>
            </div>

            <div className="stat-box">
              <Target size={20} />
              <div>
                <span className="stat-label">Fastest Laps</span>
                <span className="stat-value">
                  <CountUp to={stats.fastest_laps} duration={0.8} />
                </span>
              </div>
            </div>

            <div className="stat-box">
              <Flag size={20} />
              <div>
                <span className="stat-label">Championships</span>
                <span className="stat-value">
                  <CountUp to={stats.championships} duration={0.8} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .driver-stats-view {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .search-section {
          margin-bottom: 1.5rem;
        }

        .search-section h3 {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        form {
          display: flex;
          gap: 0.5rem;
        }

        .driver-input {
          flex: 1;
          padding: 0.6rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .driver-input::placeholder {
          color: var(--text-secondary);
        }

        button {
          padding: 0.6rem 1.2rem;
          background: var(--accent-red);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(225, 6, 0, 0.3);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stats-card {
          animation: fadeIn 0.3s ease;
        }

        .driver-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .driver-header h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
        }

        .driver-code {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
        }

        .stat-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(225, 6, 0, 0.08);
          border: 1px solid rgba(225, 6, 0, 0.2);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .stat-box:hover {
          background: rgba(225, 6, 0, 0.12);
          transform: translateY(-2px);
        }

        .stat-box svg {
          color: var(--accent-red);
          flex-shrink: 0;
        }

        .stat-label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-red);
        }

        .error-msg {
          padding: 0.75rem 1rem;
          background: rgba(225, 6, 0, 0.12);
          border: 1px solid rgba(225, 6, 0, 0.35);
          color: var(--accent-red);
          border-radius: 6px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DriverStatsView;
