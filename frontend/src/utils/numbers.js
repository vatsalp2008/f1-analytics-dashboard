/**
 * Number formatting utilities for consistent display across the app.
 */

export function formatSpeed(kmh, decimals = 0) {
  return Math.round(kmh * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function formatDelta(delta) {
  if (delta === 0) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
}

export function formatConfidence(pct) {
  if (pct >= 90) return 'Very High';
  if (pct >= 70) return 'High';
  if (pct >= 50) return 'Moderate';
  return 'Low';
}

export function formatPercentage(value, decimals = 1) {
  return (value * 100).toFixed(decimals) + '%';
}
