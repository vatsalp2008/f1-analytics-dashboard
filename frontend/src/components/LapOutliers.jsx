import React, { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { detectLapOutliers, getOutlierType, isSignificantOutlier } from '../utils/outlier-detection';

const LapOutliers = ({ frames }) => {
  const [selectedDriver, setSelectedDriver] = useState('');

  const drivers = useMemo(() => {
    if (!frames) return [];
    const drvs = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drvs.add(code));
    });
    return Array.from(drvs).sort();
  }, [frames]);

  const outliers = useMemo(() => {
    if (!selectedDriver || !frames) return [];
    return detectLapOutliers(frames, selectedDriver).sort((a, b) => b.severity - a.severity);
  }, [selectedDriver, frames]);

  return (
    <div className="lap-outliers">
      <div className="outliers-header">
        <h3>
          <AlertCircle size={16} />
          Lap Anomalies
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

      <div className="outliers-list">
        {outliers.length === 0 ? (
          <div className="no-outliers">No significant anomalies detected</div>
        ) : (
          outliers.map((outlier, i) => {
            const type = getOutlierType(outlier.deviation);
            const significant = isSignificantOutlier(outlier);

            return (
              <div
                key={i}
                className={`outlier-row ${significant ? 'significant' : ''} rise-in`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="outlier-lap">
                  <span className="lap-number">Lap {outlier.lap}</span>
                  <span className={`outlier-type ${type}`}>{type === 'fast' ? '🟢' : '🔴'}</span>
                </div>

                <div className="outlier-stats">
                  <span className="speed">{outlier.avgSpeed.toFixed(0)} km/h</span>
                  <span className={`deviation ${type}`}>
                    {type === 'fast' ? '+' : '-'}
                    {Math.abs(outlier.deviation).toFixed(1)} km/h
                  </span>
                </div>

                <div className="severity-bar">
                  <div
                    className={`severity-fill ${type}`}
                    style={{ width: `${Math.min(outlier.severity * 20, 100)}%` }}
                  />
                </div>

                <span className="severity-value">{outlier.severity.toFixed(1)}σ</span>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .lap-outliers {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .outliers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .outliers-header h3 {
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

        .outliers-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 350px;
          overflow-y: auto;
        }

        .no-outliers {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .outlier-row {
          display: grid;
          grid-template-columns: 100px 120px 1fr 50px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .outlier-row:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .outlier-row.significant {
          background: rgba(255, 107, 107, 0.08);
          border-color: rgba(255, 107, 107, 0.2);
        }

        .outlier-lap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lap-number {
          font-weight: 700;
          color: var(--accent-red);
        }

        .outlier-type {
          font-size: 1rem;
        }

        .outlier-stats {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .speed {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .deviation {
          font-size: 0.8rem;
        }

        .deviation.fast {
          color: #51cf66;
        }

        .deviation.slow {
          color: #ff6b6b;
        }

        .severity-bar {
          background: rgba(0, 0, 0, 0.2);
          height: 20px;
          border-radius: 3px;
          overflow: hidden;
        }

        .severity-fill {
          height: 100%;
          border-radius: 3px;
        }

        .severity-fill.fast {
          background: rgba(81, 207, 102, 0.6);
        }

        .severity-fill.slow {
          background: rgba(255, 107, 107, 0.6);
        }

        .severity-value {
          text-align: center;
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default LapOutliers;
