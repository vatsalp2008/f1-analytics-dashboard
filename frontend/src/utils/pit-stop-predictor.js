/**
 * Pit stop timing predictor — estimate optimal pit stop strategies.
 */

export function predictPitStopLap(pace, fuelCapacity = 110, fuelPerLap = 2.5) {
  const lapsPerTank = Math.floor(fuelCapacity / fuelPerLap);
  return lapsPerTank;
}

export function calculateOptimalStops(totalLaps, fuelPerLap = 2.5, fuelCapacity = 110) {
  const lapsPerTank = Math.floor(fuelCapacity / fuelPerLap);
  const stopsNeeded = Math.ceil(totalLaps / lapsPerTank);
  const stops = [];

  for (let i = 1; i < stopsNeeded; i++) {
    stops.push({
      number: i,
      lapWindow: {
        start: Math.max(1, i * lapsPerTank - 5),
        optimal: i * lapsPerTank,
        end: i * lapsPerTank + 5,
      },
    });
  }

  return stops;
}

export function estimatePitStopLoss(tireChangeTime = 24, entry = 4, exit = 2) {
  return tireChangeTime + entry + exit;
}

export function calculateGainFromPit(positionsBefore, positionsAfter) {
  return Math.max(0, positionsBefore - positionsAfter);
}

export function isPitWindowOptimal(currentLap, lapWindow) {
  return currentLap >= lapWindow.start && currentLap <= lapWindow.end;
}

export function getNextPitWindow(currentLap, stops) {
  return stops.find((s) => s.lapWindow.optimal > currentLap);
}

export function calculateRisksOfNotPitting(currentLap, lapsTillEnd, fuelPerLap = 2.5, fuelRemaining) {
  const fuelNeeded = lapsTillEnd * fuelPerLap;
  const willRunOut = fuelRemaining < fuelNeeded;

  return {
    willRunOut,
    fuelShortage: willRunOut ? fuelNeeded - fuelRemaining : 0,
    lapsWithoutPit: Math.floor(fuelRemaining / fuelPerLap),
  };
}
