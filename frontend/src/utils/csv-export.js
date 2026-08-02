/**
 * Telemetry data export utilities — convert race data to CSV format.
 */

export function exportTelemetryAsCSV(frames, eventName, sessionType = 'Race') {
  if (!frames || frames.length === 0) {
    console.warn('No frames to export');
    return;
  }

  const rows = [];
  const headers = ['Time(s)', 'Driver', 'Position', 'Speed(kmh)', 'Lap', 'Gear', 'DRS', 'Tyre'];
  rows.push(headers.join(','));

  frames.forEach((frame) => {
    Object.entries(frame.drivers).forEach(([code, data]) => {
      const row = [
        frame.t.toFixed(2),
        code,
        data.position,
        data.speed.toFixed(1),
        Math.round(data.lap),
        data.gear,
        data.drs,
        getTyreName(data.tyre),
      ];
      rows.push(row.join(','));
    });
  });

  downloadCSV(rows.join('\n'), `${eventName}-${sessionType}-telemetry.csv`);
}

export function exportLapTimesAsCSV(frames, eventName) {
  if (!frames || frames.length === 0) return;

  const drivers = new Set();
  frames.forEach((frame) => {
    Object.keys(frame.drivers).forEach((code) => drivers.add(code));
  });

  const lapTimes = {};
  drivers.forEach((driver) => {
    lapTimes[driver] = [];
  });

  let lastLap = 0;
  const driverLastTimes = {};

  frames.forEach((frame) => {
    Object.entries(frame.drivers).forEach(([code, data]) => {
      if (data.lap > lastLap) {
        if (driverLastTimes[code]) {
          const lapTime = frame.t - driverLastTimes[code];
          if (lapTime > 0 && lapTime < 300) {
            lapTimes[code].push(lapTime);
          }
        }
        driverLastTimes[code] = frame.t;
      }
    });
    lastLap = Math.max(lastLap, ...Object.values(frames[frames.length - 1]?.drivers || {}).map((d) => d.lap));
  });

  const rows = [];
  const maxLaps = Math.max(...Object.values(lapTimes).map((times) => times.length), 1);

  const headers = ['Lap', ...Array.from(drivers).sort()];
  rows.push(headers.join(','));

  for (let lap = 1; lap <= maxLaps; lap++) {
    const row = [lap.toString()];
    Array.from(drivers)
      .sort()
      .forEach((driver) => {
        const time = lapTimes[driver][lap - 1];
        row.push(time ? time.toFixed(2) : '');
      });
    rows.push(row.join(','));
  }

  downloadCSV(rows.join('\n'), `${eventName}-lap-times.csv`);
}

export function getTyreName(tyreCode) {
  const names = { 1: 'Soft', 2: 'Medium', 3: 'Hard', 4: 'Intermediate', 5: 'Wet' };
  return names[tyreCode] || 'Unknown';
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
