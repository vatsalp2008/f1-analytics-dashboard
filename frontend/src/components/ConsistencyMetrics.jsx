import React, { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { calculateConsistencyIndex, getConsistencyLabel, getConsistencyColor } from '../utils/consistency';

const ConsistencyMetrics = ({ frames }) => {
  const metrics = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const drivers = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drivers.add(code));
    });

    return Array.from(drivers)
      .map((code) => ({
        code,
        consistency: calculateConsistencyIndex(frames, code),
      }))
      .sort((a, b) => b.consistency - a.consistency);
  }, [frames]);

  return (
    <div className="consistency-metrics">
      <div className="metrics-header">
        <h3>
          <Gauge size={16} />
          Consistency Index
        </h3>
        <span className="subtitle">Performance Stability</span>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, idx) => (
          <div key={metric.code} className="metric-card rise-in" style={{ animationDelay: `${idx * 0.03}s` }}>
            <div className="card-driver">{metric.code}</div>

            <div className="circular-gauge">
              <svg viewBox="0 0 100 100" className="gauge-svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getConsistencyColor(metric.consistency)}
                  strokeWidth="8"
                  strokeDasharray={`${metric.consistency * 2.83} 283`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <div className="gauge-text">{metric.consistency.toFixed(0)}</div>
            </div>

            <span className="label">{getConsistencyLabel(metric.consistency)}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .consistency-metrics {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .metrics-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
        }

        .metric-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .metric-card:hover {
          background: rgba(225, 6, 0, 0.1);
          transform: translateY(-2px);
        }

        .card-driver {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .circular-gauge {
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gauge-svg {
          width: 100%;
          height: 100%;
        }

        .gauge-text {
          position: absolute;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ConsistencyMetrics;
