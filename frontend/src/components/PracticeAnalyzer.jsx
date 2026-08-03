import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';

const PracticeAnalyzer = ({ frames }) => {
  const [selectedDriver, setSelectedDriver] = useState('');

  const drivers = useMemo(() => {
    if (!frames) return [];
    const drvs = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drvs.add(code));
    });
    return Array.from(drvs).sort();
  }, [frames]);

  const sessionMetrics = useMemo(() => {
    if (!selectedDriver || !frames) return null;

    const driverFrames = frames.filter((f) => f.drivers[selectedDriver]);

    if (driverFrames.length === 0) return null;

    const speeds = driverFrames.map((f) => f.drivers[selectedDriver].speed);
    const positions = driverFrames.map((f) => f.drivers[selectedDriver].position);

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
    const consistency = 100 - (Math.sqrt(speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length) / avgSpeed) * 100;

    return {
      totalFrames: driverFrames.length,
      avgSpeed,
      maxSpeed,
      avgPosition,
      consistency: Math.max(0, consistency),
    };
  }, [selectedDriver, frames]);

  return (
    <div className="practice-analyzer">
      <div className="analyzer-header">
        <h3>
          <Activity size={16} />
          Practice Session Analysis
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

      {sessionMetrics && (
        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Avg Speed</span>
            <span className="metric-value">{sessionMetrics.avgSpeed.toFixed(0)}</span>
            <span className="metric-unit">km/h</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Peak Speed</span>
            <span className="metric-value">{sessionMetrics.maxSpeed.toFixed(0)}</span>
            <span className="metric-unit">km/h</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Avg Position</span>
            <span className="metric-value">P{Math.round(sessionMetrics.avgPosition)}</span>
            <span className="metric-unit">on track</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Consistency</span>
            <span className="metric-value">{sessionMetrics.consistency.toFixed(0)}</span>
            <span className="metric-unit">score</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .practice-analyzer {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .analyzer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .analyzer-header h3 {
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

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 8px;
          text-align: center;
          transition: all 0.2s;
        }

        .metric-box:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .metric-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-red);
        }

        .metric-unit {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default PracticeAnalyzer;
