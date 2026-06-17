import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PROVINCES } from './costaRicaLocations';
import WeatherHero from './WeatherHero';

const OPEN_METEO  = 'https://api.open-meteo.com/v1/forecast';
const ELEV_API    = 'https://api.open-meteo.com/v1/elevation';
const SUN_API     = 'https://api.sunrise-sunset.org/json';
const NOMINATIM   = 'https://nominatim.openstreetmap.org/reverse';

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
  const rules = isLicensed ? RULES.licensed : RULES.unlicensed;
  const issues = [], tips = [];
  let safe = true;
  if (w.windspeed_10m > rules.maxWind)            { safe = false; issues.push(`Wind ${w.windspeed_10m.toFixed(1)} m/s exceeds ${rules.maxWind} m/s limit`); }
  if ((w.windgusts_10m||0) > rules.maxWind * 1.3) { safe = false; issues.push(`Gusts ${w.windgusts_10m?.toFixed(1)} m/s — risk of control loss`); }
  if (w.precipitation > 0.1)                      { safe = false; issues.push(`Rain ${w.precipitation.toFixed(1)} mm — avoid flying`); }
  if ((w.visibility||10000) < 5000)               { safe = false; issues.push(`Low visibility ${((w.visibility||0)/1000).toFixed(1)} km`); }
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

