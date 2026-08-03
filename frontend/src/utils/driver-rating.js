/**
 * Driver rating system — calculate performance scores from telemetry data.
 */

export function calculateDriverRating(frames, driverCode) {
  if (!frames || frames.length === 0) return 0;

  const driverFrames = frames
    .map((f) => f.drivers[driverCode])
    .filter((d) => d !== undefined);

  if (driverFrames.length === 0) return 0;

  const avgSpeed = driverFrames.reduce((sum, d) => sum + d.speed, 0) / driverFrames.length;
  const maxSpeed = Math.max(...driverFrames.map((d) => d.speed));
  const consistencyScore = calculateConsistency(driverFrames.map((d) => d.speed));
  const positionScore = calculatePositionScore(driverFrames);
  const drsEfficiency = calculateDrsEfficiency(driverFrames);

  const speedScore = (avgSpeed / maxSpeed) * 100;
  const finalScore = (speedScore * 0.4 + consistencyScore * 0.3 + positionScore * 0.2 + drsEfficiency * 0.1) / 100;

  return Math.max(0, Math.min(100, finalScore * 100));
}

function calculateConsistency(speeds) {
  if (speeds.length === 0) return 0;
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 100 - (stdDev / avg) * 50);
}

function calculatePositionScore(frames) {
  if (frames.length === 0) return 0;
  const avgPos = frames.reduce((sum, f) => sum + f.position, 0) / frames.length;
  return Math.max(0, 100 - avgPos * 5);
}

function calculateDrsEfficiency(frames) {
  const drsFrames = frames.filter((f) => f.drs > 0);
  const avgDrsSpeed = drsFrames.length > 0 ? drsFrames.reduce((sum, f) => sum + f.speed, 0) / drsFrames.length : 0;
  const avgNormalSpeed = frames.length > 0 ? frames.reduce((sum, f) => sum + f.speed, 0) / frames.length : 0;
  const efficiency = avgNormalSpeed > 0 ? (avgDrsSpeed / avgNormalSpeed) * 100 : 0;
  return Math.min(100, efficiency);
}

export function getRatingColor(rating) {
  if (rating >= 85) return '#00ff00';
  if (rating >= 75) return '#7fff00';
  if (rating >= 65) return '#ffff00';
  if (rating >= 50) return '#ff9500';
  return '#ff4444';
}

export function getRatingLabel(rating) {
  if (rating >= 90) return 'Elite';
  if (rating >= 80) return 'Excellent';
  if (rating >= 70) return 'Good';
  if (rating >= 60) return 'Average';
  if (rating >= 50) return 'Fair';
  return 'Below Average';
}

export function calculateTeamRating(frames, teamDrivers) {
  if (!teamDrivers || teamDrivers.length === 0) return 0;
  const ratings = teamDrivers.map((driver) => calculateDriverRating(frames, driver));
  return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
}
