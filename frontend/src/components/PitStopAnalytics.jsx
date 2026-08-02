import React, { useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';

const PitStopAnalytics = ({ frames }) => {
  const pitStops = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const stops = {};
    frames.forEach((frame, idx) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!stops[code]) stops[code] = [];
        const prevFrame = frames[idx - 1];
        if (prevFrame) {
          const prevTyre = prevFrame.drivers[code]?.tyre;
          if (prevTyre && prevTyre !== data.tyre) {
            stops[code].push({
              lap: data.lap,
              time: frame.t,
              fromTyre: prevTyre,
              toTyre: data.tyre,
            });
          }
        }
      });
    });

    return Object.entries(stops)
      .flatMap(([code, driverStops]) =>
        driverStops.map((s) => ({ code, ...s }))
      )
      .sort((a, b) => a.lap - b.lap);
  }, [frames]);

  const TYRE_NAMES = { 1: 'Soft', 2: 'Medium', 3: 'Hard', 4: 'Inter', 5: 'Wet' };

  return (
    <div className="pit-stop-analytics">
      <div className="analytics-header">
        <h3>Pit Stop Strategy</h3>
        <span className="stop-count">{pitStops.length} stops</span>
      </div>

      <div className="stops-timeline">
        {pitStops.length > 0 ? (
          pitStops.map((stop, i) => (
            <div key={i} className="stop-entry rise-in" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="stop-driver">{stop.code}</div>
              <div className="stop-details">
                <div className="detail-row">
                  <Clock size={14} />
                  <span>Lap {Math.round(stop.lap)}</span>
                </div>
                <div className="tyre-swap">
                  <span className={`tyre-badge tyre-${stop.fromTyre}`}>
                    {TYRE_NAMES[stop.fromTyre] || 'Unknown'}
                  </span>
                  <span className="arrow">→</span>
                  <span className={`tyre-badge tyre-${stop.toTyre}`}>
                    {TYRE_NAMES[stop.toTyre] || 'Unknown'}
                  </span>
                </div>
              </div>
              <Zap size={14} className="stop-icon" />
            </div>
          ))
        ) : (
          <div className="empty-state">No pit stops detected in this session</div>
        )}
      </div>

      <style jsx>{`
        .pit-stop-analytics {
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

        .stop-count {
          background: rgba(225, 6, 0, 0.2);
          color: var(--accent-red);
          padding: 0.25rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .stops-timeline {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .stop-entry {
          display: grid;
          grid-template-columns: 50px 1fr 20px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .stop-entry:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .stop-driver {
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.9rem;
          text-align: center;
        }

        .stop-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .detail-row svg {
          opacity: 0.6;
        }

        .tyre-swap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
        }

        .tyre-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .tyre-1 { background: rgba(255, 51, 0, 0.2); color: #ff3300; }
        .tyre-2 { background: rgba(255, 238, 0, 0.2); color: #ffee00; }
        .tyre-3 { background: rgba(100, 149, 237, 0.2); color: #6495ed; }
        .tyre-4 { background: rgba(144, 238, 144, 0.2); color: #90ee90; }
        .tyre-5 { background: rgba(0, 191, 255, 0.2); color: #00bfff; }

        .arrow {
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .stop-icon {
          color: var(--accent-red);
          opacity: 0.6;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default PitStopAnalytics;
