import React, { useState, useMemo } from 'react';
import { RefreshCw, Award } from 'lucide-react';

const DriverComparison = ({ frames }) => {
  const [driver1, setDriver1] = useState('');
  const [driver2, setDriver2] = useState('');

  const availableDrivers = useMemo(() => {
    if (!frames || frames.length === 0) return [];
    const drivers = new Set();
    frames.forEach((frame) => {
      Object.keys(frame.drivers).forEach((code) => drivers.add(code));
    });
    return Array.from(drivers).sort();
  }, [frames]);

  const comparison = useMemo(() => {
    if (!driver1 || !driver2 || !frames) return null;

    const stats1 = { code: driver1, avgSpeed: 0, maxSpeed: 0, minSpeed: Infinity, lapCount: 0, drsCount: 0 };
    const stats2 = { code: driver2, avgSpeed: 0, maxSpeed: 0, minSpeed: Infinity, lapCount: 0, drsCount: 0 };

    let s1TotalSpeed = 0, s1Count = 0;
    let s2TotalSpeed = 0, s2Count = 0;

    frames.forEach((frame) => {
      const d1 = frame.drivers[driver1];
      const d2 = frame.drivers[driver2];

      if (d1) {
        s1TotalSpeed += d1.speed;
        s1Count++;
        stats1.maxSpeed = Math.max(stats1.maxSpeed, d1.speed);
        stats1.minSpeed = Math.min(stats1.minSpeed, d1.speed);
        if (d1.drs) stats1.drsCount++;
      }

      if (d2) {
        s2TotalSpeed += d2.speed;
        s2Count++;
        stats2.maxSpeed = Math.max(stats2.maxSpeed, d2.speed);
        stats2.minSpeed = Math.min(stats2.minSpeed, d2.speed);
        if (d2.drs) stats2.drsCount++;
      }
    });

    stats1.avgSpeed = s1Count > 0 ? s1TotalSpeed / s1Count : 0;
    stats2.avgSpeed = s2Count > 0 ? s2TotalSpeed / s2Count : 0;

    return { stats1, stats2 };
  }, [driver1, driver2, frames]);

  const swapDrivers = () => {
    setDriver1(driver2);
    setDriver2(driver1);
  };

  return (
    <div className="driver-comparison">
      <div className="comparison-header">
        <h3>Driver Comparison</h3>
      </div>

      <div className="input-section">
        <select value={driver1} onChange={(e) => setDriver1(e.target.value)}>
          <option value="">Select Driver 1</option>
          {availableDrivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button className="swap-btn" onClick={swapDrivers} title="Swap drivers">
          <RefreshCw size={16} />
        </button>

        <select value={driver2} onChange={(e) => setDriver2(e.target.value)}>
          <option value="">Select Driver 2</option>
          {availableDrivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {comparison && (
        <div className="comparison-results">
          <div className="comparison-stat">
            <span className="stat-label">Avg Speed</span>
            <div className="stat-values">
              <div className="value">
                {comparison.stats1.avgSpeed.toFixed(1)} km/h
              </div>
              <div className="value">
                {comparison.stats2.avgSpeed.toFixed(1)} km/h
              </div>
            </div>
            <span className={`winner ${comparison.stats1.avgSpeed > comparison.stats2.avgSpeed ? 'p1' : 'p2'}`}>
              <Award size={12} />
            </span>
          </div>

          <div className="comparison-stat">
            <span className="stat-label">Max Speed</span>
            <div className="stat-values">
              <div className="value">
                {comparison.stats1.maxSpeed.toFixed(0)} km/h
              </div>
              <div className="value">
                {comparison.stats2.maxSpeed.toFixed(0)} km/h
              </div>
            </div>
            <span className={`winner ${comparison.stats1.maxSpeed > comparison.stats2.maxSpeed ? 'p1' : 'p2'}`}>
              <Award size={12} />
            </span>
          </div>

          <div className="comparison-stat">
            <span className="stat-label">DRS Activations</span>
            <div className="stat-values">
              <div className="value">{comparison.stats1.drsCount}</div>
              <div className="value">{comparison.stats2.drsCount}</div>
            </div>
            <span className={`winner ${comparison.stats1.drsCount > comparison.stats2.drsCount ? 'p1' : 'p2'}`}>
              <Award size={12} />
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .driver-comparison {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .comparison-header h3 {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .input-section {
          display: grid;
          grid-template-columns: 1fr 40px 1fr;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        select {
          padding: 0.6rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .swap-btn {
          padding: 0;
          background: rgba(225, 6, 0, 0.15);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--accent-red);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .swap-btn:hover {
          background: rgba(225, 6, 0, 0.25);
          transform: rotate(180deg);
        }

        .comparison-results {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .comparison-stat {
          display: grid;
          grid-template-columns: 100px 1fr 20px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
        }

        .stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .stat-values {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .value {
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-weight: 600;
          text-align: center;
          font-size: 0.85rem;
        }

        .winner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          opacity: 0;
        }

        .winner.p1 {
          background: rgba(255, 100, 0, 0.2);
          color: #ff6400;
          opacity: 1;
        }

        .winner.p2 {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default DriverComparison;
