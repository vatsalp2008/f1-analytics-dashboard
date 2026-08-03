/**
 * Outlier detection utilities — identify anomalous lap performances.
 */

export function detectLapOutliers(frames, driverCode, threshold = 1.5) {
  if (!frames || frames.length === 0) return [];

  const lapTimes = {};

  frames.forEach((frame, idx) => {
    if (frame.drivers[driverCode]) {
      const data = frame.drivers[driverCode];
      const lap = Math.floor(data.lap);

      if (!lapTimes[lap]) {
        lapTimes[lap] = [];
      }
      lapTimes[lap].push({
        speed: data.speed,
        time: frame.t,
      });
    }
  });

  const lapAverages = Object.entries(lapTimes).map(([lap, samples]) => {
    const avgSpeed = samples.reduce((sum, s) => sum + s.speed, 0) / samples.length;
    return {
      lap: Number(lap),
      avgSpeed,
    };
  });

  if (lapAverages.length < 3) return [];

  const meanSpeed = lapAverages.reduce((sum, l) => sum + l.avgSpeed, 0) / lapAverages.length;
  const stdDev = Math.sqrt(
    lapAverages.reduce((sum, l) => sum + Math.pow(l.avgSpeed - meanSpeed, 2), 0) / lapAverages.length
  );

  return lapAverages
    .filter((l) => Math.abs(l.avgSpeed - meanSpeed) > stdDev * threshold)
    .map((l) => ({
      ...l,
      deviation: l.avgSpeed - meanSpeed,
      severity: Math.abs(l.avgSpeed - meanSpeed) / stdDev,
    }));
}

export function getOutlierType(deviation) {
  if (deviation > 0) return 'fast';
  return 'slow';
}

export function isSignificantOutlier(outlier) {
  return outlier.severity > 2;
}
