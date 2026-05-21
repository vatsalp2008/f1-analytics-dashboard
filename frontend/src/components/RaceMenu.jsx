import React from 'react';
import { Calendar, Play, Loader2, ChevronRight, Info } from 'lucide-react';

const RaceMenu = ({
    year, setYear, events, selectedEvent, setSelectedEvent,
    sessionType, setSessionType, onLaunch, loading, error
}) => {
    const years = Array.from({ length: 2025 - 2018 + 1 }, (_, i) => 2018 + i).reverse();

    const sessionTypes = [
        { id: 'R', label: 'Race' },
        { id: 'Q', label: 'Qualifying' },
        { id: 'S', label: 'Sprint' },
    ];

    return (
        <div className="race-menu glass-panel animate-fade-in">
            <div className="menu-sections">
                {/* Year Selector */}
                <div className="section-column years-column">
                    <h3>Season</h3>
                    <div className="scroll-list">
                        {years.map(y => (
                            <button
                                key={y}
                                className={`menu-item ${year === y ? 'active' : ''}`}
                                onClick={() => setYear(y)}
                            >
                                {y} Season
                            </button>
                        ))}
                    </div>
                </div>

                {/* Events Selector */}
                <div className="section-column events-column">
                    <h3>Grand Prix Calendar</h3>
                    <div className="scroll-list">
                        {loading && !events.length ? (
                            <div className="loader-container"><Loader2 className="spinner" /></div>
                        ) : (
                            events.map(event => (
                                <button
                                    key={event.round}
                                    className={`menu-item event-item ${selectedEvent === event.round ? 'active' : ''}`}
                                    onClick={() => setSelectedEvent(event.round)}
                                >
                                    <div className="event-info">
                                        <span className="round-no">RD {event.round}</span>
                                        <span className="event-name">{event.name}</span>
                                    </div>
                                    {event.has_sprint && <span className="sprint-tag">Sprint</span>}
                                    <ChevronRight size={16} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Configuration Selector */}
                <div className="section-column config-column">
                    <h3>Session Config</h3>
                    <div className="config-box glass-panel">
                        <p className="config-label">Select Session Type:</p>
                        <div className="session-grid">
                            {sessionTypes.map(type => (
                                <button
                                    key={type.id}
                                    className={`session-btn ${sessionType === type.id ? 'active' : ''}`}
                                    onClick={() => setSessionType(type.id)}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="selected-summary">
                            <h4>Current Selection:</h4>
                            <p>{year} {events.find(e => e.round === selectedEvent)?.name || 'Select a race'}</p>
                            <p className="session-type-display">
                                {sessionTypes.find(t => t.id === sessionType)?.label} session
                            </p>
                        </div>

                        <button
                            className="racing-btn launch-btn"
                            disabled={!selectedEvent || loading}
                            onClick={() => onLaunch(selectedEvent)}
                        >
                            {loading ? <Loader2 className="spinner" /> : <><Play fill="currentColor" size={18} /> Launch Replay</>}
                        </button>
                    </div>

                    {error && <div className="error-msg"><Info size={14} /> {error}</div>}
                </div>
            </div>

            <style jsx>{`
        .race-menu {
          width: 100%;
          max-width: 1100px;
          height: 600px;
          display: flex;
          overflow: hidden;
        }

        .menu-sections {
          display: flex;
          width: 100%;
          padding: 1.5rem;
          gap: 1.5rem;
        }

        .section-column {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .years-column { width: 180px; }
        .events-column { flex: 1; }
        .config-column { width: 320px; }

        h3 {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          padding-left: 0.5rem;
        }

        .scroll-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-right: 0.5rem;
        }

        .scroll-list::-webkit-scrollbar {
          width: 4px;
        }

        .scroll-list::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }

        .menu-item {
          text-align: left;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          border-radius: 6px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .menu-item.active {
          background: var(--accent-red);
          color: white;
          font-weight: bold;
        }

        .event-item {
          padding: 1rem;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .round-no {
          font-size: 0.625rem;
          font-weight: bold;
          opacity: 0.8;
        }

        .event-name {
          font-size: 1rem;
        }

        .sprint-tag {
          font-size: 0.625rem;
          background: rgba(0, 210, 190, 0.1);
          color: var(--success-green);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(0, 210, 190, 0.2);
        }

        .config-box {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .config-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .session-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .session-btn {
          padding: 0.5rem;
          background: #2d3748;
          color: var(--text-secondary);
          font-weight: bold;
        }

        .session-btn.active {
          background: #4a5568;
          color: white;
          border: 1px solid var(--accent-red);
        }

        .selected-summary {
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .selected-summary h4 {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .selected-summary p {
          font-size: 1.125rem;
          font-weight: bold;
        }

        .session-type-display {
          font-size: 0.875rem !important;
          color: var(--accent-red);
          margin-top: 0.25rem;
        }

        .launch-btn {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
        }

        .loader-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        .error-msg {
          color: #ff4d4d;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 77, 77, 0.1);
          padding: 0.75rem;
          border-radius: 6px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default RaceMenu;
