import React, { useMemo } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

const SeasonProgress = ({ events }) => {
  const progress = useMemo(() => {
    if (!events || events.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const now = new Date();
    const completed = events.filter((e) => new Date(e.date) <= now).length;
    const total = events.length;
    const percentage = (completed / total) * 100;

    return { completed, total, percentage };
  }, [events]);

  const upcomingRaces = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) > now)
      .slice(0, 5);
  }, [events]);

  return (
    <div className="season-progress">
      <div className="progress-header">
        <h3>
          <Calendar size={16} />
          Season Progress
        </h3>
      </div>

      <div className="progress-stat">
        <div className="stat-label">Races Completed</div>
        <div className="stat-value">
          {progress.completed} / {progress.total}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="progress-percent">{progress.percentage.toFixed(0)}%</div>
      </div>

      {upcomingRaces.length > 0 && (
        <div className="upcoming-section">
          <div className="upcoming-title">Upcoming Races</div>
          <div className="upcoming-list">
            {upcomingRaces.map((race) => (
              <div key={race.round} className="upcoming-item rise-in">
                <span className="round-badge">Rd {race.round}</span>
                <div className="race-info">
                  <span className="race-name">{race.name}</span>
                  <span className="race-date">
                    {new Date(race.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <TrendingUp size={14} className="arrow-icon" />
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .season-progress {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .progress-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .progress-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .progress-header svg {
          color: var(--accent-red);
        }

        .progress-stat {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-red);
        }

        .progress-bar {
          width: 100%;
          height: 24px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(225, 6, 0, 0.6) 0%, rgba(225, 6, 0, 1) 100%);
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .progress-percent {
          text-align: right;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .upcoming-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upcoming-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .upcoming-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .upcoming-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .upcoming-item:hover {
          background: rgba(225, 6, 0, 0.1);
          transform: translateX(2px);
        }

        .round-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(225, 6, 0, 0.2);
          border-radius: 50%;
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--accent-red);
          flex-shrink: 0;
        }

        .race-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
          min-width: 0;
        }

        .race-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .race-date {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .arrow-icon {
          color: var(--accent-red);
          opacity: 0.5;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default SeasonProgress;
