import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, Minus } from 'lucide-react';

const GridFinishComparison = ({ frames }) => {
  const comparison = useMemo(() => {
    if (!frames || frames.length === 0) return [];

    const results = {};

    frames.forEach((frame) => {
      Object.entries(frame.drivers).forEach(([code, data]) => {
        if (!results[code]) {
          results[code] = { code, gridPos: data.position, finalPos: data.position };
        }
        results[code].finalPos = data.position;
      });
    });

    return Object.values(results)
      .map((r) => ({
        ...r,
        delta: r.gridPos - r.finalPos,
      }))
      .sort((a, b) => b.delta - a.delta);
  }, [frames]);

  return (
    <div className="grid-finish-comparison">
      <div className="comparison-header">
        <h3>Qualifying vs Race</h3>
        <span className="info">Position Change</span>
      </div>

      <div className="results-table">
        <div className="table-header">
          <span className="col-driver">Driver</span>
          <span className="col-pos">Grid</span>
          <span className="col-pos">Race</span>
          <span className="col-delta">Δ</span>
        </div>

        {comparison.map((result, idx) => {
          let Icon = Minus;
          let deltaClass = 'flat';

          if (result.delta > 0) {
            Icon = ArrowUpRight;
            deltaClass = 'gain';
          } else if (result.delta < 0) {
            Icon = ArrowDownLeft;
            deltaClass = 'loss';
          }

          return (
            <div key={result.code} className="table-row rise-in" style={{ animationDelay: `${idx * 0.03}s` }}>
              <span className="col-driver">{result.code}</span>
              <span className="col-pos">P{result.gridPos}</span>
              <span className="col-pos">P{result.finalPos}</span>
              <span className={`col-delta ${deltaClass}`}>
                <Icon size={14} />
                {Math.abs(result.delta)}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .grid-finish-comparison {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .comparison-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .comparison-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .info {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .results-table {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 1fr 60px 60px 80px;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          align-items: center;
        }

        .table-header {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(225, 6, 0, 0.15);
          position: sticky;
          top: 0;
          background: rgba(0, 0, 0, 0.2);
        }

        .table-row {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.1);
          border-radius: 4px;
          transition: all 0.2s;
        }

        .table-row:hover {
          background: rgba(225, 6, 0, 0.08);
        }

        .col-driver {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .col-pos {
          text-align: center;
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .col-delta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .col-delta.gain {
          color: #51cf66;
        }

        .col-delta.loss {
          color: #ff6b6b;
        }

        .col-delta.flat {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default GridFinishComparison;
