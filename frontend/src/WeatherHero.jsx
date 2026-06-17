import React, { useEffect, useRef, useMemo } from 'react';

// ── Determine day/night from actual CR local time + sun times ─
function getDayPhase(sunTimes) {
  if (!sunTimes?.sunrise || !sunTimes?.sunset) {
    const h = new Date().getHours();
    return h >= 6 && h < 19 ? 'day' : 'night';
  }
  const now     = Date.now();
  const sunrise = sunTimes.sunrise.getTime();
  const sunset  = sunTimes.sunset.getTime();
  if (now < sunrise - 30 * 60000)               return 'night';
  if (now < sunrise + 30 * 60000)               return 'dawn';
  if (now < sunset  - 30 * 60000)               return 'day';
  if (now < sunset  + 30 * 60000)               return 'dusk';
  return 'night';
}

// WMO weather code → condition
function getCondition(code) {
  if (code === 0)                      return 'clear';
  if (code <= 2)                       return 'partly';
  if (code <= 3)                       return 'cloudy';
  if (code >= 51 && code <= 67)        return 'rain';
  if (code >= 71 && code <= 77)        return 'snow';
  if (code >= 80 && code <= 82)        return 'shower';
  if (code >= 95)                      return 'storm';
  return 'partly';
}

// Sky gradient per phase + condition
const SKY = {
  day:   { top: '#0369a1', bot: '#38bdf8', star: false },
  dawn:  { top: '#1e1b4b', bot: '#f97316', star: true  },
  dusk:  { top: '#1e1b4b', bot: '#c2410c', star: true  },
  night: { top: '#020617', bot: '#0f172a', star: true  },
};

// ── Stars ─────────────────────────────────────────────────────
function Stars({ count = 60 }) {
  const stars = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 55,
    s: 0.5 + Math.random() * 2,
    d: 1.5 + Math.random() * 3,
    delay: Math.random() * 4,
  })), []);

  return (
    <div className="wh-stars" aria-hidden="true">
      {stars.map(s => (
        <div key={s.id} className="wh-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s,
          animationDuration: `${s.d}s`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
}

// ── Sun ───────────────────────────────────────────────────────
function Sun() {
  return (
    <div className="wh-sun" aria-hidden="true">
      <div className="wh-sun-core" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="wh-sun-ray" style={{ transform: `rotate(${i * 45}deg)` }} />
      ))}
      <div className="wh-sun-halo" />
    </div>
  );
}

// ── Moon ──────────────────────────────────────────────────────
function Moon() {
  return (
    <div className="wh-moon" aria-hidden="true">
      <div className="wh-moon-body" />
      <div className="wh-moon-crater" style={{ top: '22%', left: '28%', width: 6, height: 6 }} />
      <div className="wh-moon-crater" style={{ top: '50%', left: '45%', width: 4, height: 4 }} />
      <div className="wh-moon-crater" style={{ top: '65%', left: '20%', width: 5, height: 5 }} />
      <div className="wh-moon-glow" />
    </div>
  );
}

// ── Clouds ────────────────────────────────────────────────────
function Clouds({ coverage, condition }) {
  const count = coverage < 30 ? 1 : coverage < 60 ? 2 : coverage < 80 ? 3 : 5;
  const isStorm = condition === 'storm';
  const isRain  = condition === 'rain' || condition === 'shower';

  return (
    <div className="wh-clouds" aria-hidden="true">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`wh-cloud wh-cloud-${i + 1} ${isStorm ? 'wh-cloud-storm' : isRain ? 'wh-cloud-rain' : ''}`}>
          <div className="wh-cloud-body" />
          <div className="wh-cloud-puff wh-cloud-puff1" />
          <div className="wh-cloud-puff wh-cloud-puff2" />
        </div>
      ))}
    </div>
  );
}

// ── Rain drops ────────────────────────────────────────────────
function Rain({ intensity }) {
  const drops = useMemo(() => Array.from({ length: Math.min(intensity * 3, 40) }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    d: 0.4 + Math.random() * 0.6,
    delay: Math.random() * 1.5,
    h: 12 + Math.random() * 10,
  })), [intensity]);

  return (
    <div className="wh-rain" aria-hidden="true">
      {drops.map(d => (
        <div key={d.id} className="wh-raindrop" style={{
          left: `${d.x}%`,
          animationDuration: `${d.d}s`,
          animationDelay: `${d.delay}s`,
          height: d.h,
        }} />
      ))}
    </div>
  );
}

