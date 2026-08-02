import React, { useMemo } from 'react';
import { Disc3 } from 'lucide-react';

const TyreAnalytics = ({ frames }) => {
  const TYRE_COLORS = {
    1: { name: 'Soft', color: '#FF3300', bg: 'rgba(255, 51, 0, 0.2)' },
    2: { name: 'Medium', color: '#FFEE00', bg: 'rgba(255, 238, 0, 0.2)' },
    3: { name: 'Hard', color: '#6495ED', bg: 'rgba(100, 149, 237, 0.2)' },
    4: { name: 'Intermediate', color: '#90EE90', bg: 'rgba(144, 238, 144, 0.2)' },
    5: { name: 'Wet', color: '#00BFFF', bg: 'rgba(0, 191, 255, 0.2)' },
  };

  const tyreStats = useMemo(() => {
    if (!frames || frames.length === 0) return {};

    const stats = {};
    frames.forEach((frame) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!stats[code]) {
          stats[code] = { soft: 0, medium: 0, hard: 0, intermediate: 0, wet: 0 };
        }
        const tyreNames = { 1: 'soft', 2: 'medium', 3: 'hard', 4: 'intermediate', 5: 'wet' };
        stats[code][tyreNames[data.tyre]]++;
      });
    });

    return stats;
  }, [frames]);

  const topDrivers = useMemo(() => {
    return Object.entries(tyreStats)
      .map(([code, usage]) => ({
        code,
        ...usage,
        total: Object.values(usage).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [tyreStats]);

  return (
    <div className="tyre-analytics">
      <div className="analytics-header">
        <h3>Tyre Compound Usage</h3>
        <Disc3 size={16} />
      </div>

      <div className="drivers-grid">
        {topDrivers.map((driver) => (
          <div key={driver.code} className="driver-card rise-in">
            <span className="driver-code">{driver.code}</span>
            <div className="tyre-bars">
              {[
                { key: 'soft', value: driver.soft },
                { key: 'medium', value: driver.medium },
                { key: 'hard', value: driver.hard },
                { key: 'intermediate', value: driver.intermediate },
                { key: 'wet', value: driver.wet },
              ].map(({ key, value }) => {
                const tyreCode = { soft: 1, medium: 2, hard: 3, intermediate: 4, wet: 5 }[key];
                const percentage = (value / driver.total) * 100;
                return (
                  percentage > 0 && (
                    <div
                      key={key}
                      className="tyre-segment"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: TYRE_COLORS[tyreCode].color,
                      }}
                      title={`${TYRE_COLORS[tyreCode].name}: ${value} frames`}
                    />
                  )
                );
              })}
            </div>
            <span className="frame-count">{driver.total} frames</span>
          </div>
        ))}
      </div>

      <div className="legend">
        <div className="legend-title">Compounds</div>
        <div className="legend-items">
          {Object.entries(TYRE_COLORS).map(([code, { name, color }]) => (
            <div key={code} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: color }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .tyre-analytics {
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
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .analytics-header svg {
          color: var(--accent-red);
        }

        .drivers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .driver-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .driver-card:hover {
          background: rgba(225, 6, 0, 0.1);
          transform: translateY(-2px);
        }

        .driver-code {
          font-weight: 700;
          color: var(--accent-red);
          text-align: center;
          font-size: 0.9rem;
        }

        .tyre-bars {
          display: flex;
          height: 20px;
          border-radius: 3px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
        }

        .tyre-segment {
          height: 100%;
          transition: all 0.2s;
        }

        .tyre-segment:hover {
          opacity: 0.8;
        }

        .frame-count {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .legend {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(225, 6, 0, 0.15);
        }

        .legend-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default TyreAnalytics;
