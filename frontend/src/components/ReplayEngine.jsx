import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pause, Play, RotateCcw, ChevronLeft, FastForward, Rewind, Info, Wind, Thermometer, Droplets, CloudRain } from 'lucide-react';

const ReplayEngine = ({ data, onBack }) => {
    // Defensive check for data
    if (!data || !data.frames || data.frames.length === 0) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Initializing Replay Engine...</p>
                <button onClick={onBack} className="btn-exit">CANCEL</button>
                <style jsx>{`
                    .loading-screen { 
                        display: flex; flex-direction: column; align-items: center; justify-content: center; 
                        height: 100vh; background: #000; color: #fff; gap: 20px; 
                    }
                    .spinner { 
                        width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); 
                        border-top-color: #e10600; border-radius: 50%; animation: spin 1s linear infinite; 
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .btn-exit { background: #333; color: #666; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
                `}</style>
            </div>
        );
    }

    const { frames, driver_colors, total_laps, event_name } = data;

    // State
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [selectedDrivers, setSelectedDrivers] = useState([]);

    // Refs
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const canvasRef = useRef(null);

    // Derived data - safely
    const duration = frames[frames.length - 1]?.t || 0;
    const currentFrameIndex = useMemo(() => {
        const idx = frames.findIndex(f => f.t >= currentTime);
        return idx === -1 ? frames.length - 1 : idx;
    }, [currentTime, frames]);

    const currentFrame = frames[currentFrameIndex] || frames[0];
    const sortedDriversList = useMemo(() => {
        if (!currentFrame || !currentFrame.drivers) return [];
        return Object.entries(currentFrame.drivers)
            .sort((a, b) => a[1].position - b[1].position);
    }, [currentFrame]);

    const toggleDriver = (code) => {
        setSelectedDrivers(prev => {
            if (prev.includes(code)) return prev.filter(c => c !== code);
            if (prev.length >= 3) return [...prev.slice(1), code];
            return [...prev, code];
        });
    };

    const animate = time => {
        if (lastTimeRef.current !== undefined) {
            const deltaTime = (time - lastTimeRef.current) / 1000;
            if (isPlaying) {
                setCurrentTime(prev => {
                    const next = prev + deltaTime * playbackSpeed;
                    return next >= duration ? duration : next;
                });
            }
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, playbackSpeed, duration]);

    // Canvas Rendering
    useEffect(() => {
        if (!canvasRef.current || !data.track_map || data.track_map.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const xValues = data.track_map.map(p => p.x);
        const yValues = data.track_map.map(p => p.y);
        const minX = Math.min(...xValues), maxX = Math.max(...xValues);
        const minY = Math.min(...yValues), maxY = Math.max(...yValues);
        const rangeX = maxX - minX, rangeY = maxY - minY;
        const padding = 40;
        const scale = Math.min((canvas.width - padding * 2) / rangeX, (canvas.height - padding * 2) / rangeY);
        const toCanvasX = x => padding + (x - minX) * scale;
        const toCanvasY = y => canvas.height - (padding + (y - minY) * scale);

        // Draw track
        ctx.beginPath(); ctx.strokeStyle = '#222'; ctx.lineWidth = 14;
        data.track_map.forEach((p, i) => i === 0 ? ctx.moveTo(toCanvasX(p.x), toCanvasY(p.y)) : ctx.lineTo(toCanvasX(p.x), toCanvasY(p.y)));
        ctx.closePath(); ctx.stroke();

        ctx.beginPath(); ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
        data.track_map.forEach((p, i) => i === 0 ? ctx.moveTo(toCanvasX(p.x), toCanvasY(p.y)) : ctx.lineTo(toCanvasX(p.x), toCanvasY(p.y)));
        ctx.closePath(); ctx.stroke();

        // Draw drivers
        if (currentFrame && currentFrame.drivers) {
            sortedDriversList.forEach(([code, d]) => {
                const color = driver_colors[code] || '#fff';
                const isSelected = selectedDrivers.includes(code);
                if (isSelected) { ctx.shadowBlur = 15; ctx.shadowColor = color; }
                ctx.beginPath(); ctx.arc(toCanvasX(d.x), toCanvasY(d.y), isSelected ? 8 : 5, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.fill();
                if (isSelected) { ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0; }
                ctx.fillStyle = 'white'; ctx.font = '900 11px Inter'; ctx.textAlign = 'center';
                ctx.fillText(code, toCanvasX(d.x), toCanvasY(d.y) - 14);
            });
        }
    }, [currentFrame, selectedDrivers, driver_colors, sortedDriversList, data.track_map]);

    const formatClock = seconds => {
        const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const firstDriver = currentFrame?.drivers ? Object.values(currentFrame.drivers)[0] : null;

    return (
        <div className="replay-container">
            <header className="top-bar">
                <div className="race-info">
                    <div className="lap-counter">Lap: {firstDriver?.lap || 0}/{total_laps}</div>
                    <div className="race-timer">Race Time: {formatClock(currentTime)} (x{playbackSpeed.toFixed(1)})</div>
                </div>
                <button onClick={onBack} className="btn-exit">EXIT REPLAY</button>
            </header>

            <main className="main-viewport">
                <aside className="left-panel">
                    <section className="weather-card glass">
                        <h4>Weather (Bahrain)</h4>
                        <div className="weather-grid">
                            <div className="w-item"><Thermometer size={14} /> Track: 23.3°C</div>
                            <div className="w-item"><Thermometer size={14} /> Air: 18.5°C</div>
                            <div className="w-item"><Droplets size={14} /> Humidity: 73%</div>
                            <div className="w-item"><Wind size={14} /> Wind: 1.0 km/h S</div>
                            <div className="w-item"><CloudRain size={14} /> Rain: DRY</div>
                        </div>
                    </section>
                    <section className="telemetry-stack">
                        {selectedDrivers.map(code => {
                            const d = currentFrame?.drivers?.[code];
                            if (!d) return null;
                            return (
                                <div key={code} className="tele-card glass" style={{ borderLeft: `6px solid ${driver_colors[code]}` }}>
                                    <div className="card-header">Driver: {code}</div>
                                    <div className="card-body">
                                        <div className="stats-main">
                                            <div className="s-row">Speed: <span>{Math.round(d.speed)} km/h</span></div>
                                            <div className="s-row">Gear: <span>{d.gear}</span></div>
                                            <div className="s-row">DRS: <span className={d.drs >= 10 ? 'drs-on' : ''}>{d.drs >= 10 ? 'ON' : 'OFF'}</span></div>
                                        </div>
                                        <div className="pedal-bars">
                                            <div className="bar throttle" style={{ height: `${(d.speed / 350) * 100}%` }}></div>
                                            <div className="bar brake" style={{ height: `${d.speed > 200 ? 5 : (300 - d.speed) / 5}%` }}></div>
                                            <div className="bar-labels"><span>THR</span><span>BRK</span></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                </aside>

                <div className="track-area">
                    <canvas ref={canvasRef} width={1000} height={700} />
                </div>

                <aside className="right-panel glass">
                    <h3>Leaderboard</h3>
                    <div className="lb-list">
                        {sortedDriversList.map(([code, d]) => (
                            <div key={code} className={`lb-item ${selectedDrivers.includes(code) ? 'selected' : ''}`} onClick={() => toggleDriver(code)}>
                                <span className="pos">{d.position}.</span>
                                <span className="code" style={{ color: driver_colors[code] }}>{code}</span>
                                <div className="tyre-dot" style={{ backgroundColor: d.tyre === 1 ? '#ff1e1e' : d.tyre === 2 ? '#fff000' : '#fff' }} />
                                {selectedDrivers.includes(code) && <Info size={12} className="info-icon" />}
                            </div>
                        ))}
                    </div>
                </aside>
            </main>

            <footer className="bottom-bar glass">
                <div className="progress-section">
                    <div className="sector-bar">
                        <div className="sector s1" style={{ width: '30%', background: '#2ecc71' }}></div>
                        <div className="sector s2" style={{ width: '40%', background: '#f1c40f' }}></div>
                        <div className="sector s3" style={{ width: '30%', background: '#ff4757' }}></div>
                        <div className="progress-handle" style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div className="controls-group">
                    <div className="playback-btns">
                        <button onClick={() => setCurrentTime(prev => Math.max(0, prev - 30))}><Rewind size={20} /></button>
                        <button className="btn-play" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                        </button>
                        <button onClick={() => setCurrentTime(prev => Math.min(duration, prev + 30))}><FastForward size={20} /></button>
                        <button onClick={() => { setCurrentTime(0); setIsPlaying(true); }}><RotateCcw size={20} /></button>
                    </div>
                    <div className="speed-picker">
                        <span className="speed-val">{playbackSpeed}x</span>
                        <input type="range" min="0.5" max="16" step="0.5" value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} />
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .replay-container { width: 100vw; height: 100vh; background: #000; color: #fff; display: flex; flex-direction: column; padding: 20px; overflow: hidden; font-family: 'Inter', sans-serif; }
                .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
                .lap-counter { font-size: 1.5rem; font-weight: 800; }
                .race-timer { color: #888; font-size: 0.9rem; margin-top: 4px; }
                .btn-exit { background: #e10600; color: white; border: none; padding: 8px 16px; font-weight: 800; border-radius: 4px; cursor: pointer; }
                .main-viewport { flex: 1; display: flex; gap: 20px; min-height: 0; }
                .left-panel { width: 280px; display: flex; flex-direction: column; gap: 15px; }
                .right-panel { width: 220px; padding: 15px; display: flex; flex-direction: column; }
                .track-area { flex: 1; display: flex; justify-content: center; align-items: center; position: relative; }
                canvas { max-width: 100%; max-height: 100%; }
                .glass { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; }
                .weather-card { padding: 12px; }
                .weather-card h4 { font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #222; }
                .weather-grid { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: #aaa; }
                .w-item { display: flex; align-items: center; gap: 6px; }
                .telemetry-stack { display: flex; flex-direction: column; gap: 12px; }
                .tele-card { padding: 0; overflow: hidden; height: 130px; transition: transform 0.2s; }
                .card-header { background: rgba(255,255,255,0.03); padding: 5px 12px; font-weight: 800; font-size: 0.8rem; color: #888; }
                .card-body { padding: 12px; display: flex; justify-content: space-between; height: calc(100% - 28px); }
                .stats-main { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
                .stats-main span { color: #fff; font-weight: 700; }
                .drs-on { color: #2ecc71 !important; text-shadow: 0 0 10px rgba(46, 204, 113, 0.5); }
                .pedal-bars { width: 50px; display: flex; align-items: flex-end; gap: 4px; position: relative; background: #080808; padding: 2px; border-radius: 2px; }
                .bar { width: 100%; border-radius: 1px; transition: height 0.1s; }
                .bar.throttle { background: #2ecc71; }
                .bar.brake { background: #ff4757; }
                .bar-labels { position: absolute; bottom: -16px; left: 0; width: 100%; display: flex; justify-content: space-around; font-size: 0.55rem; color: #444; }
                .lb-list { flex: 1; overflow-y: auto; margin-top: 10px; }
                .lb-item { display: flex; align-items: center; padding: 6px 8px; font-size: 0.85rem; cursor: pointer; border-radius: 4px; }
                .lb-item:hover { background: rgba(255,255,255,0.05); }
                .lb-item.selected { background: rgba(225, 6, 0, 0.2); border: 1px solid rgba(225, 6, 0, 0.3); }
                .lb-item .pos { width: 22px; opacity: 0.4; font-weight: 700; }
                .lb-item .code { flex: 1; font-weight: 700; }
                .tyre-dot { width: 7px; height: 7px; border-radius: 50%; margin: 0 8px; }
                .info-icon { color: #2ecc71; }
                .bottom-bar { margin-top: 10px; padding: 15px; display: flex; flex-direction: column; gap: 15px; }
                .sector-bar { height: 8px; background: #111; width: 100%; position: relative; display: flex; border-radius: 4px; }
                .progress-handle { position: absolute; top: -6px; width: 3px; height: 20px; background: #fff; box-shadow: 0 0 10px #fff; z-index: 10; }
                .controls-group { display: flex; justify-content: center; align-items: center; gap: 60px; }
                .playback-btns { display: flex; align-items: center; gap: 20px; }
                .playback-btns button { background: none; color: #fff; cursor: pointer; border: none; }
                .btn-play { background: #fff !important; color: #000 !important; border-radius: 50%; padding: 8px; }
                .speed-picker { display: flex; align-items: center; gap: 10px; width: 180px; }
                .speed-val { font-weight: 800; width: 45px; text-align: right; color: #e10600; }
                input[type=range] { flex: 1; accent-color: #e10600; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default ReplayEngine;
