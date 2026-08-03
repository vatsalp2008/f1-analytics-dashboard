import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { calculateLapDeltas, getAverageDelta, getMaxDelta, formatDeltaTime, getDeltaTrend } from '../utils/lap-delta';

const LapDeltaDisplay = ({ frames }) => {
  const deltas = useMemo(() => calculateLapDeltas(frames), [frames]);

  const deltaStats = useMemo(() => {
    if (Object.keys(deltas).length === 0) return [];

    return Object.entries(deltas)
      .map(([code, _]) => ({
        code,
        avgDelta: getAverageDelta(deltas, code),
        maxDelta: getMaxDelta(deltas, code),
        trend: getDeltaTrend(deltas, code),
      }))
      .filter((d) => d.avgDelta > 0)
      .sort((a, b) => a.avgDelta - b.avgDelta)
      .slice(1, 11);
  }, [deltas]);

  return (
    <div className="lap-delta-display">
      <div className="delta-header">
        <h3>Gap to Leader</h3>
        <span className="delta-unit">Time Gap (seconds)</span>
      </div>

      <div className="delta-list">
        {deltaStats.map((stat, i) => {
          const TrendIcon = stat.trend === 'increasing' ? TrendingUp : TrendingDown;
          const trendColor = stat.trend === 'increasing' ? '#ff6b6b' : '#51cf66';

          return (
            <div key={stat.code} className="delta-row rise-in" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="row-rank">{i + 1}</div>
              <div className="row-driver">{stat.code}</div>
              <div className="row-gaps">
                <div className="gap-avg">
                  <span className="label">Avg</span>
                  <span className="value">{formatDeltaTime(stat.avgDelta)}</span>
                </div>
                <div className="gap-max">
                  <span className="label">Max</span>
                  <span className="value">{formatDeltaTime(stat.maxDelta)}</span>
                </div>
              </div>
              <div className="row-trend">
                <TrendIcon size={16} color={trendColor} />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .lap-delta-display {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .delta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .delta-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .delta-unit {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .delta-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 350px;
          overflow-y: auto;
        }

        .delta-row {
          display: grid;
          grid-template-columns: 30px 50px 1fr 40px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .delta-row:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .row-rank {
          text-align: center;
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.9rem;
        }

        .row-driver {
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
        }

        .row-gaps {
          display: flex;
          gap: 0.75rem;
        }

        .gap-avg,
        .gap-max {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
          padding: 0.4rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-secondary);
        }

        .value {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.8rem;
        }

        .row-trend {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
      `}</style>
    </div>
  );
};

export default LapDeltaDisplay;
