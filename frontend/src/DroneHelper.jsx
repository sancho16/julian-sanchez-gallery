import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PROVINCES } from './costaRicaLocations';

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const ELEV_API   = 'https://api.open-meteo.com/v1/elevation';
const SUN_API    = 'https://api.sunrise-sunset.org/json';

const RULES = {
  unlicensed: { maxAlt: 122, maxWind: 10, label: 'Recreational / Non-Licensed' },
  licensed:   { maxAlt: 152, maxWind: 14, label: 'Licensed Pilot (RPAS)' },
};

function windInfo(ms) {
  if (ms < 0.5)  return { label: 'Calm',         color: '#10b981' };
  if (ms < 3.4)  return { label: 'Light breeze', color: '#10b981' };
  if (ms < 5.5)  return { label: 'Gentle',       color: '#84cc16' };
  if (ms < 8.0)  return { label: 'Moderate',     color: '#eab308' };
  if (ms < 10.8) return { label: 'Fresh',        color: '#f97316' };
  return           { label: 'Strong — CAUTION',  color: '#ef4444' };
}

function assess(w, elev, isLicensed) {
  const rules  = isLicensed ? RULES.licensed : RULES.unlicensed;
  const issues = [], tips = [];
  let safe = true;
  if (w.windspeed_10m > rules.maxWind)       { safe = false; issues.push(`Wind ${w.windspeed_10m.toFixed(1)} m/s exceeds ${rules.maxWind} m/s limit`); }
  if ((w.windgusts_10m||0) > rules.maxWind * 1.3) { safe = false; issues.push(`Gusts ${w.windgusts_10m?.toFixed(1)} m/s — risk of control loss`); }
  if (w.precipitation > 0.1)                { safe = false; issues.push(`Rain ${w.precipitation.toFixed(1)} mm — avoid flying`); }
  if ((w.visibility||10000) < 5000)         { safe = false; issues.push(`Low visibility ${((w.visibility||0)/1000).toFixed(1)} km`); }
  if (elev > 2500) tips.push('High altitude — expect 15-20% more battery drain');
  if (w.cloudcover > 80) tips.push('Overcast sky — great for even, shadow-free footage');
  if (w.windspeed_10m > 5 && w.windspeed_10m <= rules.maxWind) tips.push('Moderate wind — set RTH altitude above all obstacles');
  if (!isLicensed) {
    tips.push('Stay below 122m (400ft) AGL and within line of sight');
    tips.push('Avoid airports, national parks, and populated areas');
    tips.push('Register drone with DGAC if weight exceeds 250g');
  }
  return { safe, issues, tips };
}

function InfoCard({ icon, label, value, unit, color = '#0ea5e9', sub }) {
  return (
    <div className="dh-card" style={{ '--dh-color': color }}>
      <div className="dh-card-icon">{icon}</div>
      <div className="dh-card-label">{label}</div>
      <div className="dh-card-value" style={{ color }}>{value}<span className="dh-card-unit"> {unit}</span></div>
      {sub && <div className="dh-card-sub">{sub}</div>}
    </div>
  );
}

function SafetyBanner({ safe, issues }) {
  const color = safe ? '#10b981' : '#ef4444';
  return (
    <div className={`dh-banner ${safe ? 'dh-banner-safe' : 'dh-banner-warn'}`}>
      <span className="dh-banner-icon">{safe ? '✓' : '⚠'}</span>
      <div>
        <div className="dh-banner-title" style={{ color }}>{safe ? 'SAFE TO FLY' : 'NOT RECOMMENDED'}</div>
        {issues.map((iss, i) => <div key={i} className="dh-banner-issue">• {iss}</div>)}
      </div>
    </div>
  );
}

function PickerRow({ label, options, selected, onSelect }) {
  return (
    <div className="dh-picker">
      <div className="dh-picker-label">{label}</div>
      <div className="dh-picker-pills">
        {options.map(opt => (
          <button
            key={opt.id}
            className={`dh-pill ${selected?.id === opt.id ? 'dh-pill-active' : ''}`}
            onClick={() => onSelect(opt)}
          >{opt.name}</button>
        ))}
      </div>
    </div>
  );
}

