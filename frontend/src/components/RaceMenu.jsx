import React from 'react';
import { Play, Loader2, ChevronRight, Info } from 'lucide-react';
import { flagFromCountryCode, formatRaceDate } from '../utils/format';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';
import StarBorder from '../reactbits/StarBorder/StarBorder';

/**
 * RaceMenu — season/race/session picker for the replay engine.
 * @param {number} year - Currently selected season (e.g., 2025)
 * @param {function} setYear - Update season
 * @param {Array} events - List of races for the season
 * @param {number|null} selectedEvent - Currently selected race round number
 * @param {function} setSelectedEvent - Update selected race
 * @param {string} sessionType - Session type: 'R' (race), 'Q' (qualifying), 'S' (sprint)
 * @param {function} setSessionType - Update session type
 * @param {function} onLaunch - Callback to load telemetry and launch replay
 * @param {boolean} loading - Telemetry fetch in progress
 * @param {string|null} error - Error message if fetch failed
 */
const RaceMenu = ({
    year, setYear, events, selectedEvent, setSelectedEvent,
    sessionType, setSessionType, onLaunch, loading, error
}) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const years = Array.from({ length: 2025 - 2018 + 1 }, (_, i) => 2018 + i).reverse();
    const filteredEvents = events.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sessionTypes = [
        { id: 'R', label: 'Race' },
        { id: 'Q', label: 'Qualifying' },
        { id: 'S', label: 'Sprint' },
    ];

    return (
        <SpotlightCard className="race-menu light-panel animate-fade-in" spotlightColor="rgba(225, 6, 0, 0.14)">
            <div className="menu-sections">
                {/* Year Selector */}
                <div className="section-column years-column">
                    <h3>Season</h3>
                    <div className="scroll-list">
                        {years.map((y, i) => (
                            <button
                                key={y}
                                className={`menu-item rise-in ${year === y ? 'active' : ''}`}
                                style={{ animationDelay: `${i * 0.04}s` }}
                                onClick={() => setYear(y)}
                            >
                                {y} Season
                            </button>
                        ))}
                    </div>
                </div>

                {/* Events Selector */}
                <div className="section-column events-column">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h3>Grand Prix Calendar</h3>
                        <input
                            type="text"
                            placeholder="Search races..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                border: `1px solid var(--border-color)`,
                                borderRadius: '6px',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                    <div className="scroll-list">
                        {loading && !events.length ? (
                            <div className="loader-container"><Loader2 className="spinner" /></div>
                        ) : filteredEvents.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                No races match "{searchTerm}"
                            </div>
                        ) : (
                            filteredEvents.map((event, i) => (
                                <button
                                    key={event.round}
                                    className={`menu-item event-item rise-in ${selectedEvent === event.round ? 'active' : ''}`}
                                    style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
                                    onClick={() => setSelectedEvent(event.round)}
                                >
                                    <span className="flag" aria-hidden="true">
                                        {flagFromCountryCode(event.country_code)}
                                    </span>
                                    <div className="event-info">
                                        <span className="round-no">RD {event.round} · {formatRaceDate(event.date)}</span>
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

                        <StarBorder
                            as="button"
                            className="launch-star"
                            color="#e10600"
                            speed="4s"
                            thickness={2}
                            disabled={!selectedEvent || loading}
                            onClick={() => onLaunch(selectedEvent)}
                        >
                            {loading ? <Loader2 className="spinner" /> : <><Play fill="currentColor" size={18} /> Launch Replay</>}
                        </StarBorder>
                    </div>

                    {error && <div className="error-msg"><Info size={14} /> ⚠️ {error}</div>}
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

        .launch-star {
          width: 100%;
          margin-top: auto;
          border-radius: 12px;
        }

        .launch-star:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .launch-star .inner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #2a0a0a;
          background: #0b0e14;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.9rem;
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
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .menu-item:hover {
          background: var(--elevated-tint);
          border-color: var(--text-secondary);
        }

        .menu-item.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: white;
          font-weight: bold;
        }

        .event-item {
          padding: 1rem;
          gap: 0.75rem;
        }

        .flag {
          font-size: 1.4rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
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
          background: rgba(0, 167, 138, 0.12);
          color: var(--success-green);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(0, 167, 138, 0.25);
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
          background: var(--elevated-tint);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: bold;
        }

        .session-btn.active {
          background: var(--accent-red);
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
          color: var(--accent-red);
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(225, 6, 0, 0.08);
          border: 1px solid rgba(225, 6, 0, 0.25);
          padding: 0.75rem;
          border-radius: 6px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </SpotlightCard>
    );
};

export default RaceMenu;
