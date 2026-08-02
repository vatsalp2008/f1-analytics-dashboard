import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import CountUp from '../reactbits/CountUp/CountUp';

const TeamStandingsView = ({ events, predictions }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const standings = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];

    const teams = {};
    predictions.forEach((p) => {
      p.predictions?.forEach((driver) => {
        const team = driver.Team || 'Unknown';
        if (!teams[team]) {
          teams[team] = {
            name: team,
            drivers: [],
            points: 0,
          };
        }
        teams[team].drivers.push(driver.DriverFullName);
        const position = p.predictions.indexOf(driver) + 1;
        if (position === 1) teams[team].points += 25;
        else if (position === 2) teams[team].points += 18;
        else if (position === 3) teams[team].points += 15;
        else if (position <= 10) teams[team].points += Math.max(0, 12 - (position - 4));
      });
    });

    return Object.values(teams)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [predictions]);

  return (
    <div className="team-standings-view">
      <div className="standings-header">
        <h3>Team Standings</h3>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="standings-list">
        {standings.length > 0 ? (
          standings.map((team, i) => (
            <div key={team.name} className="team-row rise-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="team-rank">{i + 1}</div>
              <div className="team-info">
                <span className="team-name">{team.name}</span>
                <span className="team-drivers">{team.drivers.join(', ')}</span>
              </div>
              <div className="team-points">
                <TrendingUp size={16} />
                <CountUp to={team.points} duration={0.8} />
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No standings data available</div>
        )}
      </div>

      <style jsx>{`
        .team-standings-view {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
        }

        .standings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .standings-header h3 {
          margin: 0;
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

        .standings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 350px;
          overflow-y: auto;
        }

        .team-row {
          display: grid;
          grid-template-columns: 40px 1fr 100px;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .team-row:hover {
          background: rgba(225, 6, 0, 0.1);
          transform: translateX(4px);
        }

        .team-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(225, 6, 0, 0.2);
          border-radius: 50%;
          font-weight: 700;
          color: var(--accent-red);
          font-size: 0.875rem;
        }

        .team-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .team-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .team-drivers {
          font-size: 0.7rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .team-points {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--accent-red);
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

export default TeamStandingsView;
