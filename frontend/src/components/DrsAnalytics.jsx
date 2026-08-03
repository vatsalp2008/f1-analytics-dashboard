import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';

const DrsAnalytics = ({ frames }) => {
  const drsData = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const drivers = {};

    frames.forEach((frame) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!drivers[code]) {
          drivers[code] = {
            code,
            drsSpeed: [],
            normalSpeed: [],
            drsCount: 0,
            avgDrsGain: 0,
          };
        }

        if (data.drs > 0) {
          drivers[code].drsSpeed.push(data.speed);
          drivers[code].drsCount++;
        } else {
          drivers[code].normalSpeed.push(data.speed);
        }
      });
    });

    return Object.values(drivers)
      .map((d) => {
        const avgDrs = d.drsSpeed.length > 0 ? d.drsSpeed.reduce((a, b) => a + b) / d.drsSpeed.length : 0;
        const avgNormal = d.normalSpeed.length > 0 ? d.normalSpeed.reduce((a, b) => a + b) / d.normalSpeed.length : 0;
        const gain = avgNormal > 0 ? avgDrs - avgNormal : 0;

        return {
          ...d,
          avgDrsSpeed: avgDrs,
          avgNormalSpeed: avgNormal,
          drsGain: gain,
        };
      })
      .filter((d) => d.drsCount > 0)
      .sort((a, b) => b.drsGain - a.drsGain)
      .slice(0, 10);
  }, [frames]);

  const maxGain = Math.max(...drsData.map((d) => d.drsGain), 1);

  return (
    <div className="drs-analytics">
      <div className="analytics-header">
        <h3>
          <Zap size={16} />
          DRS Analysis
        </h3>
        <span className="unit">Speed Gain (km/h)</span>
      </div>

      <div className="drs-list">
        {drsData.map((driver, idx) => (
          <div key={driver.code} className="drs-row rise-in" style={{ animationDelay: `${idx * 0.03}s` }}>
            <div className="driver-info">
              <span className="driver-code">{driver.code}</span>
              <span className="drs-count">{driver.drsCount} activations</span>
            </div>

            <div className="gain-bar">
              <div
                className="gain-fill"
                style={{
                  width: `${(driver.drsGain / maxGain) * 100}%`,
                }}
              />
            </div>

            <div className="gain-info">
              <span className="gain-value">+{driver.drsGain.toFixed(1)}</span>
              <span className="speeds">
                {driver.avgNormalSpeed.toFixed(0)} → {driver.avgDrsSpeed.toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .drs-analytics {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .analytics-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .analytics-header svg {
          color: #ffd700;
        }

        .unit {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .drs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .drs-row {
          display: grid;
          grid-template-columns: 100px 1fr 120px;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .drs-row:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .driver-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .driver-code {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .drs-count {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .gain-bar {
          background: rgba(0, 0, 0, 0.2);
          height: 24px;
          border-radius: 4px;
          overflow: hidden;
        }

        .gain-fill {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0.9) 100%);
          height: 100%;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .gain-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          text-align: right;
        }

        .gain-value {
          font-weight: 700;
          color: #ffd700;
          font-size: 0.95rem;
        }

        .speeds {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default DrsAnalytics;