export default function DroneHelper() {
  const [isLicensed,   setIsLicensed]   = useState(false);
  const [province,     setProvince]     = useState(null);
  const [canton,       setCanton]       = useState(null);
  const [district,     setDistrict]     = useState(null);
  const [coords,       setCoords]       = useState(null);
  const [locationName, setLocationName] = useState('');
  const [weather,      setWeather]      = useState(null);
  const [elevation,    setElevation]    = useState(null);
  const [sunTimes,     setSunTimes]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [assessment,   setAssessment]   = useState(null);
  const [visible,      setVisible]      = useState(false);
  const resultsRef = useRef(null);

  const fetchData = useCallback(async (lat, lon) => {
    setLoading(true); setWeather(null); setAssessment(null); setVisible(false);
    try {
      const [wRes, eRes, sRes] = await Promise.all([
        fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,cloudcover,visibility,windspeed_10m,windgusts_10m,winddirection_10m,weathercode&wind_speed_unit=ms&timezone=America/Costa_Rica`),
        fetch(`${ELEV_API}?latitude=${lat}&longitude=${lon}`),
        fetch(`${SUN_API}?lat=${lat}&lng=${lon}&formatted=0`),
      ]);
      const [wData, eData, sData] = await Promise.all([wRes.json(), eRes.json(), sRes.json()]);
      const cur  = wData.current;
      const elev = eData.elevation?.[0] ?? 0;
      const sunrise = sData.results?.sunrise ? new Date(sData.results.sunrise) : null;
      const sunset  = sData.results?.sunset  ? new Date(sData.results.sunset)  : null;
      setWeather(cur); setElevation(elev); setSunTimes({ sunrise, sunset });
      setAssessment(assess(cur, elev, isLicensed));
      setTimeout(() => setVisible(true), 60);
    } catch {
      alert('Could not fetch weather data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [isLicensed]);

  useEffect(() => { if (coords) fetchData(coords.lat, coords.lon); }, [coords]);
  useEffect(() => { if (weather) setAssessment(assess(weather, elevation, isLicensed)); }, [isLicensed]);

  const handleProvince = p => { setProvince(p); setCanton(null); setDistrict(null); setCoords(null); };
  const handleCanton   = c => { setCanton(c); setDistrict(null); setCoords({ lat: c.lat, lon: c.lon }); setLocationName(`${c.name}, ${province.name}`); };
  const handleDistrict = d => { setDistrict(d); setLocationName(`${d.name}, ${canton.name}, ${province.name}`); };
  const handleGPS      = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocationName('Current GPS location'); },
      ()  => alert('Could not get location. Please select manually.')
    );
  };

  const fmt = d => d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' }) : '--:--';
  const wind = weather ? windInfo(weather.windspeed_10m) : null;
  const rules = isLicensed ? RULES.licensed : RULES.unlicensed;

  return (
    <div className="dh-wrapper">
      <div className="dh-inner">

        {/* Page header */}
        <div className="dh-header">
          <div>
            <h1 className="dh-title">Drone Helper <span className="dh-title-cr">CR</span></h1>
            <p className="dh-subtitle">Costa Rica flight planner — real-time conditions & regulations</p>
          </div>
          {/* License toggle */}
          <button
            className={`dh-license-btn ${isLicensed ? 'dh-license-pro' : ''}`}
            onClick={() => setIsLicensed(p => !p)}
          >
            <span>{isLicensed ? '🎖' : '👤'}</span>
            <span>{isLicensed ? 'PRO' : 'REC'}</span>
          </button>
        </div>

        {/* Mode banner */}
        <div className={`dh-mode-banner ${isLicensed ? 'dh-mode-pro' : 'dh-mode-rec'}`}>
          {isLicensed ? '🎖 Licensed Pilot Mode — RPAS regulations apply' : '👤 Recreational Mode — DGAC non-licensed rules apply'}
        </div>

        {/* Location */}
        <section className="dh-section">
          <h2 className="dh-section-title">📍 Location</h2>
          <button className="dh-gps-btn" onClick={handleGPS}>
            <span>⊕</span> Use my GPS location
          </button>
          <div className="dh-or">— or select manually —</div>

          <PickerRow label="Province" options={PROVINCES} selected={province} onSelect={handleProvince} />
          {province && <PickerRow label="Canton" options={province.cantons} selected={canton} onSelect={handleCanton} />}
          {canton   && <PickerRow label="District" options={canton.districts.map(d => ({ id: d, name: d }))} selected={district ? { id: district.name, name: district.name } : null} onSelect={handleDistrict} />}
        </section>

        {/* Loading */}
        {loading && (
          <div className="dh-loading">
            <div className="dh-spinner" />
            <span>Fetching flight data…</span>
          </div>
        )}

        {/* Results */}
        {weather && !loading && (
          <div className={`dh-results ${visible ? 'dh-results-visible' : ''}`} ref={resultsRef}>
            {locationName && <div className="dh-location-name">📍 {locationName}</div>}
            {assessment   && <SafetyBanner safe={assessment.safe} issues={assessment.issues} />}

            <section className="dh-section">
              <h2 className="dh-section-title">💨 Wind</h2>
              <div className="dh-grid">
                <InfoCard icon="💨" label="Speed"     value={weather.windspeed_10m?.toFixed(1)}                  unit="m/s" color={wind?.color} sub={wind?.label} />
                <InfoCard icon="⬆" label="Gusts"     value={(weather.windgusts_10m ?? weather.windspeed_10m)?.toFixed(1)} unit="m/s" color={windInfo(weather.windgusts_10m ?? 0).color} />
                <InfoCard icon="🧭" label="Direction" value={weather.winddirection_10m?.toFixed(0)}               unit="°"   color="#818cf8" />
              </div>
            </section>

            <section className="dh-section">
              <h2 className="dh-section-title">🌡️ Atmosphere</h2>
              <div className="dh-grid">
                <InfoCard icon="🌡" label="Temp"       value={weather.temperature_2m?.toFixed(1)}       unit="°C" color="#f97316" />
                <InfoCard icon="💧" label="Humidity"   value={weather.relative_humidity_2m?.toFixed(0)} unit="%"  color="#0ea5e9" />
                <InfoCard icon="🌧" label="Rain"       value={weather.precipitation?.toFixed(1)}        unit="mm" color="#60a5fa" />
                <InfoCard icon="☁" label="Cloud"      value={weather.cloudcover?.toFixed(0)}           unit="%"  color="#94a3b8" />
                <InfoCard icon="👁" label="Visibility" value={((weather.visibility ?? 10000)/1000).toFixed(1)} unit="km" color="#a78bfa" />
              </div>
            </section>

            <section className="dh-section">
              <h2 className="dh-section-title">⛰️ Terrain</h2>
              <div className="dh-grid">
                <InfoCard icon="📏" label="Elevation" value={elevation?.toFixed(0)} unit="m" color="#10b981"
                  sub={elevation > 2000 ? 'Mountain — reduced lift' : elevation > 1000 ? 'Highland' : 'Lowland'} />
                <InfoCard icon="🔝" label="Max Altitude" value={rules.maxAlt} unit="m" color="#f59e0b"
                  sub={`${isLicensed ? '500' : '400'} ft AGL limit`} />
              </div>
            </section>

            {sunTimes?.sunrise && (
              <section className="dh-section">
                <h2 className="dh-section-title">☀️ Daylight (Costa Rica)</h2>
                <div className="dh-grid">
                  <InfoCard icon="🌅" label="Sunrise" value={fmt(sunTimes.sunrise)} unit="" color="#f59e0b" />
                  <InfoCard icon="🌇" label="Sunset"  value={fmt(sunTimes.sunset)}  unit="" color="#f97316" />
                </div>
                {!isLicensed && <p className="dh-rule-note">⚠️ Recreational pilots must fly during daylight hours only</p>}
              </section>
            )}

            {assessment?.tips?.length > 0 && (
              <section className="dh-section">
                <h2 className="dh-section-title">💡 Flight Tips</h2>
                <div className="dh-tips">
                  {assessment.tips.map((t, i) => <div key={i} className="dh-tip">💡 {t}</div>)}
                </div>
              </section>
            )}

            <section className="dh-section">
              <h2 className="dh-section-title">📋 Costa Rica Regulations</h2>
              <div className="dh-reg-table">
                {[
                  ['Max altitude',  `${isLicensed ? '152m (500ft)' : '122m (400ft)'} AGL`],
                  ['Max wind',      `${rules.maxWind} m/s`],
                  ['Night flying',  isLicensed ? 'Permitted with authorization' : 'Not permitted'],
                  ['Visual LoS',    'Required at all times'],
                  ['Registration',  'Required for drones over 250g (DGAC)'],
                  ['No-fly zones',  'Airports, national parks, govt buildings'],
                ].map(([k, v]) => (
                  <div key={k} className="dh-reg-row">
                    <span className="dh-reg-key">{k}</span>
                    <span className="dh-reg-val">{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <p className="dh-source">Weather & elevation: Open-Meteo · Sun times: sunrise-sunset.org · Regulations: DGAC Costa Rica</p>
          </div>
        )}

        {!weather && !loading && (
          <div className="dh-empty">
            <div className="dh-empty-icon">✈</div>
            <p>Select a location or use GPS<br />to get real-time flight conditions</p>
          </div>
        )}
      </div>
    </div>
  );
}
