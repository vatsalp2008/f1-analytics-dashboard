import React, { useState, useMemo } from 'react';
import { Star, Trash2, Calendar } from 'lucide-react';
import { getFavorites, removeFavorite, clearAllFavorites } from '../utils/favorites';
import { flagFromCountryCode } from '../utils/format';

const FavoritesPanel = ({ onSelectRace }) => {
  const [favorites, setFavorites] = useState(getFavorites());

  const handleRemove = (year, round) => {
    removeFavorite(year, round);
    setFavorites(getFavorites());
  };

  const handleClear = () => {
    if (window.confirm('Clear all favorites?')) {
      clearAllFavorites();
      setFavorites([]);
    }
  };

  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }, [favorites]);

  return (
    <div className="favorites-panel">
      <div className="panel-header">
        <h3>
          <Star size={16} />
          Saved Races
        </h3>
        {favorites.length > 0 && (
          <button className="clear-btn" onClick={handleClear} title="Clear all favorites">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <Star size={32} />
          <p>No saved races yet</p>
          <small>Star your favorite races to save them</small>
        </div>
      ) : (
        <div className="favorites-list">
          {sortedFavorites.map((fav) => (
            <div key={fav.id} className="favorite-item rise-in">
              <div className="item-info">
                <div className="race-name">{fav.eventName}</div>
                <div className="race-meta">
                  <Calendar size={12} />
                  <span>{fav.year} • Round {fav.round}</span>
                </div>
              </div>
              <button
                className="remove-btn"
                onClick={() => handleRemove(fav.year, fav.round)}
                title="Remove from favorites"
              >
                <Star size={16} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .favorites-panel {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(45, 45, 60, 0.4) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .panel-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .panel-header svg {
          color: var(--accent-red);
        }

        .clear-btn {
          padding: 0.4rem;
          background: rgba(225, 6, 0, 0.15);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--accent-red);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-btn:hover {
          background: rgba(225, 6, 0, 0.25);
        }

        .empty-favorites {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .empty-favorites svg {
          opacity: 0.3;
        }

        .empty-favorites p {
          margin: 0;
          font-weight: 600;
        }

        .empty-favorites small {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .favorites-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .favorite-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .favorite-item:hover {
          background: rgba(225, 6, 0, 0.1);
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
        }

        .race-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .race-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .remove-btn {
          padding: 0.4rem;
          background: transparent;
          border: none;
          color: var(--accent-red);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .remove-btn:hover {
          color: #ff4444;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default FavoritesPanel;
