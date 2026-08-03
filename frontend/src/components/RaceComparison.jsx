import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

const RaceComparison = ({ events }) => {
  const [race1Round, setRace1Round] = useState('');
  const [race2Round, setRace2Round] = useState('');

  const races = useMemo(() => {
    if (!events) return [];
    return events.sort((a, b) => a.round - b.round);
  }, [events]);

  const comparison = useMemo(() => {
    if (!race1Round || !race2Round) return null;

    const r1 = races.find((r) => String(r.round) === String(race1Round));
    const r2 = races.find((r) => String(r.round) === String(race2Round));

    if (!r1 || !r2) return null;

    const date1 = new Date(r1.date);
    const date2 = new Date(r2.date);
    const daysDiff = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));

    return {
      race1: r1,
      race2: r2,
      daysDiff: Math.round(daysDiff),
      sprintDiff: r1.has_sprint !== r2.has_sprint,
      countryMatch: r1.country_code === r2.country_code,
    };
  }, [race1Round, race2Round, races]);

  return (
    <div className="race-comparison">
      <div className="comparison-header">
        <h3>
          <BarChart3 size={16} />
          Race Comparison
        </h3>
      </div>

      <div className="selection-grid">
        <div className="select-group">
          <label>First Race</label>
          <select value={race1Round} onChange={(e) => setRace1Round(e.target.value)}>
            <option value="">Select race</option>
            {races.map((r) => (
              <option key={r.round} value={r.round}>
                Rd {r.round} • {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="select-group">
          <label>Second Race</label>
          <select value={race2Round} onChange={(e) => setRace2Round(e.target.value)}>
            <option value="">Select race</option>
            {races.map((r) => (
              <option key={r.round} value={r.round}>
                Rd {r.round} • {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {comparison && (
        <div className="comparison-results">
          <div className="comparison-row">
            <div className="race-block">
              <span className="race-name">{comparison.race1.name}</span>
              <span className="race-round">Round {comparison.race1.round}</span>
              <span className="race-location">{comparison.race1.location}</span>
            </div>

            <div className="vs-label">vs</div>

            <div className="race-block">
              <span className="race-name">{comparison.race2.name}</span>
              <span className="race-round">Round {comparison.race2.round}</span>
              <span className="race-location">{comparison.race2.location}</span>
            </div>
          </div>

          <div className="stats-comparison">
            <div className="stat-compare">
              <span className="stat-label">Days Apart</span>
              <div className="stat-value">{comparison.daysDiff} days</div>
            </div>

            <div className="stat-compare">
              <span className="stat-label">Sprint Format</span>
              <div className="stat-badge">
                {comparison.sprintDiff ? '✗ Different' : '✓ Same'}
              </div>
            </div>

            <div className="stat-compare">
              <span className="stat-label">Same Country</span>
              <div className="stat-badge">
                {comparison.countryMatch ? '✓ Yes' : '✗ No'}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .race-comparison {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .comparison-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .comparison-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .comparison-header svg {
          color: var(--accent-red);
        }

        .selection-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .select-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .select-group label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
        }

        select {
          padding: 0.6rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(225, 6, 0, 0.2);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .comparison-results {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
        }

        .race-block {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 1rem;
          background: rgba(225, 6, 0, 0.08);
          border: 1px solid rgba(225, 6, 0, 0.2);
          border-radius: 8px;
        }

        .race-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .race-round {
          font-size: 0.8rem;
          color: var(--accent-red);
          font-weight: 600;
        }

        .race-location {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .vs-label {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(225, 6, 0, 0.15);
          border-radius: 50%;
          color: var(--accent-red);
          font-weight: 700;
          font-size: 0.85rem;
        }

        .stats-comparison {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .stat-compare {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          text-align: center;
        }

        .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .stat-value {
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.95rem;
        }

        .stat-badge {
          display: inline-block;
          padding: 0.3rem 0.6rem;
          background: rgba(225, 6, 0, 0.15);
          color: var(--accent-red);
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default RaceComparison;
