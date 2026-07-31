import React from 'react';

export default function SpeedChart({ frames, currentTime, leaderCode, driverColors }) {
  if (!frames || frames.length === 0 || !leaderCode) return null;

  // Extract speed data for the leader
  const speedData = frames
    .map(f => ({
      t: f.t,
      speed: f.drivers[leaderCode]?.speed || 0
    }))
    .filter((_, i) => i % 10 === 0); // Sample every 10 frames to reduce data

  if (speedData.length === 0) return null;

  const maxSpeed = Math.max(...speedData.map(d => d.speed), 350);
  const minSpeed = 0;
  const range = maxSpeed - minSpeed;

  const width = 200;
  const height = 60;
  const padding = 5;

  const points = speedData.map((d, i) => ({
    x: (i / (speedData.length - 1 || 1)) * (width - padding * 2) + padding,
    y: height - ((d.speed - minSpeed) / range) * (height - padding * 2) - padding
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Highlight current position
  const currentIndex = Math.floor((currentTime / (frames[frames.length - 1]?.t || 1)) * (speedData.length - 1));
  const currentPoint = points[currentIndex];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '6px',
      padding: '8px',
      fontSize: '0.7rem',
      color: '#aaa'
    }}>
      <div style={{ marginBottom: '4px' }}>Leader Speed (km/h)</div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={driverColors[leaderCode] || '#fff'}
          strokeWidth="1.5"
          opacity="0.7"
        />
        {currentPoint && (
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r="2"
            fill={driverColors[leaderCode] || '#fff'}
          />
        )}
      </svg>
    </div>
  );
}
