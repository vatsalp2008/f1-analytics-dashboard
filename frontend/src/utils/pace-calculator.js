/**
 * Race pace calculation utilities — estimate finish times and fuel usage.
 */

export function calculateAveragePace(frames, driverCode) {
  if (!frames || frames.length === 0) return 0;

  const driverFrames = frames
    .map((f) => f.drivers[driverCode])
    .filter((d) => d !== undefined);

  if (driverFrames.length === 0) return 0;

  const lapCount = Math.max(...driverFrames.map((d) => d.lap));
  const duration = frames[frames.length - 1].t;

  return lapCount > 0 ? duration / lapCount : 0;
}

export function projectRaceTime(currentPace, totalLaps, completedLaps) {
  const remainingLaps = totalLaps - completedLaps;
  const remainingTime = remainingLaps * currentPace;
  return remainingTime;
}

export function estimateFuelUsage(pace, totalLaps, fuelPerLap = 2.5) {
  return totalLaps * fuelPerLap;
}

export function calculatePitStopLoss(stopDuration = 24) {
  return stopDuration;
}

export function formatRaceTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(1);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

export function getDeltaToLeader(leaderPace, driverPace) {
  const delta = driverPace - leaderPace;
  return delta;
}

export function lapsRemaining(frames, driverCode, targetLaps = 58) {
  if (!frames || frames.length === 0) return targetLaps;

  const driverFrames = frames
    .map((f) => f.drivers[driverCode])
    .filter((d) => d !== undefined);

  if (driverFrames.length === 0) return targetLaps;

  const currentLap = Math.floor(driverFrames[driverFrames.length - 1].lap);
  return Math.max(0, targetLaps - currentLap);
}