// ── Wind lines ────────────────────────────────────────────────
function Wind({ speed }) {
  const lines = useMemo(() => Array.from({ length: Math.min(Math.floor(speed / 1.5), 12) }, (_, i) => ({
    id: i,
    y: 15 + Math.random() * 70,
    w: 30 + Math.random() * 40,
    d: 1.2 + Math.random() * 1.2,
    delay: Math.random() * 2,
    opacity: 0.15 + Math.random() * 0.25,
  })), [speed]);

  return (
    <div className="wh-wind" aria-hidden="true">
      {lines.map(l => (
        <div key={l.id} className="wh-windline" style={{
          top: `${l.y}%`,
          width: `${l.w}%`,
          animationDuration: `${l.d}s`,
          animationDelay: `${l.delay}s`,
          opacity: l.opacity,
        }} />
      ))}
    </div>
  );
}

// ── Animated temperature number ───────────────────────────────
function AnimatedTemp({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current || value === prev.current) return;
    const el = ref.current;
    const start = prev.current;
    const end   = value;
    const dur   = 800;
    const t0    = performance.now();

    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (start + (end - start) * ease).toFixed(1);
      if (p < 1) requestAnimationFrame(tick);
      else { el.textContent = end.toFixed(1); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <span ref={ref}>{value?.toFixed(1)}</span>;
}

// ── Animated wind speed ───────────────────────────────────────
function AnimatedWind({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current || value === prev.current) return;
    const el  = ref.current;
    const start = prev.current;
    const end   = value;
    const dur   = 1000;
    const t0    = performance.now();
    const tick  = (now) => {
      const p    = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (start + (end - start) * ease).toFixed(1);
      if (p < 1) requestAnimationFrame(tick);
      else { el.textContent = end.toFixed(1); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <span ref={ref}>{value?.toFixed(1)}</span>;
}

// ── Wind direction compass ────────────────────────────────────
function WindCompass({ deg, speed }) {
  const { label: wLabel, color: wColor } = useMemo(() => {
    if (!speed && speed !== 0) return { label: '—', color: '#555' };
    if (speed < 0.5)  return { label: 'Calm',         color: '#10b981' };
    if (speed < 3.4)  return { label: 'Light',        color: '#10b981' };
    if (speed < 5.5)  return { label: 'Gentle',       color: '#84cc16' };
    if (speed < 8.0)  return { label: 'Moderate',     color: '#eab308' };
    if (speed < 10.8) return { label: 'Fresh',        color: '#f97316' };
    return                    { label: 'Strong',       color: '#ef4444' };
  }, [speed]);

  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  const dir  = dirs[Math.round(deg / 45) % 8];

  return (
    <div className="wh-compass">
      <svg viewBox="0 0 80 80" className="wh-compass-svg">
        {/* Tick marks */}
        {[0,45,90,135,180,225,270,315].map(a => (
          <line key={a}
            x1="40" y1="8" x2="40" y2={a % 90 === 0 ? 14 : 11}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"
            transform={`rotate(${a} 40 40)`}
          />
        ))}
        {/* Compass ring */}
        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Cardinal letters */}
        {[['N',40,16],['E',64,43],['S',40,68],['W',16,43]].map(([l,x,y]) => (
          <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="rgba(255,255,255,0.3)" fontWeight="600">{l}</text>
        ))}
        {/* Wind arrow */}
        <g transform={`rotate(${deg} 40 40)`}>
          <polygon points="40,14 37,34 40,30 43,34" fill={wColor} opacity="0.9" />
          <polygon points="40,66 37,46 40,50 43,46" fill="rgba(255,255,255,0.2)" />
          <circle cx="40" cy="40" r="3" fill={wColor} />
        </g>
      </svg>
      <div className="wh-compass-label" style={{ color: wColor }}>{dir}</div>
      <div className="wh-compass-desc" style={{ color: wColor }}>{wLabel}</div>
    </div>
  );
}

// ── Main WeatherHero component ────────────────────────────────
export default function WeatherHero({ weather, elevation, sunTimes, isLicensed }) {
  if (!weather) return null;

  const phase     = getDayPhase(sunTimes);
  const condition = getCondition(weather.weathercode || 0);
  const sky       = SKY[phase];
  const isNight   = phase === 'night' || phase === 'dawn' || phase === 'dusk';
  const isRaining = condition === 'rain' || condition === 'shower' || condition === 'storm';
  const windSpeed = weather.windspeed_10m || 0;
  const windDir   = weather.winddirection_10m || 0;
  const temp      = weather.temperature_2m ?? 0;
  const clouds    = weather.cloudcover ?? 0;

  const tempColor = temp > 30 ? '#f97316' : temp > 22 ? '#fbbf24' : temp > 15 ? '#34d399' : temp > 8 ? '#60a5fa' : '#a78bfa';

  const rules = isLicensed ? { maxWind: 14 } : { maxWind: 10 };
  const windSafe = windSpeed <= rules.maxWind;

  return (
    <div
      className={`wh-hero wh-${phase} ${isRaining ? 'wh-raining' : ''}`}
      style={{ '--sky-top': sky.top, '--sky-bot': sky.bot }}
    >
      {/* Sky background */}
      <div className="wh-sky" />

      {/* Stars (night/dawn/dusk) */}
      {sky.star && <Stars count={phase === 'night' ? 80 : 30} />}

      {/* Sun or Moon */}
      <div className="wh-celestial">
        {isNight ? <Moon /> : <Sun />}
      </div>

      {/* Clouds */}
      <Clouds coverage={clouds} condition={condition} />

      {/* Rain */}
      {isRaining && <Rain intensity={Math.ceil(windSpeed)} />}

      {/* Wind lines */}
      {windSpeed > 3 && <Wind speed={windSpeed} />}

      {/* Data overlay */}
      <div className="wh-overlay">

        {/* Temperature hero */}
        <div className="wh-temp-block">
          <div className="wh-temp-main" style={{ color: tempColor }}>
            <AnimatedTemp value={temp} />
            <span className="wh-temp-unit">°C</span>
          </div>
          <div className="wh-temp-feel">
            {condition === 'clear' ? '☀ Clear' :
             condition === 'partly' ? '⛅ Partly cloudy' :
             condition === 'cloudy' ? '☁ Overcast' :
             condition === 'rain' || condition === 'shower' ? '🌧 Rain' :
             condition === 'storm' ? '⛈ Thunderstorm' :
             condition === 'snow' ? '❄ Snow' : '🌤 Fair'}
          </div>
          <div className="wh-phase-badge">
            {phase === 'day'   && '☀ Daytime'}
            {phase === 'night' && '🌙 Nighttime'}
            {phase === 'dawn'  && '🌅 Dawn'}
            {phase === 'dusk'  && '🌇 Dusk'}
          </div>
        </div>

        {/* Wind block */}
        <div className="wh-wind-block">
          <WindCompass deg={windDir} speed={windSpeed} />
          <div className="wh-wind-data">
            <div className="wh-wind-speed" style={{ color: windSafe ? '#10b981' : '#ef4444' }}>
              <AnimatedWind value={windSpeed} />
              <span className="wh-wind-unit"> m/s</span>
            </div>
            {weather.windgusts_10m > 0 && (
              <div className="wh-wind-gusts">
                Gusts: {weather.windgusts_10m?.toFixed(1)} m/s
              </div>
            )}
            <div className={`wh-wind-safe ${windSafe ? 'wh-safe' : 'wh-unsafe'}`}>
              {windSafe ? '✓ Wind OK' : '✗ Too windy'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: quick stats */}
      <div className="wh-stats-bar">
        <div className="wh-stat">
          <span className="wh-stat-icon">💧</span>
          <span className="wh-stat-val">{weather.relative_humidity_2m?.toFixed(0)}%</span>
          <span className="wh-stat-lbl">Humidity</span>
        </div>
        <div className="wh-stat">
          <span className="wh-stat-icon">☁</span>
          <span className="wh-stat-val">{weather.cloudcover?.toFixed(0)}%</span>
          <span className="wh-stat-lbl">Cloud</span>
        </div>
        <div className="wh-stat">
          <span className="wh-stat-icon">👁</span>
          <span className="wh-stat-val">{((weather.visibility ?? 10000)/1000).toFixed(1)} km</span>
          <span className="wh-stat-lbl">Visibility</span>
        </div>
        <div className="wh-stat">
          <span className="wh-stat-icon">⛰</span>
          <span className="wh-stat-val">{elevation?.toFixed(0)} m</span>
          <span className="wh-stat-lbl">Elevation</span>
        </div>
        <div className="wh-stat">
          <span className="wh-stat-icon">🌧</span>
          <span className="wh-stat-val">{weather.precipitation?.toFixed(1)} mm</span>
          <span className="wh-stat-lbl">Rain</span>
        </div>
      </div>
    </div>
  );
}
