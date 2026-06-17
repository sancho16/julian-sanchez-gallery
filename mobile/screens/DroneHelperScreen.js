import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PROVINCES } from '../data/costaRicaLocations';

// ── Free APIs used ────────────────────────────────────────────
// Weather: Open-Meteo (free, no key needed) — wind, temp, humidity, precipitation
// Elevation: Open-Meteo Elevation API (free, no key needed)
// Geocoding: Nominatim/OpenStreetMap (free, no key needed)
// Sunrise/Sunset: sunrise-sunset.org (free, no key needed)

const OPEN_METEO   = 'https://api.open-meteo.com/v1/forecast';
const ELEV_API     = 'https://api.open-meteo.com/v1/elevation';
const SUN_API      = 'https://api.sunrise-sunset.org/json';

// ── Drone regulations for Costa Rica ─────────────────────────
// Source: DGAC (Dirección General de Aviación Civil) regulations
const RULES = {
  unlicensed: {
    maxAltitude: 122,     // meters (400 ft)
    maxDistance: 500,     // meters from pilot
    maxWindSpeed: 10,     // m/s (approx 22 mph / Beaufort 5)
    requiresDaylight: true,
    requiresVLOS: true,   // Visual Line of Sight
    noFlyNight: true,
    maxWeight: 0.250,     // kg (drones under 250g often exempt)
    label: 'Recreational / Non-Licensed',
  },
  licensed: {
    maxAltitude: 152,     // meters (500 ft)
    maxDistance: 1000,
    maxWindSpeed: 14,     // m/s (approx 31 mph)
    requiresDaylight: false,
    requiresVLOS: true,
    noFlyNight: false,
    maxWeight: 25,
    label: 'Licensed Pilot (RPAS)',
  },
};

// ── Beaufort wind scale description ──────────────────────────
function windDescription(ms) {
  if (ms < 0.5)  return { label: 'Calm',         safe: true,  color: '#10b981' };
  if (ms < 1.6)  return { label: 'Light air',    safe: true,  color: '#10b981' };
  if (ms < 3.4)  return { label: 'Light breeze', safe: true,  color: '#10b981' };
  if (ms < 5.5)  return { label: 'Gentle',       safe: true,  color: '#84cc16' };
  if (ms < 8.0)  return { label: 'Moderate',     safe: true,  color: '#eab308' };
  if (ms < 10.8) return { label: 'Fresh',        safe: false, color: '#f97316' };
  if (ms < 13.9) return { label: 'Strong',       safe: false, color: '#ef4444' };
  return           { label: 'Very strong — DO NOT FLY', safe: false, color: '#dc2626' };
}

// ── Overall flight safety assessment ─────────────────────────
function assessFlight(weather, elevation, sunTimes, isLicensed) {
  const rules  = isLicensed ? RULES.licensed : RULES.unlicensed;
  const issues = [];
  const tips   = [];
  let   safe   = true;

  const wind = weather.windspeed_10m;
  const gust = weather.windgusts_10m || wind;
  const precip = weather.precipitation || 0;
  const vis  = weather.visibility || 10000;
  const clouds = weather.cloudcover || 0;

  if (wind > rules.maxWindSpeed) {
    safe = false;
    issues.push(`Wind ${wind.toFixed(1)} m/s exceeds limit of ${rules.maxWindSpeed} m/s`);
  }
  if (gust > rules.maxWindSpeed * 1.3) {
    safe = false;
    issues.push(`Gusts ${gust.toFixed(1)} m/s — risk of control loss`);
  }
  if (precip > 0.1) {
    safe = false;
    issues.push(`Rain detected (${precip.toFixed(1)} mm) — avoid flying`);
  }
  if (vis < 5000) {
    safe = false;
    issues.push(`Low visibility ${(vis/1000).toFixed(1)} km — VLOS may be compromised`);
  }
  if (elevation > 3000) {
    tips.push('High altitude — battery drain increases ~20%, motors work harder');
  }
  if (clouds > 80) {
    tips.push('Overcast — great for even lighting in footage');
  }
  if (wind > 5 && wind <= rules.maxWindSpeed) {
    tips.push('Moderate wind — keep Return-To-Home altitude above obstacles');
  }
  if (!isLicensed) {
    tips.push('Stay below 122m (400ft) AGL and within visual line of sight');
    tips.push('Avoid airports, national parks, and populated areas');
    tips.push('Register your drone with DGAC if over 250g');
  }

  return { safe, issues, tips };
}

