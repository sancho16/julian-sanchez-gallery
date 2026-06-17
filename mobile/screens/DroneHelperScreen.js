import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Platform, StatusBar, ActivityIndicator, Alert, Clipboard, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PROVINCES } from '../data/costaRicaLocations';
import { useSettings, THEMES } from '../context/SettingsContext';

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const ELEV_API   = 'https://api.open-meteo.com/v1/elevation';
const SUN_API    = 'https://api.sunrise-sunset.org/json';

const RULES = {
  unlicensed: { maxAltitude: 122, maxWindSpeed: 10, label: 'Recreational' },
  licensed:   { maxAltitude: 152, maxWindSpeed: 14, label: 'Licensed RPAS' },
};

function windDescription(ms) {
  if (ms < 0.5)  return { label: 'Calm',         safe: true,  color: '#10b981' };
  if (ms < 1.6)  return { label: 'Light air',    safe: true,  color: '#10b981' };
  if (ms < 3.4)  return { label: 'Light breeze', safe: true,  color: '#10b981' };
  if (ms < 5.5)  return { label: 'Gentle',       safe: true,  color: '#84cc16' };
  if (ms < 8.0)  return { label: 'Moderate',     safe: true,  color: '#eab308' };
  if (ms < 10.8) return { label: 'Fresh',        safe: false, color: '#f97316' };
  if (ms < 13.9) return { label: 'Strong',       safe: false, color: '#ef4444' };
  return           { label: 'Very strong',        safe: false, color: '#dc2626' };
}

function assessFlight(weather, elevation, sunTimes, isLicensed) {
  const rules = isLicensed ? RULES.licensed : RULES.unlicensed;
  const issues = [], tips = [];
  let safe = true;
  const wind = weather.windspeed_10m, gust = weather.windgusts_10m || wind;
  if (wind > rules.maxWindSpeed)       { safe = false; issues.push(`Wind ${wind.toFixed(1)} m/s exceeds ${rules.maxWindSpeed} m/s`); }
  if (gust > rules.maxWindSpeed * 1.3) { safe = false; issues.push(`Gusts ${gust.toFixed(1)} m/s — control risk`); }
  if ((weather.precipitation||0) > 0.1){ safe = false; issues.push(`Rain ${weather.precipitation?.toFixed(1)} mm`); }
  if ((weather.visibility||10000) < 5000){ safe = false; issues.push(`Low visibility ${((weather.visibility||0)/1000).toFixed(1)} km`); }
  if (elevation > 2500) tips.push('High altitude — 15-20% more battery drain');
  if ((weather.cloudcover||0) > 80) tips.push('Overcast — great for even footage lighting');
  if (wind > 5 && wind <= rules.maxWindSpeed) tips.push('Moderate wind — raise RTH altitude above obstacles');
  if (!isLicensed) {
    tips.push('Stay below 122m (400ft) AGL, within line of sight');
    tips.push('Avoid airports, national parks, populated areas');
  }
  return { safe, issues, tips };
}

