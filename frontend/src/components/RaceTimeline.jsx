import React, { useMemo } from 'react';
import { AlertCircle, Zap, Flag, Wind } from 'lucide-react';

const RaceTimeline = ({ frames }) => {
  const events = useMemo(() => {
    if (!frames || frames.length < 10) return [];

    const timelineEvents = [];

    // Detect lead changes
    let lastLeader = null;
    frames.forEach((frame, idx) => {
      const leaders = Object.entries(frame.drivers)
        .filter((e) => e[1].position === 1)
        .map((e) => e[0]);

      if (leaders.length > 0) {
        const currentLeader = leaders[0];
        if (lastLeader && lastLeader !== currentLeader && idx > 5) {
          timelineEvents.push({
            time: frame.t,
            type: 'leadChange',
            newLeader: currentLeader,
            oldLeader: lastLeader,
          });
        }
        lastLeader = currentLeader;
      }
    });

    // Detect DRS deployments
    let lastDrsDriver = null;
    frames.forEach((frame) => {
      const drsDrivers = Object.entries(frame.drivers)
        .filter((e) => e[1].drs > 0)
        .map((e) => e[0]);

      if (drsDrivers.length > 0 && !lastDrsDriver) {
        timelineEvents.push({
          time: frame.t,
          type: 'drs',
          driver: drsDrivers[0],
        });
      }
      lastDrsDriver = drsDrivers.length > 0;
    });

    // Detect tyre changes
    frames.forEach((frame, idx) => {
      if (idx === 0) return;
      const prevFrame = frames[idx - 1];
      Object.entries(frame.drivers).forEach(([code, data]) => {
        const prevTyre = prevFrame.drivers[code]?.tyre;
        if (prevTyre && prevTyre !== data.tyre) {
          timelineEvents.push({
            time: frame.t,
            type: 'tyreChange',
            driver: code,
            fromTyre: ['Soft', 'Medium', 'Hard', 'Inter', 'Wet'][prevTyre - 1],
            toTyre: ['Soft', 'Medium', 'Hard', 'Inter', 'Wet'][data.tyre - 1],
          });
        }
      });
    });

    return timelineEvents
      .sort((a, b) => a.time - b.time)
      .slice(0, 15);
  }, [frames]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'leadChange':
        return <Flag size={14} />;
      case 'drs':
        return <Zap size={14} />;
      case 'tyreChange':
        return <AlertCircle size={14} />;
      default:
        return <Wind size={14} />;
    }
  };

  const getEventLabel = (event) => {
    switch (event.type) {
      case 'leadChange':
        return `${event.newLeader} takes lead from ${event.oldLeader}`;
      case 'drs':
        return `${event.driver} deploys DRS`;
      case 'tyreChange':
        return `${event.driver}: ${event.fromTyre} → ${event.toTyre}`;
      default:
        return 'Event';
    }
  };

  return (
    <div className="race-timeline">
      <div className="timeline-header">
        <h3>Race Timeline</h3>
        <span className="event-count">{events.length} events</span>
      </div>

      <div className="timeline-events">
        {events.length > 0 ? (
          events.map((event, i) => (
            <div key={i} className={`timeline-event event-${event.type} rise-in`} style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="event-icon">{getEventIcon(event.type)}</div>
              <div className="event-content">
                <span className="event-label">{getEventLabel(event)}</span>
                <span className="event-time">{(event.time / 60).toFixed(1)}m</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No significant events detected</div>
        )}
      </div>

      <style jsx>{`
        .race-timeline {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .timeline-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .event-count {
          background: rgba(225, 6, 0, 0.2);
          color: var(--accent-red);
          padding: 0.25rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .timeline-events {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 350px;
          overflow-y: auto;
        }

        .timeline-event {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-left: 3px solid rgba(225, 6, 0, 0.3);
          border-radius: 4px;
          transition: all 0.2s;
        }

        .timeline-event:hover {
          background: rgba(225, 6, 0, 0.1);
          border-left-color: var(--accent-red);
        }

        .timeline-event.event-leadChange {
          border-left-color: #ff6b35;
        }

        .timeline-event.event-drs {
          border-left-color: #ffd700;
        }

        .timeline-event.event-tyreChange {
          border-left-color: #4a90e2;
        }

        .event-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(225, 6, 0, 0.15);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .timeline-event.event-leadChange .event-icon {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .timeline-event.event-drs .event-icon {
          background: rgba(255, 215, 0, 0.15);
          color: #ffd700;
        }

        .timeline-event.event-tyreChange .event-icon {
          background: rgba(74, 144, 226, 0.15);
          color: #4a90e2;
        }

        .event-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 0.75rem;
        }

        .event-label {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .event-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
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

export default RaceTimeline;
