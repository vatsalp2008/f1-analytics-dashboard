import React, { useMemo, useState } from 'react';
import { TrendingDown } from 'lucide-react';

const LapTimeTrend = ({ frames }) => {
  const [selectedDriver, setSelectedDriver] = useState('');

  const availableDrivers = useMemo(() => {
    if (!frames || frames.length === 0) return [];
    const drivers = new Set();
    frames.forEach((frame) => {
      Object.keys(frame.drivers).forEach((code) => drivers.add(code));
    });
    return Array.from(drivers).sort();
  }, [frames]);

  const lapTimes = useMemo(() => {
    if (!selectedDriver || !frames) return [];

    const times = [];
    let lastLapTime = 0;
    let lastTime = 0;

    frames.forEach((frame) => {
      if (frame.drivers[selectedDriver]) {
        const data = frame.drivers[selectedDriver];
        const currentLap = Math.floor(data.lap);

        if (currentLap > Math.floor(lastTime)) {
          if (lastLapTime > 0) {
            const lapTime = frame.t - lastLapTime;
            if (lapTime > 10 && lapTime < 300) {
              times.push({
                lap: currentLap - 1,
                time: lapTime,
              });
            }
          }
          lastLapTime = frame.t;
        }
        lastTime = data.lap;
      }
    });

    return times.slice(0, 40);
  }, [selectedDriver, frames]);

  const stats = useMemo(() => {
    if (lapTimes.length === 0) return null;

    const times = lapTimes.map((l) => l.time);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const variance = Math.sqrt(
      times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length
    );

    return { avgTime, minTime, maxTime, variance, count: times.length };
  }, [lapTimes]);

  const maxTime = Math.max(...lapTimes.map((l) => l.time), 1);
  const minTime = Math.min(...lapTimes.map((l) => l.time), 0);
  const timeRange = maxTime - minTime || 1;

  return (
    <div className="lap-time-trend">
      <div className="trend-header">
        <h3>Lap Time Trend</h3>
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className="driver-select"
        >
          <option value="">Select a driver</option>
          {availableDrivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="stats-row">
          <div className="stat">
            <span className="label">Avg</span>
            <span className="value">{stats.avgTime.toFixed(1)}s</span>
          </div>
          <div className="stat">
            <span className="label">Best</span>
            <span className="value">{stats.minTime.toFixed(1)}s</span>
          </div>
          <div className="stat">
            <span className="label">Worst</span>
            <span className="value">{stats.maxTime.toFixed(1)}s</span>
          </div>
          <div className="stat">
            <span className="label">Variance</span>
            <span className="value">{(stats.variance * 1000).toFixed(0)}ms</span>
          </div>
        </div>
      )}

      {lapTimes.length > 0 && (
        <div className="chart-container">
          <svg viewBox={`0 0 ${lapTimes.length * 15} 200`} className="trend-chart">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={`grid-${ratio}`}
                x1="0"
                y1={200 - ratio * 200}
                x2={lapTimes.length * 15}
                y2={200 - ratio * 200}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="2,2"
              />
            ))}

            {/* Line chart */}
            <polyline
              points={lapTimes
                .map((lap, i) => {
                  const x = i * 15 + 7.5;
                  const y = 200 - ((lap.time - minTime) / timeRange) * 200;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="rgba(225, 6, 0, 0.8)"
              strokeWidth="2"
            />

            {/* Data points */}
            {lapTimes.map((lap, i) => {
              const x = i * 15 + 7.5;
              const y = 200 - ((lap.time - minTime) / timeRange) * 200;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="rgba(225, 6, 0, 0.6)"
                  className="data-point"
                />
              );
            })}
          </svg>
        </div>
      )}

      {lapTimes.length === 0 && selectedDriver && (
        <div className="empty-state">No lap time data for {selectedDriver}</div>
      )}

      <style jsx>{`
        .lap-time-trend {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .trend-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .trend-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .driver-select {
          padding: 0.4rem 0.6rem;
          background: rgba(225, 6, 0, 0.15);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--text-primary);
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
        }

        .stat .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .stat .value {
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.9rem;
        }

        .chart-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 1rem;
          overflow-x: auto;
        }

        .trend-chart {
          min-width: 100%;
          height: 180px;
          display: block;
        }

        .data-point {
          transition: all 0.2s;
          cursor: pointer;
        }

        .data-point:hover {
          r: 5;
          fill: rgba(225, 6, 0, 1);
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

export default LapTimeTrend;
