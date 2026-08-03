import React, { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { calculateAveragePace, projectRaceTime, lapsRemaining, formatRaceTime } from '../utils/pace-calculator';

const RacePaceProjection = ({ frames }) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [totalLaps, setTotalLaps] = useState(58);

  const drivers = useMemo(() => {
    if (!frames) return [];
    const drvs = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drvs.add(code));
    });
    return Array.from(drvs).sort();
  }, [frames]);

  const projection = useMemo(() => {
    if (!selectedDriver || !frames) return null;

    const pace = calculateAveragePace(frames, selectedDriver);
    const currentLapNo = Math.floor(Math.max(...frames.map((f) => f.drivers[selectedDriver]?.lap || 0)));
    const remaining = lapsRemaining(frames, selectedDriver, totalLaps);
    const projectedTime = projectRaceTime(pace, totalLaps, currentLapNo);

    return {
      pace: pace.toFixed(2),
      currentLap: currentLapNo,
      remaining,
      projectedTime: formatRaceTime(projectedTime),
      projectedSeconds: projectedTime,
    };
  }, [selectedDriver, frames, totalLaps]);

  return (
    <div className="race-pace-projection">
      <div className="projection-header">
        <h3>
          <Clock size={16} />
          Race Pace Projection
        </h3>
      </div>

      <div className="projection-inputs">
        <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
          <option value="">Select driver</option>
          {drivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          max="70"
          value={totalLaps}
          onChange={(e) => setTotalLaps(Number(e.target.value))}
          placeholder="Total laps"
        />
      </div>

      {projection && (
        <div className="projection-data">
          <div className="data-row">
            <span className="label">Current Lap</span>
            <span className="value">{projection.currentLap} / {totalLaps}</span>
          </div>

          <div className="data-row">
            <span className="label">Laps Remaining</span>
            <span className="value">{projection.remaining}</span>
          </div>

          <div className="data-row">
            <span className="label">Avg Lap Pace</span>
            <span className="value">{projection.pace}s</span>
          </div>

          <div className="data-row highlight">
            <span className="label">Projected Finish</span>
            <span className="value">{projection.projectedTime}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .race-pace-projection {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .projection-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .projection-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .projection-inputs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        select,
        input {
          flex: 1;
          padding: 0.6rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(225, 6, 0, 0.2);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 0.85rem;
        }

        input {
          font-family: monospace;
        }

        .projection-data {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
        }

        .data-row.highlight {
          background: rgba(225, 6, 0, 0.12);
          border-color: rgba(225, 6, 0, 0.3);
        }

        .label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .value {
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
};

export default RacePaceProjection;
