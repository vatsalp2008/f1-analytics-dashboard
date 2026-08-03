import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { calculateDriverRating, getRatingColor, getRatingLabel } from '../utils/driver-rating';

const DriverRatings = ({ frames }) => {
  const ratings = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const drivers = new Set();
    frames.forEach((f) => {
      Object.keys(f.drivers).forEach((code) => drivers.add(code));
    });

    return Array.from(drivers)
      .map((code) => ({
        code,
        rating: calculateDriverRating(frames, code),
      }))
      .sort((a, b) => b.rating - a.rating);
  }, [frames]);

  return (
    <div className="driver-ratings">
      <div className="ratings-header">
        <h3>
          <Trophy size={16} />
          Performance Ratings
        </h3>
      </div>

      <div className="ratings-list">
        {ratings.map((driver, i) => (
          <div key={driver.code} className="rating-row rise-in" style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="rank">{i + 1}</div>
            <div className="driver-info">
              <span className="code">{driver.code}</span>
              <span className="label">{getRatingLabel(driver.rating)}</span>
            </div>
            <div className="rating-visual">
              <div className="rating-bar">
                <div
                  className="rating-fill"
                  style={{
                    width: `${driver.rating}%`,
                    backgroundColor: getRatingColor(driver.rating),
                  }}
                />
              </div>
            </div>
            <span className="rating-score">{driver.rating.toFixed(0)}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .driver-ratings {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .ratings-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .ratings-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .ratings-header svg {
          color: var(--accent-red);
        }

        .ratings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .rating-row {
          display: grid;
          grid-template-columns: 30px 60px 1fr 50px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .rating-row:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .rank {
          font-weight: 700;
          color: var(--accent-red);
          text-align: center;
          font-size: 0.95rem;
        }

        .driver-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .code {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .rating-visual {
          display: flex;
          align-items: center;
        }

        .rating-bar {
          width: 100%;
          height: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          overflow: hidden;
        }

        .rating-fill {
          height: 100%;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .rating-score {
          font-weight: 700;
          color: var(--text-primary);
          text-align: right;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default DriverRatings;
