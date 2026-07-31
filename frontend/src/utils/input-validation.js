/**
 * Input validation utilities for API parameters and form fields.
 */

export const VALID_SESSION_TYPES = ['R', 'Q', 'S', 'FP1', 'FP2', 'FP3'];

export function validateYear(year) {
  const n = Number(year);
  if (!Number.isInteger(n) || n < 1950 || n > 2030) {
    throw new Error(`Year must be between 1950 and 2030, got ${year}`);
  }
  return n;
}

export function validateRound(round) {
  const n = Number(round);
  if (!Number.isInteger(n) || n < 1 || n > 25) {
    throw new Error(`Round must be between 1 and 25, got ${round}`);
  }
  return n;
}

export function validateSessionType(type) {
  if (!VALID_SESSION_TYPES.includes(type)) {
    throw new Error(`Invalid session type ${type}. Valid: ${VALID_SESSION_TYPES.join(', ')}`);
  }
  return type;
}

export function sanitizeDriverName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/[<>]/g, '');
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
