import React, { useMemo, useState } from 'react';
import { TrendingDown } from 'lucide-react';

const TireDegradation = ({ frames }) => {
  const [selectedDriver, setSelectedDriver] = useState('');

  const drivers = useMemo(() => {
    if (!frames) return [];
    const drvs = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drvs.add(code));
    });
    return Array.from(drvs).sort();
  }, [frames]);

  const degradationData = useMemo(() => {
    if (!selectedDriver || !frames) return [];

    const lapData = {};

    frames.forEach((frame) => {
      if (frame.drivers[selectedDriver]) {
        const data = frame.drivers[selectedDriver];
        const lap = Math.floor(data.lap);

        if (!lapData[lap]) {
          lapData[lap] = {
            lap,
            speeds: [],
            avgSpeed: 0,
            tyre: data.tyre,
          };
        }
        lapData[lap].speeds.push(data.speed);
      }
    });

    return Object.values(lapData)
      .sort((a, b) => a.lap - b.lap)
      .map((ld) => ({
        ...ld,
        avgSpeed: ld.speeds.reduce((a, b) => a + b, 0) / ld.speeds.length,
      }));
  }, [selectedDriver, frames]);

  const degradationRate = useMemo(() => {
    if (degradationData.length < 2) return 0;

    const first = degradationData[0].avgSpeed;
    const last = degradationData[degradationData.length - 1].avgSpeed;
    const laps = degradationData.length;

    return ((first - last) / (first * laps)) * 100;
  }, [degradationData]);

  const TYRE_NAMES = { 1: 'Soft', 2: 'Medium', 3: 'Hard', 4: 'Inter', 5: 'Wet' };

  return (
    <div className="tire-degradation">
      <div className="degradation-header">
        <h3>
          <TrendingDown size={16} />
          Tire Degradation
        </h3>
        <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
          <option value="">Select driver</option>
          {drivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {selectedDriver && degradationData.length > 0 && (
        <>
          <div className="degradation-stats">
            <div className="stat">
              <span className="label">Laps on Tire</span>
              <span className="value">{degradationData.length}</span>
            </div>
            <div className="stat">
              <span className="label">Compound</span>
              <span className="value">{TYRE_NAMES[degradationData[0].tyre]}</span>
            </div>
            <div className="stat">
              <span className="label">Avg Degradation</span>
              <span className="value">{degradationRate.toFixed(2)}% per lap</span>
            </div>
          </div>

          <div className="degradation-chart">
            <svg viewBox={`0 0 ${degradationData.length * 20} 150`} className="chart">
              <polyline
                points={degradationData
                  .map((d, i) => {
                    const x = i * 20 + 10;
                    const maxSpeed = Math.max(...degradationData.map((dd) => dd.avgSpeed));
                    const y = 150 - (d.avgSpeed / maxSpeed) * 150;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="rgba(225, 6, 0, 0.8)"
                strokeWidth="2"
              />

              {degradationData.map((d, i) => {
                const x = i * 20 + 10;
                const maxSpeed = Math.max(...degradationData.map((dd) => dd.avgSpeed));
                const y = 150 - (d.avgSpeed / maxSpeed) * 150;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="rgba(225, 6, 0, 0.8)"
                  />
                );
              })}
            </svg>
          </div>
        </>
      )}

      <style jsx>{`
        .tire-degradation {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .degradation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .degradation-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        select {
          padding: 0.4rem 0.6rem;
          background: rgba(225, 6, 0, 0.15);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--text-primary);
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .degradation-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          text-align: center;
        }

        .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .value {
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.95rem;
        }

        .degradation-chart {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 0.75rem;
          overflow-x: auto;
        }

        .chart {
          min-width: 100%;
          height: 120px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default TireDegradation;
