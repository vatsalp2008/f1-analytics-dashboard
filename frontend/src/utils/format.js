// Small formatting helpers shared by RaceMenu and PredictionsView.

// "AU" -> "🇦🇺". Returns empty string if code is missing/invalid.
// Modern browsers + macOS render this as a real flag; on Windows it falls
// back to the two regional-indicator letters, which is still legible.
export const flagFromCountryCode = (code) => {
  if (!code || code.length !== 2) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
};

// "2025-03-16" -> "Mar 16, 2025"
// Returns "" if dateStr is falsy / unparseable.
export const formatRaceDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