// ── Copy coordinates button ───────────────────────────────────
function CopyCoords({ coords }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(`${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`dh-copy-btn ${copied ? 'dh-copy-done' : ''}`} onClick={handleCopy} title="Copy coordinates">
      {copied ? '✓' : '⧉'}
    </button>
  );
}

// ── Match GPS reverse geocode result to our CR location data ──
function matchGPSToLocations(address) {
  // Nominatim returns: county = canton, state_district = province-ish, suburb/village = district
  const raw = {
    province: address.state || address.region || '',
    canton:   address.county || address.state_district || '',
    district: address.suburb || address.village || address.town || address.city_district || '',
  };

  // Try to fuzzy-match province
  const matchedProvince = PROVINCES.find(p =>
    raw.province.toLowerCase().includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(raw.province.toLowerCase().split(' ')[0])
  );

  let matchedCanton = null;
  if (matchedProvince) {
    matchedCanton = matchedProvince.cantons.find(c =>
      raw.canton.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(raw.canton.toLowerCase().split(' ')[0])
    );
  }

  let matchedDistrict = null;
  if (matchedCanton) {
    matchedDistrict = matchedCanton.districts.find(d =>
      raw.district.toLowerCase().includes(d.toLowerCase()) ||
      d.toLowerCase().includes(raw.district.toLowerCase().split(' ')[0])
    );
  }

  return { matchedProvince, matchedCanton, matchedDistrict, raw };
}

// ── Location header card (always visible once location set) ───
function LocationHeader({ province, canton, district, isGPS, coords, visible }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible) {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    } else {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-12px) scale(0.98)';
    }
  }, [visible]);

  if (!province && !coords) return null;

  const crumbs = [
    province?.name,
    canton?.name,
    district,
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      className="dh-loc-header"
      style={{ opacity: 0, transform: 'translateY(-12px) scale(0.98)' }}
    >
      {/* Left: pin + breadcrumbs */}
      <div className="dh-loc-left">
        <div className={`dh-loc-pin ${isGPS ? 'dh-loc-pin-gps' : 'dh-loc-pin-manual'}`}>
          {isGPS ? '⊕' : '📍'}
        </div>
        <div className="dh-loc-crumbs">
          <div className="dh-loc-type">{isGPS ? 'GPS Location' : 'Manual Selection'}</div>
          {crumbs.length > 0 ? (
            <div className="dh-loc-path">
              {crumbs.map((c, i) => (
                <span key={i} className="dh-loc-crumb-wrap">
                  {i > 0 && <span className="dh-loc-sep">›</span>}
                  <span className={`dh-loc-crumb ${i === crumbs.length - 1 ? 'dh-loc-crumb-last' : ''}`}>{c}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="dh-loc-path">
              <span className="dh-loc-crumb dh-loc-crumb-last">
                {coords ? `${coords.lat.toFixed(4)}°N, ${Math.abs(coords.lon).toFixed(4)}°W` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: coords + copy button */}
      {coords && (
        <div className="dh-loc-coords">
          <span>{coords.lat.toFixed(4)}°N</span>
          <span>{Math.abs(coords.lon).toFixed(4)}°W</span>
          <CopyCoords coords={coords} />
        </div>
      )}
    </div>
  );
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
  const [isLicensed,  setIsLicensed]  = useState(false);
  const [province,    setProvince]    = useState(null);
  const [canton,      setCanton]      = useState(null);
  const [district,    setDistrict]    = useState(null);
  const [coords,      setCoords]      = useState(null);
  const [isGPS,       setIsGPS]       = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [weather,     setWeather]     = useState(null);
  const [elevation,   setElevation]   = useState(null);
  const [sunTimes,    setSunTimes]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [assessment,  setAssessment]  = useState(null);
  const [visible,     setVisible]     = useState(false);
  const [locVisible,  setLocVisible]  = useState(false);

  const fetchData = useCallback(async (lat, lon) => {
    setLoading(true); setWeather(null); setAssessment(null); setVisible(false);
    try {
      const [wRes, eRes, sRes] = await Promise.all([
        fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,cloudcover,visibility,windspeed_10m,windgusts_10m,winddirection_10m,weathercode&wind_speed_unit=ms&timezone=America/Costa_Rica`),
        fetch(`${ELEV_API}?latitude=${lat}&longitude=${lon}`),
        fetch(`${SUN_API}?lat=${lat}&lng=${lon}&formatted=0`),
      ]);
      const [wData, eData, sData] = await Promise.all([wRes.json(), eRes.json(), sRes.json()]);
      const cur     = wData.current;
      const elev    = eData.elevation?.[0] ?? 0;
      const sunrise = sData.results?.sunrise ? new Date(sData.results.sunrise) : null;
      const sunset  = sData.results?.sunset  ? new Date(sData.results.sunset)  : null;
      setWeather(cur); setElevation(elev); setSunTimes({ sunrise, sunset });
      setAssessment(assess(cur, elev, isLicensed));
      setTimeout(() => setVisible(true), 80);
    } catch {
      alert('Could not fetch weather data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [isLicensed]);

  useEffect(() => { if (coords) fetchData(coords.lat, coords.lon); }, [coords]);
  useEffect(() => { if (weather) setAssessment(assess(weather, elevation, isLicensed)); }, [isLicensed]);

  // Show location header as soon as province or GPS coords are set
  useEffect(() => {
    setLocVisible(!!(province || coords));
  }, [province, coords]);

  const handleProvince = p => {
    setProvince(p); setCanton(null); setDistrict(null);
    setCoords(null); setIsGPS(false);
  };
  const handleCanton = c => {
    setCanton(c); setDistrict(null);
    setCoords({ lat: c.lat, lon: c.lon });
  };
  const handleDistrict = d => setDistrict(d.name);

  const handleGPS = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported in this browser');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        setIsGPS(true);

        // Reverse geocode with Nominatim to get CR subdivision names
        try {
          const res  = await fetch(`${NOMINATIM}?lat=${lat}&lon=${lon}&format=json&accept-language=en`, {
            headers: { 'User-Agent': 'JulianSanchezDroneHelper/1.0' }
          });
          const data = await res.json();
          const addr = data.address || {};
          const { matchedProvince, matchedCanton, matchedDistrict } = matchGPSToLocations(addr);

          if (matchedProvince) setProvince(matchedProvince);
          if (matchedCanton)   setCanton(matchedCanton);
          if (matchedDistrict) setDistrict(matchedDistrict);
        } catch {
          // Geocoding failed — still have coords, just no subdivision names
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        alert('Could not get location. Please select manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const fmt   = d => d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' }) : '--:--';
  const wind  = weather ? windInfo(weather.windspeed_10m) : null;
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

        {/* ── Location header card (always shown once set) ── */}
        <LocationHeader
          province={province}
          canton={canton}
          district={district}
          isGPS={isGPS}
          coords={coords}
          visible={locVisible}
        />

        {/* Location picker */}
        <section className="dh-section">
          <h2 className="dh-section-title">📍 Location</h2>
          <button className={`dh-gps-btn ${gpsLoading ? 'dh-gps-loading' : ''} ${isGPS ? 'dh-gps-active' : ''}`} onClick={handleGPS} disabled={gpsLoading}>
            <span>{gpsLoading ? '⟳' : '⊕'}</span>
            <span>{gpsLoading ? 'Getting GPS location…' : isGPS ? 'GPS active — click to refresh' : 'Use my GPS location'}</span>
          </button>
          <div className="dh-or">— or select manually —</div>

          {!isGPS && (
            <>
              <PickerRow label="Province" options={PROVINCES} selected={province} onSelect={handleProvince} />
              {province && (
                <PickerRow label="Canton" options={province.cantons} selected={canton} onSelect={handleCanton} />
              )}
              {canton && (
                <PickerRow
                  label="District"
                  options={canton.districts.map(d => ({ id: d, name: d }))}
                  selected={district ? { id: district, name: district } : null}
                  onSelect={handleDistrict}
                />
              )}
            </>
          )}

          {isGPS && (
            <button className="dh-gps-reset" onClick={() => { setIsGPS(false); setProvince(null); setCanton(null); setDistrict(null); setCoords(null); setWeather(null); }}>
              ✕ Clear GPS — select manually instead
            </button>
          )}
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
          <div className={`dh-results ${visible ? 'dh-results-visible' : ''}`}>

            {assessment && <SafetyBanner safe={assessment.safe} issues={assessment.issues} />}

            {/* ── Weather Hero ── */}
            <WeatherHero
              weather={weather}
              elevation={elevation}
              sunTimes={sunTimes}
              isLicensed={isLicensed}
            />

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

            <p className="dh-source">Weather & elevation: Open-Meteo · Sun times: sunrise-sunset.org · Geocoding: OpenStreetMap · Regulations: DGAC Costa Rica</p>
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
