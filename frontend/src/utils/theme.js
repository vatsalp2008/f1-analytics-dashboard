/**
 * Theme utilities — manage dark/light mode preference.
 */

const THEME_KEY = 'f1-dashboard-theme';

export function getThemePreference() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return stored;

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function setThemePreference(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function initializeTheme() {
  const preference = getThemePreference();
  document.documentElement.setAttribute('data-theme', preference);
  return preference;
}

export function toggleTheme() {
  const current = getThemePreference();
  const next = current === 'dark' ? 'light' : 'dark';
  setThemePreference(next);
  return next;
}
