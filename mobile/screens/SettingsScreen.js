import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, THEMES, THEME_LIST } from '../context/SettingsContext';
import { typography } from '../utils/typography';

export default function SettingsScreen({ navigation }) {
  const { theme, setThemeTo } = useSettings();
  const T = THEMES[theme];

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.statusBar === 'light' ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={T.bgGradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: T.text }]}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={s.logoWrap}>
          <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />
          <Text style={[s.appName, { color: T.text }]}>DRONIEN</Text>
          <Text style={[s.appSub, { color: T.textMuted }]}>Drone Intelligence Platform</Text>
        </View>

        {/* Theme selector */}
        <Text style={[s.sectionLabel, { color: T.textMuted }]}>Theme</Text>
        <View style={s.themeGrid}>
          {THEME_LIST.map(th => {
            const isActive = theme === th.id;
            const TT = THEMES[th.id];
            return (
              <TouchableOpacity
                key={th.id}
                onPress={() => setThemeTo(th.id)}
                style={[s.themeCard, {
                  backgroundColor: TT.glass,
                  borderColor: isActive ? TT.accent : T.border,
                  borderWidth: isActive ? 2 : 1,
                }]}
                activeOpacity={0.8}
              >
                <LinearGradient colors={TT.bgGradient} style={StyleSheet.absoluteFill} borderRadius={14} />
                <Text style={s.themeEmoji}>{th.icon}</Text>
                <Text style={[s.themeLabel, { color: TT.text }]}>{th.label}</Text>
                <Text style={[s.themeDesc, { color: TT.textMuted }]} numberOfLines={1}>{th.desc}</Text>
                {isActive && (
                  <View style={[s.themeCheck, { backgroundColor: TT.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Data sources */}
        <Text style={[s.sectionLabel, { color: T.textMuted }]}>Data Sources</Text>
        <View style={[s.card, { backgroundColor: T.glass, borderColor: T.glassBorder }]}>
          {[
            ['Weather',     'Open-Meteo (free)'],
            ['Elevation',   'Open-Meteo (free)'],
            ['Geocoding',   'OpenStreetMap Nominatim'],
            ['Sun times',   'sunrise-sunset.org'],
            ['Regulations', 'DGAC Costa Rica'],
          ].map(([k, v], i, arr) => (
            <View key={k} style={[s.row,
              i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border }]}>
              <Text style={[s.rowKey, { color: T.textMuted }]}>{k}</Text>
              <Text style={[s.rowVal, { color: T.text }]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Version */}
        <Text style={[s.sectionLabel, { color: T.textMuted }]}>App</Text>
        <View style={[s.card, { backgroundColor: T.glass, borderColor: T.glassBorder }]}>
          {[['Version', '1.0.0'], ['Build', 'Expo SDK 54'], ['Platform', Platform.OS === 'ios' ? 'iOS' : 'Android']].map(([k, v], i, arr) => (
            <View key={k} style={[s.row,
              i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border }]}>
              <Text style={[s.rowKey, { color: T.textMuted }]}>{k}</Text>
              <Text style={[s.rowVal, { color: T.text }]}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.footer, { color: T.textSub }]}>© {new Date().getFullYear()} Julian Sanchez LLC</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:  { padding: 4, width: 32 },
  title:    { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  logoWrap: { alignItems: 'center', paddingVertical: 28 },
  logo:     { width: 80, height: 80, marginBottom: 12 },
  appName:  { fontFamily: 'Dronien', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
  appSub:   { fontSize: 12, letterSpacing: 0.5, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 8, marginHorizontal: 20 },
  themeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10,
  },
  themeCard: {
    width: '47%', borderRadius: 14,
    padding: 14, overflow: 'hidden', position: 'relative',
    gap: 4,
  },
  themeEmoji: { fontSize: 22, marginBottom: 4 },
  themeLabel: { fontSize: 14, fontWeight: '700' },
  themeDesc:  { fontSize: 11 },
  themeCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  card: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  rowKey: { fontSize: 14 },
  rowVal: { fontSize: 14, fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', paddingVertical: 24 },
});
