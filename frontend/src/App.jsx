import React, { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import ErrorBoundary from './components/ErrorBoundary';
import RaceMenu from './components/RaceMenu';
import ReplayEngine from './components/ReplayEngine';
import PredictionsView from './components/PredictionsView';
import SplitText from './reactbits/SplitText/SplitText';
import ShinyText from './reactbits/ShinyText/ShinyText';
import GooeyNav from './reactbits/GooeyNav/GooeyNav';
import './index.css';

// Decorative WebGL background (ogl) — code-split so it doesn't bloat the main bundle.
const Particles = lazy(() => import('./reactbits/Particles/Particles'));

const API_BASE_URL = 'http://localhost:8000/api';

const NAV_ITEMS = [
  { label: 'Race Replay', href: '#replay' },
  { label: 'Predictions', href: '#predictions' },
];

function App() {
  const [view, setView] = useState('replay'); // 'replay' | 'predictions'
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
      <header className="main-header">
        <div className="header-bg">
          <Suspense fallback={null}>
            <Particles
              className="header-particles"
              particleColors={['#e10600', '#ff4d4d', '#ffffff']}
              particleCount={160}
              particleSpread={12}
              speed={0.08}
              particleBaseSize={70}
              alphaParticles
              moveParticlesOnHover
              particleHoverFactor={1.5}
              disableRotation={false}
            />
          </Suspense>
        </div>

        <div className="header-inner">
          <div className="logo-section">
            <SplitText
              text="F1 ANALYTICS"
              className="logo-title"
              tag="h1"
              splitType="chars"
              delay={40}
              duration={0.9}
              from={{ opacity: 0, y: 50, rotateX: -90 }}
              to={{ opacity: 1, y: 0, rotateX: 0 }}
              textAlign="left"
            />
            <ShinyText
              text="PREDICTIONS · TELEMETRY REPLAY · 2025 SEASON"
              className="logo-subtitle"
              speed={4}
              color="#8b93a7"
              shineColor="#ffffff"
              spread={90}
            />
          </div>

          <GooeyNav
            items={NAV_ITEMS}
            initialActiveIndex={view === 'replay' ? 0 : 1}
            particleCount={14}
            animationTime={600}
            onItemClick={(i) => setView(i === 0 ? 'replay' : 'predictions')}
          />
        </div>
      </header>

      <main className="main-content">
        <ErrorBoundary>
          {view === 'replay' ? (
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
        ) : (
          <PredictionsView
            apiBaseUrl={API_BASE_URL}
            year={year}
            events={events}
          />
        )}
        </ErrorBoundary>
      </main>

      <footer className="main-footer">
        <p>© 2026 F1 Analytics Dashboard</p>
      </footer>

      <style jsx>{`
        .app-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          gap: 1.5rem;
          background-image:
            radial-gradient(circle at 10% 20%, rgba(225, 6, 0, 0.07) 0%, transparent 45%),
            radial-gradient(circle at 90% 80%, rgba(0, 167, 138, 0.07) 0%, transparent 45%);
        }

        .main-header {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(120deg, #0b0e14 0%, #15181f 55%, #241012 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 18px 45px rgba(11, 14, 20, 0.22);
          animation: slideDown 0.5s ease-out;
        }

        .header-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.9;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 25%, #000 100%);
          mask-image: linear-gradient(90deg, transparent, #000 25%, #000 100%);
        }

        .header-bg .header-particles {
          width: 100%;
          height: 100%;
        }

        .header-inner {
          position: relative;
          z-index: 1;
          padding: 1.6rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .logo-section .logo-title {
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin: 0;
          color: #ffffff;
          text-shadow: 0 2px 24px rgba(225, 6, 0, 0.35);
        }

        .logo-section .logo-subtitle {
          display: inline-block;
          margin-top: 0.55rem;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.22em;
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
          padding: 0.25rem;
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
