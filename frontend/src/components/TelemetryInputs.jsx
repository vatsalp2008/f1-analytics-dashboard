import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';

const TelemetryInputs = ({ frames }) => {
  const [selectedDriver, setSelectedDriver] = useState('');

  const availableDrivers = useMemo(() => {
    if (!frames || frames.length === 0) return [];
    const drivers = new Set();
    frames.forEach((frame) => {
      Object.keys(frame.drivers).forEach((code) => drivers.add(code));
    });
    return Array.from(drivers).sort();
  }, [frames]);

  const inputData = useMemo(() => {
    if (!selectedDriver || !frames) return { throttleAvg: 0, brakeAvg: 0, drsCount: 0, totalFrames: 0 };

    let throttleSum = 0,
      brakeSum = 0,
      drsCount = 0,
      count = 0;

    frames.forEach((frame) => {
      if (frame.drivers[selectedDriver]) {
        const data = frame.drivers[selectedDriver];
        throttleSum += data.throttle || 0;
        brakeSum += data.brake || 0;
        if (data.drs) drsCount++;
        count++;
      }
    });

    return {
      throttleAvg: count > 0 ? (throttleSum / count).toFixed(1) : 0,
      brakeAvg: count > 0 ? (brakeSum / count).toFixed(1) : 0,
      drsCount,
      totalFrames: count,
    };
  }, [selectedDriver, frames]);

  return (
    <div className="telemetry-inputs">
      <div className="inputs-header">
        <h3>
          <Activity size={16} />
          Driver Inputs
        </h3>
        <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
          <option value="">Select driver</option>
          {availableDrivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {selectedDriver && (
        <div className="inputs-grid">
          <div className="input-card">
            <div className="input-label">Throttle</div>
            <div className="input-gauge">
              <div
                className="gauge-fill throttle"
                style={{ width: `${inputData.throttleAvg}%` }}
              />
            </div>
            <div className="input-value">{inputData.throttleAvg}%</div>
          </div>

          <div className="input-card">
            <div className="input-label">Brake</div>
            <div className="input-gauge">
              <div
                className="gauge-fill brake"
                style={{ width: `${inputData.brakeAvg}%` }}
              />
            </div>
            <div className="input-value">{inputData.brakeAvg}%</div>
          </div>

          <div className="input-card">
            <div className="input-label">DRS Activations</div>
            <div className="drs-count">{inputData.drsCount}</div>
            <div className="drs-ratio">
              {inputData.totalFrames > 0
                ? ((inputData.drsCount / inputData.totalFrames) * 100).toFixed(1)
                : 0}
              % of session
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .telemetry-inputs {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .inputs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .inputs-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        select {
          padding: 0.4rem 0.6rem;
          background: rgba(225, 6, 0, 0.15);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--text-primary);
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .inputs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .input-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 8px;
        }

        .input-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .input-gauge {
          width: 100%;
          height: 24px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          overflow: hidden;
        }

        .gauge-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .gauge-fill.throttle {
          background: linear-gradient(90deg, rgba(100, 200, 100, 0.6) 0%, rgba(100, 255, 100, 0.8) 100%);
        }

        .gauge-fill.brake {
          background: linear-gradient(90deg, rgba(255, 100, 100, 0.6) 0%, rgba(255, 50, 50, 0.8) 100%);
        }

        .input-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--accent-red);
          text-align: center;
        }

        .drs-count {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent-red);
          text-align: center;
        }

        .drs-ratio {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default TelemetryInputs;
