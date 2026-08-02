/**
 * Favorites management — persist user's bookmarked races.
 */

const FAVORITES_KEY = 'f1-dashboard-favorites';

export function getFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function addFavorite(year, round, eventName) {
  const favorites = getFavorites();
  const id = `${year}-${round}`;

  if (!favorites.find((f) => f.id === id)) {
    favorites.push({
      id,
      year,
      round,
      eventName,
      addedAt: new Date().toISOString(),
    });
    saveFavorites(favorites);
  }

  return favorites;
}

export function removeFavorite(year, round) {
  const id = `${year}-${round}`;
  const favorites = getFavorites().filter((f) => f.id !== id);
  saveFavorites(favorites);
  return favorites;
}

export function isFavorite(year, round) {
  const id = `${year}-${round}`;
  return getFavorites().some((f) => f.id === id);
}

export function clearAllFavorites() {
  localStorage.removeItem(FAVORITES_KEY);
  return [];
}
