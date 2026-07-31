import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { flagFromCountryCode, formatRaceDate } from '../utils/format';
import { formatConfidence } from '../utils/numbers';
import { validatePredictions } from '../utils/api-validation';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';
import CountUp from '../reactbits/CountUp/CountUp';
import SkeletonRow from './SkeletonRow';

/**
 * PredictionsView — displays AI-predicted race finishing order.
 * Fetches predictions from the backend ML model for a selected race.
 * @param {string} apiBaseUrl - Base URL for API calls (e.g., http://localhost:8000/api)
 * @param {number} year - Currently selected season
 * @param {Array} events - List of races for the season
 */
const PredictionsView = ({ apiBaseUrl, year, events }) => {
  const [selectedRound, setSelectedRound] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrediction = async (round) => {
    setSelectedRound(round);
    setPrediction(null);
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/predictions/${year}/${round}`);
      const validated = validatePredictions(res.data);
      setPrediction(validated);
    } catch (err) {
      setError(err.message || err.response?.data?.detail || 'Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SpotlightCard className="predictions-view light-panel animate-fade-in" spotlightColor="rgba(225, 6, 0, 0.14)">
      <div className="predictions-layout">
        {/* Round picker */}
        <div className="section-column round-column">
          <h3>Pick a Race ({year})</h3>
          <div className="scroll-list">
            {events.map((event, i) => (
              <button
                key={event.round}
                className={`menu-item event-item rise-in ${selectedRound === event.round ? 'active' : ''}`}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
                onClick={() => fetchPrediction(event.round)}
                disabled={loading}
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
            ))}
          </div>
        </div>

        {/* Results panel */}
        <div className="section-column results-column">
          {prediction ? (() => {
            const evt = events.find(e => e.round === prediction.round);
            return (
              <div className="results-header">
                <span className="results-flag" aria-hidden="true">
                  {flagFromCountryCode(evt?.country_code)}
                </span>
                <div>
                  <h3 className="results-title">
                    {prediction.race_name} — {prediction.model.toUpperCase()}
                  </h3>
                  {evt?.date && (
                    <div className="results-date">
                      {formatRaceDate(evt.date)} • {formatConfidence(prediction.confidence)}
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <h3>Predicted Finishing Order</h3>
          )}

          {!selectedRound && !loading && (
            <div className="placeholder">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
              <p style={{ fontWeight: 600 }}>No race selected</p>
              <p>Pick a Grand Prix from the calendar on the left to see predicted finishing order.</p>
              <p className="caveat">
                💡 <strong>First request:</strong> ~10–30s (model training)<br/>
                ⚡ <strong>Next requests:</strong> instant (cached)
              </p>
            </div>
          )}

          {loading && (
            <div className="predictions-table">
              <div className="table-header">
                <span className="col-pos">Pos</span>
                <span className="col-driver">Driver</span>
                <span className="col-name">Name</span>
                <span className="col-grid">Grid</span>
                <span className="col-delta">Δ</span>
                <span className="col-form">Form</span>
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
              <p className="loading-text" style={{ marginTop: '1rem', textAlign: 'center' }}>Training model… (first request ~10–30s)</p>
            </div>
          )}

          {error && (
            <div className="error-msg">
              <span style={{ marginRight: '0.5rem' }}>⚠️</span>
              {error}
            </div>
          )}

          {prediction && !loading && (
            <div className="predictions-table">
              <div className="table-header">
                <span className="col-pos">Pos</span>
                <span className="col-driver">Driver</span>
                <span className="col-name">Name</span>
                <span className="col-grid">Grid</span>
                <span className="col-delta">Δ</span>
                <span className="col-form">Form</span>
              </div>
              {prediction.predictions.map((p, i) => {
                const finishPos = i + 1;
                const gridPos = Math.round(p.QualifyingPosition);
                const delta = gridPos - finishPos;
                const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const deltaClass = delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'flat';
                return (
                  <div
                    key={p.Driver}
                    className={`table-row rise-in ${finishPos <= 3 ? 'podium' : ''}`}
                    style={{ animationDelay: `${Math.min(i * 0.035, 0.7)}s` }}
                  >
                    <span className="col-pos">P{finishPos}</span>
                    <span className="col-driver">{p.Driver}</span>
                    <span className="col-name">{p.DriverFullName}</span>
                    <span className="col-grid">P{gridPos}</span>
                    <span className={`col-delta ${deltaClass}`}>
                      <DeltaIcon size={14} />
                      {delta !== 0 && Math.abs(delta)}
                    </span>
                    <span className="col-form">
                      {p.RecentForm != null
                        ? <CountUp to={Number(p.RecentForm.toFixed(1))} duration={1.1} className="cu-form" />
                        : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .predictions-view {
          width: 100%;
          height: 100%;
          padding: 1.5rem;
          overflow: hidden;
        }

        .predictions-view.light-panel {
          padding: 1.5rem;
        }

        .predictions-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
          height: 100%;
        }

        .section-column {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .section-column h3 {
          font-size: 0.875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin: 0 0 0.75rem 0;
        }

        .scroll-list {
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-right: 0.25rem;
        }

        .menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.6rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          font-size: 0.85rem;
        }

        .flag {
          font-size: 1.3rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0 0 0.75rem 0;
        }

        .results-flag {
          font-size: 1.8rem;
          line-height: 1;
        }

        .results-title {
          margin: 0;
        }

        .results-date {
          font-size: 0.75rem;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
          margin-top: 0.15rem;
        }

        .menu-item:hover:not(:disabled) {
          background: var(--elevated-tint);
          border-color: var(--text-secondary);
        }

        .menu-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu-item.active {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: white;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .round-no {
          font-size: 0.7rem;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
        }

        .menu-item.active .round-no {
          color: rgba(255,255,255,0.85);
        }

        .event-name {
          font-weight: 600;
        }

        .sprint-tag {
          font-size: 0.65rem;
          background: rgba(0,167,138,0.12);
          color: var(--success-green);
          padding: 0.15rem 0.4rem;
          border-radius: 3px;
          letter-spacing: 0.05em;
          border: 1px solid rgba(0,167,138,0.25);
        }

        .placeholder, .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: var(--text-secondary);
          gap: 0.75rem;
        }

        .caveat {
          font-size: 0.75rem;
          opacity: 0.7;
          max-width: 380px;
          text-align: center;
        }

        .loading-text {
          font-size: 0.875rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-msg {
          background: rgba(225,6,0,0.08);
          border: 1px solid rgba(225,6,0,0.35);
          color: var(--accent-red);
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .predictions-table {
          flex: 1;
          overflow-y: auto;
          font-size: 0.85rem;
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 60px 70px 1fr 60px 70px 70px;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          align-items: center;
        }

        .table-header {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          background: var(--card-bg);
        }

        .table-row {
          border-bottom: 1px solid var(--border-color);
        }

        .table-row.podium {
          background: rgba(225,6,0,0.06);
          border-left: 4px solid var(--accent-red);
          padding-left: calc(0.75rem - 4px);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .table-row.podium:hover {
          background: rgba(225,6,0,0.12);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(225,6,0,0.15);
        }

        .table-row:hover {
          background: var(--elevated-tint);
        }

        .col-pos {
          font-weight: 700;
          color: var(--accent-red);
        }

        .col-driver {
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .col-name {
          color: var(--text-secondary);
        }

        .col-delta {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .col-delta.gain { color: var(--success-green); }
        .col-delta.loss { color: var(--accent-red); }
        .col-delta.flat { color: var(--text-secondary); }
      `}</style>
    </SpotlightCard>
  );
};

export default PredictionsView;
