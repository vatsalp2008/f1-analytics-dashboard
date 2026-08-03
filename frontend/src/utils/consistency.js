/**
 * Consistency index utilities — measure driver steadiness and reliability.
 */

export function calculateConsistencyIndex(frames, driverCode) {
  if (!frames || frames.length === 0) return 0;

  const driverFrames = frames
    .map((f) => f.drivers[driverCode])
    .filter((d) => d !== undefined);

  if (driverFrames.length < 10) return 0;

  const speeds = driverFrames.map((d) => d.speed);
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);

  const coefficient = avgSpeed > 0 ? (stdDev / avgSpeed) * 100 : 0;
  const consistencyScore = Math.max(0, 100 - coefficient * 2);

  return consistencyScore;
}

export function calculateLapConsistency(frames, driverCode) {
  if (!frames || frames.length === 0) return [];

  const lapTimes = {};

  frames.forEach((frame, idx) => {
    if (frame.drivers[driverCode]) {
      const data = frame.drivers[driverCode];
      const lap = Math.floor(data.lap);

      if (!lapTimes[lap]) {
        lapTimes[lap] = [];
      }
      lapTimes[lap].push(data.speed);
    }
  });

  return Object.entries(lapTimes)
    .map(([lap, speeds]) => {
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      return {
        lap: Number(lap),
        avgSpeed,
      };
    })
    .sort((a, b) => a.lap - b.lap);
}

export function calculatePeakToTrough(frames, driverCode) {
  if (!frames || frames.length === 0) return { peak: 0, trough: 0, ratio: 0 };

  const speeds = frames
    .map((f) => f.drivers[driverCode]?.speed)
    .filter((s) => s !== undefined);

  if (speeds.length === 0) return { peak: 0, trough: 0, ratio: 0 };

  const peak = Math.max(...speeds);
  const trough = Math.min(...speeds);

  return {
    peak,
    trough,
    ratio: peak > 0 ? ((peak - trough) / peak) * 100 : 0,
  };
}

export function getConsistencyLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 65) return 'Fair';
  if (score >= 50) return 'Variable';
  return 'Inconsistent';
}

export function getConsistencyColor(score) {
  if (score >= 85) return '#00ff00';
  if (score >= 75) return '#7fff00';
  if (score >= 65) return '#ffff00';
  if (score >= 50) return '#ff9500';
  return '#ff4444';
}
