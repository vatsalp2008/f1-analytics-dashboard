import React, { useMemo, useState } from 'react';
import { BarChart3, Zap } from 'lucide-react';

const SectorTimeAnalysis = ({ frames }) => {
  const [sortBy, setSortBy] = useState('s1');

  const sectorData = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const sectors = {};
    frames.forEach((frame) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!sectors[code]) {
          sectors[code] = {
            code,
            s1: data.speed * 0.95,
            s2: data.speed * 0.98,
            s3: data.speed * 1.02,
            avgSpeed: data.speed,
          };
        }
      });
    });

    return Object.values(sectors)
      .sort((a, b) => {
        if (sortBy === 's1') return a.s1 - b.s1;
        if (sortBy === 's2') return a.s2 - b.s2;
        if (sortBy === 's3') return a.s3 - b.s3;
        return a.avgSpeed - b.avgSpeed;
      })
      .slice(0, 10);
  }, [frames, sortBy]);

  const maxSpeed = Math.max(...sectorData.map((d) => Math.max(d.s1, d.s2, d.s3)), 1);

  return (
    <div className="sector-analysis">
      <div className="analysis-header">
        <h3>Sector Times</h3>
        <div className="sector-controls">
          {['s1', 's2', 's3'].map((sector) => (
            <button
              key={sector}
              className={sortBy === sector ? 'active' : ''}
              onClick={() => setSortBy(sector)}
            >
              {sector.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="sectors-list">
        {sectorData.map((driver, idx) => (
          <div key={driver.code} className="sector-row rise-in" style={{ animationDelay: `${idx * 0.03}s` }}>
            <span className="driver-code">{driver.code}</span>
            <div className="sector-bars">
              {[driver.s1, driver.s2, driver.s3].map((speed, i) => (
                <div
                  key={i}
                  className={`bar ${i === 0 ? 'accent-s1' : i === 1 ? 'accent-s2' : 'accent-s3'}`}
                  style={{
                    width: `${(speed / maxSpeed) * 100}%`,
                    minWidth: '4px',
                  }}
                  title={`${speed.toFixed(1)} km/h`}
                />
              ))}
            </div>
            <span className="avg-time">{driver.avgSpeed.toFixed(0)}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .sector-analysis {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .analysis-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .sector-controls {
          display: flex;
          gap: 0.4rem;
        }

        .sector-controls button {
          padding: 0.4rem 0.7rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sector-controls button.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: white;
        }

        .sectors-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .sector-row {
          display: grid;
          grid-template-columns: 50px 1fr 50px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.5rem;
        }

        .driver-code {
          font-weight: 700;
          color: var(--accent-red);
          text-align: center;
          font-size: 0.9rem;
        }

        .sector-bars {
          display: flex;
          gap: 0.3rem;
          height: 24px;
          align-items: flex-end;
        }

        .bar {
          border-radius: 2px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .bar:hover {
          opacity: 0.8;
          transform: scaleY(1.05);
        }

        .bar.accent-s1 {
          background: rgba(255, 100, 100, 0.6);
        }

        .bar.accent-s2 {
          background: rgba(100, 150, 255, 0.6);
        }

        .bar.accent-s3 {
          background: rgba(100, 255, 100, 0.6);
        }

        .avg-time {
          font-weight: 700;
          color: var(--text-primary);
          text-align: right;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default SectorTimeAnalysis;
