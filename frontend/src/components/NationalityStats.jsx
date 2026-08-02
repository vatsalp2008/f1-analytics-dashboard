import React, { useMemo } from 'react';
import { Globe } from 'lucide-react';

const NationalityStats = ({ events }) => {
  const stats = useMemo(() => {
    // Sample data for nationality distribution — in production would come from API
    const nationalities = {
      'Netherlands': 1,
      'United Kingdom': 2,
      'Monaco': 1,
      'Spain': 1,
      'Mexico': 1,
      'Germany': 1,
      'Italy': 1,
      'Canada': 1,
      'Switzerland': 1,
      'Finland': 1,
    };

    return Object.entries(nationalities)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <div className="nationality-stats">
      <div className="stats-header">
        <h3>Driver Nationalities</h3>
        <Globe size={16} />
      </div>

      <div className="nationality-list">
        {stats.map((stat, i) => (
          <div key={stat.country} className="nationality-row rise-in" style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="country-info">
              <span className="country-name">{stat.country}</span>
              <span className="driver-count">{stat.count} driver{stat.count !== 1 ? 's' : ''}</span>
            </div>
            <div className="bar-container">
              <div
                className="bar"
                style={{
                  width: `${(stat.count / maxCount) * 100}%`,
                }}
              />
            </div>
            <span className="count-label">{stat.count}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .nationality-stats {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .stats-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .stats-header svg {
          color: var(--accent-red);
        }

        .nationality-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .nationality-row {
          display: grid;
          grid-template-columns: 140px 1fr 30px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .nationality-row:hover {
          background: rgba(225, 6, 0, 0.1);
          transform: translateX(4px);
        }

        .country-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .country-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .driver-count {
          font-size: 0.7rem;
          color: var(--text-secondary);
          letter-spacing: 0.03em;
        }

        .bar-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
          height: 20px;
          overflow: hidden;
        }

        .bar {
          background: linear-gradient(90deg, rgba(225, 6, 0, 0.6) 0%, rgba(225, 6, 0, 0.9) 100%);
          height: 100%;
          min-width: 2px;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .count-label {
          text-align: right;
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default NationalityStats;
