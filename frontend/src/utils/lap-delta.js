/**
 * Lap delta time utilities — calculate time gaps between drivers.
 */

export function calculateLapDeltas(frames) {
  if (!frames || frames.length === 0) return {};

  const deltas = {};
  const drivers = new Set();

  // Get all unique drivers
  frames.forEach((frame) => {
    Object.keys(frame.drivers).forEach((code) => drivers.add(code));
  });

  // Initialize delta tracking
  drivers.forEach((driver) => {
    deltas[driver] = [];
  });

  // Find the leader (highest position = lowest number)
  frames.forEach((frame) => {
    let leader = null;
    let minPos = Infinity;

    Object.entries(frame.drivers).forEach(([code, data]) => {
      if (data.position < minPos) {
        minPos = data.position;
        leader = code;
      }
    });

    if (!leader) return;

    const leaderData = frame.drivers[leader];

    Object.entries(frame.drivers).forEach(([code, data]) => {
      const lapDiff = data.lap - leaderData.lap;
      const timeDelta = lapDiff > 0 ? 0 : Math.abs(data.t - leaderData.t);

      deltas[code].push({
        time: frame.t,
        gap: timeDelta,
        lapDiff,
        leader,
      });
    });
  });

  return deltas;
}

export function getAverageDelta(deltas, driverCode) {
  if (!deltas[driverCode] || deltas[driverCode].length === 0) return 0;
  const gaps = deltas[driverCode]
    .filter((d) => d.lapDiff >= 0)
    .map((d) => d.gap);
  return gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
}

export function getMaxDelta(deltas, driverCode) {
  if (!deltas[driverCode] || deltas[driverCode].length === 0) return 0;
  return Math.max(...deltas[driverCode].map((d) => d.gap));
}

export function formatDeltaTime(seconds) {
  if (seconds === 0) return '0.0s';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `+${minutes}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  return `+${secs.toFixed(2)}s`;
}

export function getDeltaTrend(deltas, driverCode) {
  if (!deltas[driverCode] || deltas[driverCode].length < 2) return 'stable';

  const recent = deltas[driverCode].slice(-10);
  const first = recent[0].gap;
  const last = recent[recent.length - 1].gap;

  if (last > first * 1.05) return 'increasing';
  if (last < first * 0.95) return 'decreasing';
  return 'stable';
}