// ── Location Header ───────────────────────────────────────────
function LocationHeader({ province, canton, district, isGPS, coords, T, onCopy }) {
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 9, useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [province, coords]);

  const crumbs = [province?.name, canton?.name, district].filter(Boolean);

  const handleCopy = () => {
    if (!coords) return;
    const text = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Animated.View style={{ opacity: opacAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[lh.card, { backgroundColor: T.glass, borderColor: T.glassBorder }]}>
        {/* Shimmer top border */}
        <LinearGradient
          colors={['transparent', isGPS ? '#10b98180' : '#0ea5e980', 'transparent']}
          style={lh.shimmerLine}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />

        <View style={lh.inner}>
          {/* Pin icon */}
          <View style={[lh.pin, { backgroundColor: isGPS ? '#10b98120' : '#0ea5e920',
            borderColor: isGPS ? '#10b98140' : '#0ea5e940' }]}>
            <Ionicons name={isGPS ? 'locate' : 'location'} size={20}
              color={isGPS ? '#10b981' : '#0ea5e9'} />
          </View>

          {/* Breadcrumbs */}
          <View style={lh.crumbs}>
            <Text style={[lh.typeLabel, { color: T.textMuted }]}>
              {isGPS ? 'GPS Location' : 'Manual Selection'}
            </Text>
            {crumbs.length > 0 ? (
              <View style={lh.pathRow}>
                {crumbs.map((c, i) => (
                  <View key={i} style={lh.crumbWrap}>
                    {i > 0 && <Text style={[lh.sep, { color: T.textSub }]}> › </Text>}
                    <Text style={[lh.crumb, { color: i === crumbs.length - 1 ? T.text : T.textMuted },
                      i === crumbs.length - 1 && lh.crumbLast]} numberOfLines={1}>
                      {c}
                    </Text>
                  </View>
                ))}
              </View>
            ) : coords ? (
              <Text style={[lh.crumbLast, { color: T.text }]}>
                {coords.lat.toFixed(4)}°N, {Math.abs(coords.lon).toFixed(4)}°W
              </Text>
            ) : null}
          </View>

          {/* Coords + copy + open in maps */}
          {coords && (
            <View style={lh.right}>
              <Text style={[lh.coordLine, { color: T.textMuted }]}>{coords.lat.toFixed(4)}°N</Text>
              <Text style={[lh.coordLine, { color: T.textMuted }]}>{Math.abs(coords.lon).toFixed(4)}°W</Text>
              <View style={lh.actions}>
                <TouchableOpacity
                  style={[lh.actionBtn, { backgroundColor: copied ? '#10b98120' : T.surface, borderColor: copied ? '#10b98150' : T.border }]}
                  onPress={() => { Clipboard.setString(`${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={copied ? '#10b981' : T.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[lh.actionBtn, { backgroundColor: T.surface, borderColor: T.border }]}
                  onPress={() => {
                    const label = [province?.name, canton?.name].filter(Boolean).join(', ') || 'Location';
                    const url = Platform.OS === 'ios'
                      ? `maps:?q=${label}&ll=${coords.lat},${coords.lon}`
                      : `geo:${coords.lat},${coords.lon}?q=${coords.lat},${coords.lon}(${label})`;
                    Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${coords.lat},${coords.lon}`));
                  }}
                >
                  <Ionicons name="map-outline" size={13} color={T.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function InfoCard({ icon, label, value, unit, color = '#0ea5e9', sublabel, T }) {
  return (
    <View style={[ds.infoCard, { borderColor: color + '30', backgroundColor: T.glass }]}>
      <View style={[ds.infoIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[ds.infoLabel, { color: T.textMuted }]}>{label}</Text>
      <Text style={[ds.infoValue, { color }]}>{value}<Text style={ds.infoUnit}> {unit}</Text></Text>
      {sublabel ? <Text style={[ds.infoSub, { color: T.textMuted }]}>{sublabel}</Text> : null}
    </View>
  );
}

function SafetyBadge({ safe, issues, T }) {
  const color = safe ? '#10b981' : '#ef4444';
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!safe) Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
  }, [safe]);
  return (
    <Animated.View style={[ds.badge, { borderColor: color + '50', transform: [{ scale: pulse }] }]}>
      <LinearGradient colors={[color + '25', color + '08']} style={ds.badgeGrad}>
        <Ionicons name={safe ? 'checkmark-circle' : 'warning'} size={28} color={color} />
        <Text style={[ds.badgeLabel, { color }]}>{safe ? 'SAFE TO FLY' : 'NOT RECOMMENDED'}</Text>
        {issues.map((issue, i) => (
          <View key={i} style={ds.issueRow}>
            <Ionicons name="alert-circle" size={12} color={color} />
            <Text style={[ds.issueText, { color }]}>{issue}</Text>
          </View>
        ))}
      </LinearGradient>
    </Animated.View>
  );
}

function PickerRow({ label, options, selected, onSelect, T }) {
  return (
    <View style={ds.pickerSection}>
      <Text style={[ds.pickerLabel, { color: T.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map(opt => (
          <TouchableOpacity key={opt.id} onPress={() => onSelect(opt)}
            style={[ds.pill, { borderColor: T.pillBorder, backgroundColor: T.pill },
              selected?.id === opt.id && ds.pillActive]}>
            <Text style={[ds.pillText, { color: T.textMuted },
              selected?.id === opt.id && ds.pillTextActive]} numberOfLines={1}>
              {opt.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function DroneHelperScreen({ navigation }) {
  const { theme } = useSettings();
  const T = THEMES[theme];
  const isDark = theme === 'dark';

  const [isLicensed, setIsLicensed] = useState(false);
  const [useGPS,     setUseGPS]     = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [province,   setProvince]   = useState(null);
  const [canton,     setCanton]     = useState(null);
  const [district,   setDistrict]   = useState(null);
  const [coords,     setCoords]     = useState(null);
  const [weather,    setWeather]    = useState(null);
  const [elevation,  setElevation]  = useState(null);
  const [sunTimes,   setSunTimes]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [assessment, setAssessment] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async (lat, lon) => {
    setLoading(true); setWeather(null); setAssessment(null);
    fadeAnim.setValue(0);
    try {
      const [wRes, eRes, sRes] = await Promise.all([
        fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,cloudcover,visibility,windspeed_10m,windgusts_10m,winddirection_10m,weathercode&wind_speed_unit=ms&timezone=America/Costa_Rica`),
        fetch(`${ELEV_API}?latitude=${lat}&longitude=${lon}`),
        fetch(`${SUN_API}?lat=${lat}&lng=${lon}&formatted=0`),
      ]);
      const [wData, eData, sData] = await Promise.all([wRes.json(), eRes.json(), sRes.json()]);
      const cur = wData.current;
      const elev = eData.elevation?.[0] ?? 0;
      const sunrise = sData.results?.sunrise ? new Date(sData.results.sunrise) : null;
      const sunset  = sData.results?.sunset  ? new Date(sData.results.sunset)  : null;
      const weatherObj = {
        temperature_2m: cur.temperature_2m, relative_humidity_2m: cur.relative_humidity_2m,
        precipitation: cur.precipitation, cloudcover: cur.cloudcover, visibility: cur.visibility,
        windspeed_10m: cur.windspeed_10m, windgusts_10m: cur.windgusts_10m,
        winddirection_10m: cur.winddirection_10m, weathercode: cur.weathercode,
      };
      setWeather(weatherObj); setElevation(elev); setSunTimes({ sunrise, sunset });
      setAssessment(assessFlight(weatherObj, elev, { sunrise, sunset }, isLicensed));
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch {
      Alert.alert('Error', 'Could not fetch weather data. Check your connection.');
    } finally { setLoading(false); }
  }, [isLicensed]);

  useEffect(() => { if (coords) fetchData(coords.lat, coords.lon); }, [coords]);
  useEffect(() => {
    if (weather && elevation !== null) setAssessment(assessFlight(weather, elevation, sunTimes, isLicensed));
  }, [isLicensed]);

  // Reverse geocode to match CR locations
  const matchToLocations = (address) => {
    const raw = { province: address.region || address.state || '', canton: address.subregion || address.county || '' };
    const mp = PROVINCES.find(p => raw.province.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(raw.province.split(' ')[0].toLowerCase()));
    const mc = mp?.cantons.find(c => raw.canton.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(raw.canton.split(' ')[0].toLowerCase()));
    return { mp, mc };
  };

  const getGPSLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission denied', 'Enable location in Settings.'); return; }
    setGpsLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude, lon = loc.coords.longitude;
      setCoords({ lat, lon }); setUseGPS(true);
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geo[0]) {
        const { mp, mc } = matchToLocations(geo[0]);
        if (mp) setProvince(mp);
        if (mc) setCanton(mc);
      }
    } catch { Alert.alert('GPS Error', 'Could not get location.'); }
    finally { setGpsLoading(false); }
  };

  const clearGPS = () => { setUseGPS(false); setProvince(null); setCanton(null); setDistrict(null); setCoords(null); setWeather(null); };
  const handleProvince = p => { setProvince(p); setCanton(null); setDistrict(null); setCoords(null); setUseGPS(false); };
  const handleCanton   = c => { setCanton(c); setDistrict(null); setCoords({ lat: c.lat, lon: c.lon }); };
  const handleDistrict = d => setDistrict(d.name);
  const fmt = d => d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' }) : '--:--';
  const wind = weather ? windDescription(weather.windspeed_10m) : null;
  const rules = isLicensed ? RULES.licensed : RULES.unlicensed;
  const showHeader = !!(province || coords);

  return (
    <View style={[ds.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark ? ['#050510', '#0a0a1a', '#050510'] : ['#dbeafe', '#f0f9ff', '#dbeafe']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header bar */}
      <View style={[ds.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ds.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>
        <View style={ds.headerCenter}>
          <Text style={[ds.headerTitle, { color: T.text }]}>Drone Helper CR</Text>
          <Text style={[ds.headerSub, { color: T.textMuted }]}>Costa Rica Flight Planner</Text>
        </View>
        <TouchableOpacity style={[ds.licenseBtn, { borderColor: T.border },
          isLicensed && ds.licenseBtnActive]} onPress={() => setIsLicensed(p => !p)}>
          <Ionicons name={isLicensed ? 'ribbon' : 'person'} size={14} color={isLicensed ? '#f59e0b' : T.textMuted} />
          <Text style={[ds.licenseBtnText, { color: T.textMuted }, isLicensed && { color: '#f59e0b' }]}>
            {isLicensed ? 'PRO' : 'REC'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ds.scroll}>

        {/* Mode banner */}
        <View style={[ds.modeBanner, { borderColor: isLicensed ? '#f59e0b40' : '#0ea5e940',
          backgroundColor: T.surface }]}>
          <Ionicons name={isLicensed ? 'ribbon' : 'person-circle'} size={16} color={isLicensed ? '#f59e0b' : '#0ea5e9'} />
          <Text style={[ds.modeText, { color: isLicensed ? '#f59e0b' : '#0ea5e9' }]}>
            {isLicensed ? 'Licensed Pilot Mode — RPAS regulations apply' : 'Recreational Mode — DGAC non-licensed rules apply'}
          </Text>
        </View>

        {/* Location header card */}
        {showHeader && <LocationHeader province={province} canton={canton} district={district} isGPS={useGPS} coords={coords} T={T} />}

        {/* Location section */}
        <View style={ds.section}>
          <Text style={[ds.sectionTitle, { color: T.text }]}>📍 Location</Text>

          {/* GPS button */}
          <TouchableOpacity style={[ds.gpsBtn, { borderColor: T.border, backgroundColor: T.surface },
            useGPS && ds.gpsBtnActive]} onPress={getGPSLocation} disabled={gpsLoading}>
            <Ionicons name="locate" size={18} color={useGPS ? '#10b981' : T.textMuted} />
            <Text style={[ds.gpsBtnText, { color: T.textMuted }, useGPS && { color: '#10b981' }]}>
              {gpsLoading ? 'Getting location…' : useGPS ? 'GPS active — tap to refresh' : 'Use GPS Location'}
            </Text>
          </TouchableOpacity>

          {/* GPS reset */}
          {useGPS && (
            <TouchableOpacity style={[ds.resetBtn, { borderColor: T.border }]} onPress={clearGPS}>
              <Ionicons name="close-circle-outline" size={14} color={T.textMuted} />
              <Text style={[ds.resetText, { color: T.textMuted }]}>Clear GPS — select manually</Text>
            </TouchableOpacity>
          )}

          {/* Manual pickers — hidden when GPS active */}
          {!useGPS && (
            <>
              <Text style={[ds.orText, { color: T.textSub }]}>— or select manually —</Text>
              <PickerRow label="Province" options={PROVINCES} selected={province} onSelect={handleProvince} T={T} />
              {province && <PickerRow label="Canton" options={province.cantons} selected={canton} onSelect={handleCanton} T={T} />}
              {canton && <PickerRow label="District" options={canton.districts.map(d => ({ id: d, name: d }))} selected={district ? { id: district, name: district } : null} onSelect={handleDistrict} T={T} />}
            </>
          )}
        </View>

        {loading && (
          <View style={ds.loadingWrap}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={[ds.loadingText, { color: T.textMuted }]}>Fetching flight data…</Text>
          </View>
        )}

        {weather && !loading && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {assessment && <SafetyBadge safe={assessment.safe} issues={assessment.issues} T={T} />}

            <View style={ds.section}>
              <Text style={[ds.sectionTitle, { color: T.text }]}>💨 Wind</Text>
              <View style={ds.infoGrid}>
                <InfoCard icon="speedometer" label="Speed" value={weather.windspeed_10m?.toFixed(1)} unit="m/s" color={wind?.color} sublabel={wind?.label} T={T} />
                <InfoCard icon="arrow-up-circle" label="Gusts" value={(weather.windgusts_10m ?? weather.windspeed_10m)?.toFixed(1)} unit="m/s" color={windDescription(weather.windgusts_10m ?? 0).color} T={T} />
                <InfoCard icon="compass" label="Direction" value={weather.winddirection_10m?.toFixed(0)} unit="°" color="#818cf8" T={T} />
              </View>
            </View>

            <View style={ds.section}>
              <Text style={[ds.sectionTitle, { color: T.text }]}>🌡️ Atmosphere</Text>
              <View style={ds.infoGrid}>
                <InfoCard icon="thermometer" label="Temp" value={weather.temperature_2m?.toFixed(1)} unit="°C" color="#f97316" T={T} />
                <InfoCard icon="water" label="Humidity" value={weather.relative_humidity_2m?.toFixed(0)} unit="%" color="#0ea5e9" T={T} />
                <InfoCard icon="rainy" label="Rain" value={weather.precipitation?.toFixed(1)} unit="mm" color="#60a5fa" T={T} />
                <InfoCard icon="partly-sunny" label="Cloud" value={weather.cloudcover?.toFixed(0)} unit="%" color="#94a3b8" T={T} />
                <InfoCard icon="eye" label="Visibility" value={((weather.visibility ?? 10000)/1000).toFixed(1)} unit="km" color="#a78bfa" T={T} />
              </View>
            </View>

            <View style={ds.section}>
              <Text style={[ds.sectionTitle, { color: T.text }]}>⛰️ Terrain</Text>
              <View style={ds.infoGrid}>
                <InfoCard icon="trending-up" label="Elevation" value={elevation?.toFixed(0)} unit="m" color="#10b981" sublabel={elevation > 2000 ? 'Mountain' : elevation > 1000 ? 'Highland' : 'Lowland'} T={T} />
                <InfoCard icon="layers" label="Max Alt AGL" value={isLicensed ? '152' : '122'} unit="m" color="#f59e0b" sublabel={`${isLicensed ? '500' : '400'} ft limit`} T={T} />
              </View>
            </View>

            {sunTimes?.sunrise && (
              <View style={ds.section}>
                <Text style={[ds.sectionTitle, { color: T.text }]}>☀️ Daylight</Text>
                <View style={ds.infoGrid}>
                  <InfoCard icon="sunny" label="Sunrise" value={fmt(sunTimes.sunrise)} unit="" color="#f59e0b" T={T} />
                  <InfoCard icon="moon" label="Sunset" value={fmt(sunTimes.sunset)} unit="" color="#f97316" T={T} />
                </View>
                {!isLicensed && <Text style={ds.ruleNote}>⚠️ Recreational pilots must fly during daylight only</Text>}
              </View>
            )}

            {assessment?.tips?.length > 0 && (
              <View style={ds.section}>
                <Text style={[ds.sectionTitle, { color: T.text }]}>💡 Tips</Text>
                {assessment.tips.map((tip, i) => (
                  <View key={i} style={[ds.tipRow, { backgroundColor: T.surface, borderLeftColor: '#f59e0b' }]}>
                    <Ionicons name="bulb" size={14} color="#f59e0b" />
                    <Text style={[ds.tipText, { color: T.textMuted }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={ds.section}>
              <Text style={[ds.sectionTitle, { color: T.text }]}>📋 Regulations</Text>
              <View style={[ds.regBox, { borderColor: isLicensed ? '#f59e0b30' : '#0ea5e930', backgroundColor: T.glass }]}>
                {[['Max altitude', `${isLicensed ? '152m (500ft)' : '122m (400ft)'} AGL`], ['Max wind', `${rules.maxWindSpeed} m/s`], ['Night flying', isLicensed ? 'Permitted with auth.' : 'Not permitted'], ['Visual LoS', 'Required always'], ['Registration', '>250g requires DGAC'], ['No-fly zones', 'Airports, parks, govt']].map(([k, v]) => (
                  <View key={k} style={[ds.regRow, { borderBottomColor: T.border }]}>
                    <Text style={[ds.regKey, { color: T.textMuted }]}>{k}</Text>
                    <Text style={[ds.regVal, { color: T.text }]}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={[ds.dataSource, { color: T.textSub }]}>Weather: Open-Meteo · Elevation: Open-Meteo · Sun: sunrise-sunset.org</Text>
          </Animated.View>
        )}

        {!weather && !loading && (
          <View style={ds.emptyState}>
            <Ionicons name="airplane" size={48} color={T.textSub} />
            <Text style={[ds.emptyText, { color: T.textSub }]}>Select a location or use GPS{'\n'}to get flight conditions</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Location Header Styles ────────────────────────────────────
const lh = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  shimmerLine: { height: 1, position: 'absolute', top: 0, left: 0, right: 0 },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  pin: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0,
  },
  crumbs:   { flex: 1, gap: 3 },
  typeLabel:{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  pathRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  crumbWrap:{ flexDirection: 'row', alignItems: 'center' },
  sep:      { fontSize: 12 },
  crumb:    { fontSize: 13 },
  crumbLast:{ fontSize: 15, fontWeight: '700' },
  right:    { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  coordLine:{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  actions:  { flexDirection: 'row', gap: 5, marginTop: 4 },
  actionBtn:{
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  copyBtn:  {
    marginTop: 4, width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
});

// ── Main Styles ───────────────────────────────────────────────
const ds = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  backBtn:       { padding: 4 },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  headerSub:     { fontSize: 11, marginTop: 1 },
  licenseBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  licenseBtnActive: { borderColor: '#f59e0b50', backgroundColor: '#f59e0b10' },
  licenseBtnText: { fontSize: 11, fontWeight: '600' },
  scroll:        { paddingBottom: 60 },
  modeBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  modeText:      { flex: 1, fontSize: 12, lineHeight: 17 },
  section:       { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle:  { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  gpsBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  gpsBtnActive:  { borderColor: '#10b98150', backgroundColor: '#10b98110' },
  gpsBtnText:    { fontSize: 14 },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignSelf: 'flex-start', marginBottom: 8 },
  resetText:     { fontSize: 12 },
  orText:        { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  pickerSection: { marginBottom: 12 },
  pickerLabel:   { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  pill:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  pillActive:    { borderColor: '#0ea5e9', backgroundColor: '#0ea5e915' },
  pillText:      { fontSize: 13 },
  pillTextActive:{ color: '#0ea5e9', fontWeight: '600' },
  loadingWrap:   { alignItems: 'center', padding: 40, gap: 12 },
  loadingText:   { fontSize: 13 },
  badge:         { margin: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  badgeGrad:     { padding: 18, alignItems: 'center', gap: 8 },
  badgeLabel:    { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  issueRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  issueText:     { fontSize: 12, flex: 1, lineHeight: 17 },
  infoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  infoCard:      { width: '47%', padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  infoIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  infoLabel:     { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue:     { fontSize: 22, fontWeight: '700' },
  infoUnit:      { fontSize: 13, fontWeight: '400' },
  infoSub:       { fontSize: 11, marginTop: 2 },
  ruleNote:      { color: '#f97316', fontSize: 12, marginTop: 8, lineHeight: 17 },
  tipRow:        { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start', padding: 10, borderRadius: 8, borderLeftWidth: 3 },
  tipText:       { fontSize: 13, flex: 1, lineHeight: 19 },
  regBox:        { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  regRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  regKey:        { fontSize: 13 },
  regVal:        { fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  dataSource:    { fontSize: 10, textAlign: 'center', marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  emptyState:    { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText:     { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
