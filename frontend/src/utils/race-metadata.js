/**
 * Race weekend metadata utilities — extract and validate F1 session information.
 */

export const SESSION_TYPES = {
  FP1: { name: 'Free Practice 1', order: 1, duration: 60 },
  FP2: { name: 'Free Practice 2', order: 2, duration: 60 },
  FP3: { name: 'Free Practice 3', order: 3, duration: 60 },
  Q: { name: 'Qualifying', order: 4, duration: 60 },
  S: { name: 'Sprint', order: 5, duration: 30 },
  R: { name: 'Race', order: 6, duration: 120 },
};

export function getSessionName(sessionType) {
  return SESSION_TYPES[sessionType]?.name || 'Unknown Session';
}

export function getSessionOrder(sessionType) {
  return SESSION_TYPES[sessionType]?.order || 999;
}

export function getSessionDuration(sessionType) {
  return SESSION_TYPES[sessionType]?.duration || 60;
}

export function sortSessionsByOrder(sessions) {
  return [...sessions].sort((a, b) => getSessionOrder(a) - getSessionOrder(b));
}

export function validateRaceMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, error: 'Invalid metadata object' };
  }

  const required = ['round', 'name', 'location', 'country_code', 'date'];
  const missing = required.filter((field) => !metadata[field]);

  if (missing.length > 0) {
    return { valid: false, error: `Missing fields: ${missing.join(', ')}` };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date)) {
    return { valid: false, error: 'Invalid date format (expected YYYY-MM-DD)' };
  }

  if (typeof metadata.round !== 'number' || metadata.round < 1 || metadata.round > 25) {
    return { valid: false, error: 'Round must be between 1 and 25' };
  }

  return { valid: true };
}

export function formatRaceWeekend(race) {
  return {
    ...race,
    sessionName: getSessionName('R'),
    displayDate: new Date(race.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };
}

export function getRaceCountdown(raceDate) {
  const now = new Date();
  const race = new Date(raceDate);
  const diff = race - now;

  if (diff < 0) return { status: 'completed', days: 0 };
  if (diff < 86400000) return { status: 'today', days: 0 };
  if (diff < 604800000) return { status: 'upcoming', days: Math.ceil(diff / 86400000) };
  return { status: 'future', days: Math.ceil(diff / 86400000) };
}
