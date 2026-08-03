import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

const QualifyingVsRace = ({ frames }) => {
  // Simulated qualifying vs race data
  const paceComparison = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const drivers = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drivers.add(code));
    });

    return Array.from(drivers)
      .map((code) => {
        const driverFrames = frames.filter((f) => f.drivers[code]);
        const avgSpeed = driverFrames.length > 0
          ? driverFrames.reduce((sum, f) => sum + f.drivers[code].speed, 0) / driverFrames.length
          : 0;

        return {
          code,
          qualySpeed: avgSpeed * 0.98,
          raceSpeed: avgSpeed * 0.95,
          delta: (avgSpeed * 0.98) - (avgSpeed * 0.95),
        };
      })
      .sort((a, b) => b.delta - a.delta);
  }, [frames]);

  const maxDelta = Math.max(...paceComparison.map((d) => d.delta), 1);

  return (
    <div className="qualy-vs-race">
      <div className="comparison-header">
        <h3>
          <BarChart3 size={16} />
          Qualifying vs Race Pace
        </h3>
      </div>

      <div className="pace-list">
        {paceComparison.map((driver, idx) => (
          <div key={driver.code} className="pace-row rise-in" style={{ animationDelay: `${idx * 0.03}s` }}>
            <span className="driver-code">{driver.code}</span>

            <div className="pace-bars">
              <div className="bar-group">
                <div className="bar qualy" style={{ width: `${(driver.qualySpeed / 350) * 100}%` }} />
                <span className="bar-label">{driver.qualySpeed.toFixed(0)}</span>
              </div>

              <div className="bar-group">
                <div className="bar race" style={{ width: `${(driver.raceSpeed / 350) * 100}%` }} />
                <span className="bar-label">{driver.raceSpeed.toFixed(0)}</span>
              </div>
            </div>

            <div className="delta-display">
              <span className="delta-value">+{driver.delta.toFixed(1)}</span>
              <span className="delta-label">km/h</span>
            </div>
          </div>
        ))}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color qualy" />
          <span>Qualifying</span>
        </div>
        <div className="legend-item">
          <div className="legend-color race" />
          <span>Race</span>
        </div>
      </div>

      <style jsx>{`
        .qualy-vs-race {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .comparison-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
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

        .pace-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .pace-row {
          display: grid;
          grid-template-columns: 50px 1fr 100px;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .pace-row:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .driver-code {
          font-weight: 700;
          color: var(--accent-red);
          text-align: center;
        }

        .pace-bars {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .bar-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          height: 20px;
        }

        .bar {
          height: 100%;
          border-radius: 3px;
          min-width: 4px;
        }

        .bar.qualy {
          background: rgba(100, 200, 255, 0.6);
        }

        .bar.race {
          background: rgba(255, 100, 100, 0.6);
        }

        .bar-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          min-width: 35px;
          text-align: right;
        }

        .delta-display {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          text-align: center;
        }

        .delta-value {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .delta-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .legend {
          display: flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(225, 6, 0, 0.15);
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.qualy {
          background: rgba(100, 200, 255, 0.6);
        }

        .legend-color.race {
          background: rgba(255, 100, 100, 0.6);
        }
      `}</style>
    </div>
  );
};

export default QualifyingVsRace;
