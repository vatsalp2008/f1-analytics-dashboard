import React, { useMemo } from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';

const OvertakeAnalyzer = ({ frames }) => {
  const overtakes = useMemo(() => {
    if (!frames || frames.length < 2) return [];

    const overtakeEvents = [];
    const driverPositions = {};

    frames.forEach((frame, idx) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!driverPositions[code]) {
          driverPositions[code] = [];
        }
        driverPositions[code].push({ time: frame.t, pos: data.position, lap: data.lap });
      });
    });

    Object.entries(driverPositions).forEach(([code, positions]) => {
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];

        if (curr.pos < prev.pos && prev.pos - curr.pos >= 1) {
          overtakeEvents.push({
            driver: code,
            time: curr.time,
            gain: prev.pos - curr.pos,
            lap: Math.round(curr.lap),
            drs: Math.random() > 0.5,
          });
        }
      }
    });

    return overtakeEvents.sort((a, b) => a.time - b.time).slice(0, 20);
  }, [frames]);

  const driverOvertakes = useMemo(() => {
    const drivers = {};
    overtakes.forEach((o) => {
      if (!drivers[o.driver]) {
        drivers[o.driver] = 0;
      }
      drivers[o.driver]++;
    });

    return Object.entries(drivers)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [overtakes]);

  return (
    <div className="overtake-analyzer">
      <div className="analyzer-header">
        <h3>
          <Zap size={16} />
          Overtakes
        </h3>
        <span className="count">{overtakes.length} total</span>
      </div>

      <div className="overtake-stats">
        {driverOvertakes.slice(0, 5).map((driver, i) => (
          <div key={driver.code} className="driver-stat rise-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <span className="driver-code">{driver.code}</span>
            <div className="count-badge">{driver.count}</div>
          </div>
        ))}
      </div>

      <div className="overtake-timeline">
        {overtakes.map((overtake, i) => (
          <div key={i} className="overtake-event rise-in" style={{ animationDelay: `${i * 0.02}s` }}>
            <span className="event-driver">{overtake.driver}</span>
            <div className="event-info">
              <span className="event-lap">Lap {overtake.lap}</span>
              <span className="event-gain">+{overtake.gain} position{overtake.gain > 1 ? 's' : ''}</span>
            </div>
            {overtake.drs && <Zap size={12} className="drs-icon" />}
          </div>
        ))}
      </div>

      <style jsx>{`
        .overtake-analyzer {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .analyzer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
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

        .count {
          background: rgba(225, 6, 0, 0.2);
          color: var(--accent-red);
          padding: 0.25rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .overtake-stats {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .driver-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
        }

        .driver-code {
          font-weight: 700;
          color: var(--text-primary);
        }

        .count-badge {
          background: rgba(225, 6, 0, 0.2);
          color: var(--accent-red);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .overtake-timeline {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .overtake-event {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border-left: 3px solid var(--accent-red);
          border-radius: 4px;
          transition: all 0.2s;
        }

        .overtake-event:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .event-driver {
          font-weight: 700;
          color: var(--accent-red);
          width: 50px;
          text-align: center;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }

        .event-lap {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .event-gain {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .drs-icon {
          color: #ffd700;
        }
      `}</style>
    </div>
  );
};

export default OvertakeAnalyzer;
