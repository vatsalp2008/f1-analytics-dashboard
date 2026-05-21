import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RaceMenu from './components/RaceMenu';
import ReplayEngine from './components/ReplayEngine';
import './index.css';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [year, setYear] = useState(2025);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sessionType, setSessionType] = useState('R');
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents(year);
  }, [year]);

  const fetchEvents = async (y) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/events/${y}`);
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleLaunchReplay = async (round) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/telemetry/${year}/${round}/${sessionType}`);
      setTelemetry(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch telemetry data');
      setLoading(false);
    }
  };

  if (telemetry) {
    return (
      <ReplayEngine 
        data={telemetry} 
        onBack={() => setTelemetry(null)} 
      />
    );
  }

  return (
    <div className="app-container">
      <header className="main-header glass-panel">
        <div className="logo-section">
          <h1 style={{ color: 'var(--accent-red)' }}>F1 <span style={{ color: 'white' }}>RACE REPLAY</span></h1>
          <p className="subtitle">Interactive Telemetry Visualization</p>
        </div>
      </header>

      <main className="main-content">
        <RaceMenu 
          year={year}
          setYear={setYear}
          events={events}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          sessionType={sessionType}
          setSessionType={setSessionType}
          onLaunch={handleLaunchReplay}
          loading={loading}
          error={error}
        />
      </main>

      <footer className="main-footer">
        <p>© 2026 F1 Race Replay • Built for Data-Loving Fans</p>
      </footer>

      <style jsx>{`
        .app-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          gap: 2rem;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(225, 6, 0, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(0, 210, 190, 0.05) 0%, transparent 40%);
        }

        .main-header {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideDown 0.5s ease-out;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .main-content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .main-footer {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.75rem;
          padding: 1rem;
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
