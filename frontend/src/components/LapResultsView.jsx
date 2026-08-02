import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatTime } from '../utils/numbers';

const LapResultsView = ({ frames }) => {
  const [expandedLap, setExpandedLap] = useState(null);
  const [sortBy, setSortBy] = useState('position');

  if (!frames || frames.length === 0) {
    return <div className="lap-results-empty">No lap data available</div>;
  }

  const lapData = useMemo(() => {
    const laps = {};
    frames.forEach((frame) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!laps[data.lap]) laps[data.lap] = [];
        const existing = laps[data.lap].find((d) => d.code === code);
        if (!existing) {
          laps[data.lap].push({
            code,
            position: data.position,
            speed: data.speed,
            lap: data.lap,
            gap: 0,
          });
        }
      });
    });
    return Object.entries(laps)
      .map(([lap, drivers]) => ({
        lap: Number(lap),
        drivers: drivers.sort((a, b) => a.position - b.position),
      }))
      .sort((a, b) => b.lap - a.lap);
  }, [frames]);

  return (
    <div className="lap-results-view">
      <div className="lap-header">
        <h3>Lap Results</h3>
        <div className="sort-controls">
          <button
            className={sortBy === 'position' ? 'active' : ''}
            onClick={() => setSortBy('position')}
          >
            Position
          </button>
          <button
            className={sortBy === 'speed' ? 'active' : ''}
            onClick={() => setSortBy('speed')}
          >
            Speed
          </button>
        </div>
      </div>

      <div className="laps-list">
        {lapData.slice(0, 20).map(({ lap, drivers }) => (
          <div key={lap} className="lap-group">
            <button
              className="lap-toggle"
              onClick={() => setExpandedLap(expandedLap === lap ? null : lap)}
            >
              <span className="lap-number">Lap {lap}</span>
              {expandedLap === lap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedLap === lap && (
              <div className="lap-details">
                {drivers.map((d, i) => (
                  <div key={d.code} className="driver-lap-row rise-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <span className="col-pos">P{d.position}</span>
                    <span className="col-code">{d.code}</span>
                    <span className="col-speed">{d.speed.toFixed(0)} km/h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .lap-results-view {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .lap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .lap-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .sort-controls {
          display: flex;
          gap: 0.5rem;
        }

        .sort-controls button {
          padding: 0.4rem 0.8rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sort-controls button.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: white;
        }

        .lap-toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(225, 6, 0, 0.08);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .lap-toggle:hover {
          background: rgba(225, 6, 0, 0.15);
        }

        .lap-number {
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .lap-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .driver-lap-row {
          display: grid;
          grid-template-columns: 40px 60px 1fr;
          gap: 0.5rem;
          padding: 0.5rem;
          font-size: 0.8rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .driver-lap-row:last-child {
          border-bottom: none;
        }

        .col-pos {
          font-weight: 700;
          color: var(--accent-red);
        }

        .col-code {
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .col-speed {
          text-align: right;
          color: var(--text-secondary);
        }

        .lap-results-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default LapResultsView;