// ── Info card component ───────────────────────────────────────
function InfoCard({ icon, label, value, unit, color = '#0ea5e9', sublabel }) {
  return (
    <View style={[ds.infoCard, { borderColor: color + '30' }]}>
      <View style={[ds.infoIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={ds.infoLabel}>{label}</Text>
      <Text style={[ds.infoValue, { color }]}>{value}<Text style={ds.infoUnit}> {unit}</Text></Text>
      {sublabel ? <Text style={ds.infoSub}>{sublabel}</Text> : null}
    </View>
  );
}

// ── Safety badge ──────────────────────────────────────────────
function SafetyBadge({ safe, issues }) {
  const color = safe ? '#10b981' : '#ef4444';
  const label = safe ? 'SAFE TO FLY' : 'NOT RECOMMENDED';
  const icon  = safe ? 'checkmark-circle' : 'warning';
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!safe) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [safe]);

  return (
    <Animated.View style={[ds.badge, { borderColor: color + '50', transform: [{ scale: pulse }] }]}>
      <LinearGradient colors={[color + '25', color + '08']} style={ds.badgeGrad}>
        <Ionicons name={icon} size={28} color={color} />
        <Text style={[ds.badgeLabel, { color }]}>{label}</Text>
        {issues.length > 0 && (
          <View style={ds.issuesList}>
            {issues.map((issue, i) => (
              <View key={i} style={ds.issueRow}>
                <Ionicons name="alert-circle" size={12} color={color} />
                <Text style={[ds.issueText, { color }]}>{issue}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ── Picker row ────────────────────────────────────────────────
function PickerRow({ label, options, selected, onSelect }) {
  return (
    <View style={ds.pickerSection}>
      <Text style={ds.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ds.pickerScroll}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt)}
            style={[ds.pill, selected?.id === opt.id && ds.pillActive]}
          >
            <Text style={[ds.pillText, selected?.id === opt.id && ds.pillTextActive]} numberOfLines={1}>
              {opt.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function DroneHelperScreen({ navigation }) {
  const [isLicensed,   setIsLicensed]   = useState(false);
  const [useGPS,       setUseGPS]       = useState(false);
  const [province,     setProvince]     = useState(null);
  const [canton,       setCanton]       = useState(null);
  const [district,     setDistrict]     = useState(null);
  const [coords,       setCoords]       = useState(null);
  const [weather,      setWeather]      = useState(null);
  const [elevation,    setElevation]    = useState(null);
  const [sunTimes,     setSunTimes]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [assessment,   setAssessment]   = useState(null);
  const [locationName, setLocationName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── GPS location ────────────────────────────────────────────
  const getGPSLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Enable location access in Settings to use GPS.');
      return;
    }
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      // Reverse geocode for display name
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo[0]) {
        setLocationName([geo[0].district, geo[0].subregion, geo[0].region].filter(Boolean).join(', '));
      }
      setUseGPS(true);
    } catch {
      Alert.alert('GPS Error', 'Could not get location. Try manual selection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch all data ──────────────────────────────────────────
  const fetchData = useCallback(async (lat, lon) => {
    setLoading(true);
    setWeather(null); setElevation(null); setAssessment(null);
    fadeAnim.setValue(0);

    try {
      // 1. Weather from Open-Meteo (free, no API key)
      const wRes = await fetch(
        `${OPEN_METEO}?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,precipitation,cloudcover,visibility,windspeed_10m,windgusts_10m,winddirection_10m,weathercode` +
        `&wind_speed_unit=ms&timezone=America/Costa_Rica`
      );
      const wData = await wRes.json();
      const cur = wData.current;

      // 2. Elevation from Open-Meteo (free, no API key)
      const eRes = await fetch(`${ELEV_API}?latitude=${lat}&longitude=${lon}`);
      const eData = await eRes.json();
      const elev = eData.elevation?.[0] ?? 0;

      // 3. Sunrise/sunset (free, no API key)
      const sRes = await fetch(`${SUN_API}?lat=${lat}&lng=${lon}&formatted=0`);
      const sData = await sRes.json();
      const sunrise = sData.results?.sunrise ? new Date(sData.results.sunrise) : null;
      const sunset  = sData.results?.sunset  ? new Date(sData.results.sunset)  : null;

      const weatherObj = {
        temperature_2m:       cur.temperature_2m,
        relative_humidity_2m: cur.relative_humidity_2m,
        precipitation:        cur.precipitation,
        cloudcover:           cur.cloudcover,
        visibility:           cur.visibility,
        windspeed_10m:        cur.windspeed_10m,
        windgusts_10m:        cur.windgusts_10m,
        winddirection_10m:    cur.winddirection_10m,
        weathercode:          cur.weathercode,
      };

      setWeather(weatherObj);
      setElevation(elev);
      setSunTimes({ sunrise, sunset });
      setAssessment(assessFlight(weatherObj, elev, { sunrise, sunset }, isLicensed));

      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (err) {
      Alert.alert('Data Error', 'Could not fetch weather data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [isLicensed]);

  // Auto-fetch when coords change
  useEffect(() => {
    if (coords) fetchData(coords.lat, coords.lon);
  }, [coords]);

  // Re-assess when license mode changes
  useEffect(() => {
    if (weather && elevation !== null) {
      setAssessment(assessFlight(weather, elevation, sunTimes, isLicensed));
    }
  }, [isLicensed]);

  // When province changes, reset canton/district
  const handleProvince = (p) => { setProvince(p); setCanton(null); setDistrict(null); setCoords(null); setUseGPS(false); };
  const handleCanton   = (c) => { setCanton(c); setDistrict(null); setCoords({ lat: c.lat, lon: c.lon }); setLocationName(`${c.name}, ${province.name}`); };
  const handleDistrict = (d) => { setDistrict(d); setLocationName(`${d}, ${canton.name}, ${province.name}`); };

  const formatTime = (date) => date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' }) : '--:--';
  const wind = weather ? windDescription(weather.windspeed_10m) : null;

  return (
    <View style={ds.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={ds.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ds.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={ds.headerCenter}>
          <Text style={ds.headerTitle}>Drone Helper CR</Text>
          <Text style={ds.headerSub}>Costa Rica Flight Planner</Text>
        </View>
        {/* License toggle */}
        <TouchableOpacity
          style={[ds.licenseBtn, isLicensed && ds.licenseBtnActive]}
          onPress={() => setIsLicensed(p => !p)}
        >
          <Ionicons name={isLicensed ? 'ribbon' : 'person'} size={14} color={isLicensed ? '#f59e0b' : '#888'} />
          <Text style={[ds.licenseBtnText, isLicensed && { color: '#f59e0b' }]}>
            {isLicensed ? 'PRO' : 'REC'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ds.scroll}>

        {/* Mode banner */}
        <View style={[ds.modeBanner, { borderColor: isLicensed ? '#f59e0b40' : '#0ea5e940' }]}>
          <Ionicons name={isLicensed ? 'ribbon' : 'person-circle'} size={16} color={isLicensed ? '#f59e0b' : '#0ea5e9'} />
          <Text style={[ds.modeText, { color: isLicensed ? '#f59e0b' : '#0ea5e9' }]}>
            {isLicensed ? 'Licensed Pilot Mode — RPAS regulations apply' : 'Recreational Mode — DGAC non-licensed rules apply'}
          </Text>
        </View>

        {/* Location section */}
        <View style={ds.section}>
          <Text style={ds.sectionTitle}>📍 Location</Text>

          {/* GPS button */}
          <TouchableOpacity style={[ds.gpsBtn, useGPS && ds.gpsBtnActive]} onPress={getGPSLocation}>
            <Ionicons name="locate" size={18} color={useGPS ? '#10b981' : '#888'} />
            <Text style={[ds.gpsBtnText, useGPS && { color: '#10b981' }]}>
              {useGPS ? `GPS: ${locationName || 'Located'}` : 'Use GPS Location'}
            </Text>
          </TouchableOpacity>

          <Text style={ds.orText}>— or select manually —</Text>

          {/* Province picker */}
          <PickerRow
            label="Province"
            options={PROVINCES}
            selected={province}
            onSelect={handleProvince}
          />

          {/* Canton picker */}
          {province && (
            <PickerRow
              label="Canton"
              options={province.cantons}
              selected={canton}
              onSelect={handleCanton}
            />
          )}

          {/* District picker */}
          {canton && (
            <PickerRow
              label="District"
              options={canton.districts.map(d => ({ id: d, name: d }))}
              selected={district ? { id: district, name: district } : null}
              onSelect={(d) => handleDistrict(d.name)}
            />
          )}
        </View>

        {/* Loading */}
        {loading && (
          <View style={ds.loadingWrap}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={ds.loadingText}>Fetching flight data…</Text>
          </View>
        )}

        {/* Results */}
        {weather && !loading && (
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Location name */}
            {locationName ? (
              <Text style={ds.locationName}>📍 {locationName}</Text>
            ) : null}

            {/* Safety badge */}
            {assessment && (
              <SafetyBadge safe={assessment.safe} issues={assessment.issues} />
            )}

            {/* Wind */}
            <View style={ds.section}>
              <Text style={ds.sectionTitle}>💨 Wind</Text>
              <View style={ds.infoGrid}>
                <InfoCard
                  icon="speedometer"
                  label="Speed"
                  value={weather.windspeed_10m?.toFixed(1)}
                  unit="m/s"
                  color={wind?.color}
                  sublabel={wind?.label}
                />
                <InfoCard
                  icon="arrow-up-circle"
                  label="Gusts"
                  value={(weather.windgusts_10m ?? weather.windspeed_10m)?.toFixed(1)}
                  unit="m/s"
                  color={windDescription(weather.windgusts_10m ?? 0).color}
                />
                <InfoCard
                  icon="compass"
                  label="Direction"
                  value={weather.winddirection_10m?.toFixed(0)}
                  unit="°"
                  color="#818cf8"
                />
              </View>
            </View>

            {/* Atmosphere */}
            <View style={ds.section}>
              <Text style={ds.sectionTitle}>🌡️ Atmosphere</Text>
              <View style={ds.infoGrid}>
                <InfoCard icon="thermometer"   label="Temp"       value={weather.temperature_2m?.toFixed(1)}      unit="°C"  color="#f97316" />
                <InfoCard icon="water"         label="Humidity"   value={weather.relative_humidity_2m?.toFixed(0)} unit="%"   color="#0ea5e9" />
                <InfoCard icon="rainy"         label="Rain"       value={weather.precipitation?.toFixed(1)}        unit="mm"  color="#60a5fa" />
                <InfoCard icon="partly-sunny" label="Cloud"      value={weather.cloudcover?.toFixed(0)}           unit="%"   color="#94a3b8" />
                <InfoCard icon="eye"           label="Visibility" value={((weather.visibility ?? 10000)/1000).toFixed(1)} unit="km" color="#a78bfa" />
              </View>
            </View>

            {/* Terrain */}
            <View style={ds.section}>
              <Text style={ds.sectionTitle}>⛰️ Terrain</Text>
              <View style={ds.infoGrid}>
                <InfoCard
                  icon="trending-up"
                  label="Elevation"
                  value={elevation?.toFixed(0)}
                  unit="m"
                  color="#10b981"
                  sublabel={elevation > 2000 ? 'Mountain — reduced lift' : elevation > 1000 ? 'Highland' : 'Lowland'}
                />
                <InfoCard
                  icon="layers"
                  label="Max Alt AGL"
                  value={isLicensed ? '152' : '122'}
                  unit="m"
                  color="#f59e0b"
                  sublabel={`${isLicensed ? '500' : '400'} ft limit`}
                />
              </View>
            </View>

            {/* Sun times */}
            {sunTimes?.sunrise && (
              <View style={ds.section}>
                <Text style={ds.sectionTitle}>☀️ Daylight (Costa Rica)</Text>
                <View style={ds.infoGrid}>
                  <InfoCard icon="sunny"   label="Sunrise" value={formatTime(sunTimes.sunrise)} unit="" color="#f59e0b" />
                  <InfoCard icon="moon"    label="Sunset"  value={formatTime(sunTimes.sunset)}  unit="" color="#f97316" />
                </View>
                {!isLicensed && (
                  <Text style={ds.ruleNote}>⚠️ Recreational pilots must fly during daylight hours only</Text>
                )}
              </View>
            )}

            {/* Tips */}
            {assessment?.tips?.length > 0 && (
              <View style={ds.section}>
                <Text style={ds.sectionTitle}>💡 Flight Tips</Text>
                {assessment.tips.map((tip, i) => (
                  <View key={i} style={ds.tipRow}>
                    <Ionicons name="bulb" size={14} color="#f59e0b" />
                    <Text style={ds.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Regulations */}
            <View style={ds.section}>
              <Text style={ds.sectionTitle}>📋 Costa Rica Regulations</Text>
              <View style={[ds.regBox, { borderColor: isLicensed ? '#f59e0b30' : '#0ea5e930' }]}>
                {[
                  ['Max altitude', `${isLicensed ? '152m (500ft)' : '122m (400ft)'} AGL`],
                  ['Max wind', `${isLicensed ? '14' : '10'} m/s`],
                  ['Night flying', isLicensed ? 'Permitted with auth.' : 'Not permitted'],
                  ['Visual LoS', 'Required at all times'],
                  ['Registration', 'Required for drones >250g (DGAC)'],
                  ['No-fly zones', 'Airports, national parks, govt buildings'],
                ].map(([k, v]) => (
                  <View key={k} style={ds.regRow}>
                    <Text style={ds.regKey}>{k}</Text>
                    <Text style={ds.regVal}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={ds.dataSource}>
              Weather: Open-Meteo · Elevation: Open-Meteo · Sun: sunrise-sunset.org
            </Text>
          </Animated.View>
        )}

        {/* Empty state */}
        {!weather && !loading && (
          <View style={ds.emptyState}>
            <Ionicons name="airplane" size={48} color="#333" />
            <Text style={ds.emptyText}>Select a location or use GPS{'\n'}to get flight conditions</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const ds = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  headerSub:    { color: '#555', fontSize: 11, marginTop: 1 },
  licenseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#333',
  },
  licenseBtnActive: { borderColor: '#f59e0b50', backgroundColor: '#f59e0b10' },
  licenseBtnText:   { color: '#888', fontSize: 11, fontWeight: '600' },

  scroll: { paddingBottom: 60 },
  modeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, padding: 12, borderRadius: 10, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modeText: { flex: 1, fontSize: 12, lineHeight: 17 },

  section:      { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 8 },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 12, borderWidth: 1,
    borderColor: '#333', backgroundColor: '#0d0d0d', marginBottom: 12,
  },
  gpsBtnActive: { borderColor: '#10b98150', backgroundColor: '#10b98110' },
  gpsBtnText:   { color: '#888', fontSize: 14 },
  orText:       { color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 12 },

  pickerSection: { marginBottom: 12 },
  pickerLabel:   { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  pickerScroll:  { flexGrow: 0 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#2a2a2a', backgroundColor: '#111',
    marginRight: 8,
  },
  pillActive:     { borderColor: '#0ea5e9', backgroundColor: '#0ea5e915' },
  pillText:       { color: '#666', fontSize: 13 },
  pillTextActive: { color: '#0ea5e9', fontWeight: '600' },

  loadingWrap: { alignItems: 'center', padding: 40, gap: 12 },
  loadingText: { color: '#555', fontSize: 13 },

  locationName: { color: '#fff', fontSize: 15, fontWeight: '600', paddingHorizontal: 16, marginBottom: 12 },

  badge: { margin: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  badgeGrad: { padding: 18, alignItems: 'center', gap: 8 },
  badgeLabel: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  issuesList: { width: '100%', gap: 6, marginTop: 4 },
  issueRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  issueText:  { fontSize: 12, flex: 1, lineHeight: 17 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  infoCard: {
    width: '47%', padding: 14,
    borderRadius: 12, borderWidth: 1,
    backgroundColor: '#0a0a0a', gap: 4,
  },
  infoIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  infoLabel: { color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 22, fontWeight: '700' },
  infoUnit:  { fontSize: 13, fontWeight: '400' },
  infoSub:   { color: '#555', fontSize: 11, marginTop: 2 },

  ruleNote: { color: '#f97316', fontSize: 12, marginTop: 8, lineHeight: 17 },

  tipRow:  { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  tipText: { color: '#aaa', fontSize: 13, flex: 1, lineHeight: 19 },

  regBox: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0a0a0a' },
  regRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1a1a1a' },
  regKey: { color: '#666', fontSize: 13 },
  regVal: { color: '#ddd', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },

  dataSource: { color: '#333', fontSize: 10, textAlign: 'center', marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText:  { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
