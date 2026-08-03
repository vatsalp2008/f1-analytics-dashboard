import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

const IncidentDetector = ({ frames }) => {
  const incidents = useMemo(() => {
    if (!frames || frames.length < 10) return [];

    const detected = [];

    frames.forEach((frame, idx) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (idx > 0) {
          const prevFrame = frames[idx - 1];
          const prevData = prevFrame.drivers[code];

          if (!prevData) return;

          const speedDrop = prevData.speed - data.speed;
          const positionGap = Math.abs(data.position - prevData.position);

          if (speedDrop > 15 && data.lap === prevData.lap) {
            detected.push({
              type: 'speedDrop',
              driver: code,
              time: frame.t,
              lap: Math.round(data.lap),
              severity: speedDrop > 30 ? 'high' : 'medium',
              detail: `${speedDrop.toFixed(1)} km/h drop`,
            });
          }

          if (positionGap > 3) {
            detected.push({
              type: 'largeGap',
              driver: code,
              time: frame.t,
              lap: Math.round(data.lap),
              severity: positionGap > 5 ? 'high' : 'medium',
              detail: `${positionGap} position jump`,
            });
          }
        }
      });
    });

    return detected.slice(0, 15);
  }, [frames]);

  const getSeverityColor = (severity) => {
    return severity === 'high' ? '#ff4444' : '#ffaa00';
  };

  const getIncidentIcon = (type) => {
    return '⚠️';
  };

  return (
    <div className="incident-detector">
      <div className="detector-header">
        <h3>
          <AlertTriangle size={16} />
          Incident Detection
        </h3>
        <span className="incident-count">{incidents.length} detected</span>
      </div>

      <div className="incidents-list">
        {incidents.length === 0 ? (
          <div className="no-incidents">No unusual events detected</div>
        ) : (
          incidents.map((incident, i) => (
            <div
              key={i}
              className="incident-item rise-in"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <div className="incident-badge" style={{ color: getSeverityColor(incident.severity) }}>
                {getIncidentIcon(incident.type)}
              </div>
              <div className="incident-details">
                <span className="driver">{incident.driver}</span>
                <span className="description">{incident.detail}</span>
                <span className="lap">Lap {incident.lap}</span>
              </div>
              <span className="severity-tag" style={{ borderColor: getSeverityColor(incident.severity) }}>
                {incident.severity.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .incident-detector {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .detector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .detector-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .detector-header svg {
          color: #ff6b6b;
        }

        .incident-count {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          padding: 0.25rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .incidents-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 350px;
          overflow-y: auto;
        }

        .no-incidents {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .incident-item {
          display: grid;
          grid-template-columns: 30px 1fr 80px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 107, 107, 0.08);
          border: 1px solid rgba(255, 107, 107, 0.15);
          border-left: 3px solid;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .incident-item:hover {
          background: rgba(255, 107, 107, 0.12);
        }

        .incident-badge {
          font-size: 1.2rem;
          text-align: center;
        }

        .incident-details {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 0;
        }

        .driver {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .description {
          font-size: 0.8rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lap {
          font-size: 0.7rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .severity-tag {
          padding: 0.3rem 0.5rem;
          border: 1px solid;
          border-radius: 3px;
          font-size: 0.65rem;
          font-weight: 700;
          text-align: center;
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default IncidentDetector;
