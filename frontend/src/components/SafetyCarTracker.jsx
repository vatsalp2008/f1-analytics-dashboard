import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

const SafetyCarTracker = ({ frames }) => {
  const safetyCars = useMemo(() => {
    if (!frames || frames.length < 10) return [];

    const events = [];
    let inSafetyCarPeriod = false;
    let safetyCarStart = 0;
    let startingPositions = {};

    frames.forEach((frame, idx) => {
      const speeds = Object.values(frame.drivers).map((d) => d.speed);
      const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

      const isSlowCluster = speeds.filter((s) => s < 50).length > speeds.length * 0.3;

      if (isSlowCluster && !inSafetyCarPeriod) {
        inSafetyCarPeriod = true;
        safetyCarStart = frame.t;
        startingPositions = Object.fromEntries(
          Object.entries(frame.drivers).map(([code, data]) => [code, data.position])
        );
      } else if (!isSlowCluster && inSafetyCarPeriod) {
        inSafetyCarPeriod = false;

        const positionChanges = {};
        frames[idx].drivers &&
          Object.entries(frames[idx].drivers).forEach(([code, data]) => {
            const startPos = startingPositions[code];
            if (startPos && data.position !== startPos) {
              positionChanges[code] = startPos - data.position;
            }
          });

        events.push({
          lap: Math.round(frames[idx].t / 60),
          duration: (frame.t - safetyCarStart).toFixed(1),
          durationSeconds: frame.t - safetyCarStart,
          positionChanges,
          changeCount: Object.keys(positionChanges).length,
        });
      }
    });

    return events;
  }, [frames]);

  return (
    <div className="safety-car-tracker">
      <div className="tracker-header">
        <h3>
          <AlertTriangle size={16} />
          Safety Car Periods
        </h3>
        <span className="count">{safetyCars.length} periods</span>
      </div>

      <div className="sc-list">
        {safetyCars.length === 0 ? (
          <div className="no-sc">No safety car periods detected</div>
        ) : (
          safetyCars.map((sc, i) => (
            <div key={i} className="sc-event rise-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="sc-info">
                <span className="sc-label">SC Period {i + 1}</span>
                <span className="sc-duration">{sc.duration}s duration</span>
              </div>

              <div className="position-badge">
                <span className="badge-label">Positions Changed</span>
                <span className="badge-value">{sc.changeCount}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .safety-car-tracker {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .tracker-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .tracker-header svg {
          color: #ffaa00;
        }

        .count {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
          padding: 0.25rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .sc-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .no-sc {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .sc-event {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 170, 0, 0.08);
          border: 1px solid rgba(255, 170, 0, 0.2);
          border-left: 3px solid #ffaa00;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .sc-event:hover {
          background: rgba(255, 170, 0, 0.12);
        }

        .sc-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .sc-label {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .sc-duration {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .position-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 170, 0, 0.15);
          border-radius: 6px;
        }

        .badge-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .badge-value {
          font-weight: 700;
          color: #ffaa00;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default SafetyCarTracker;
