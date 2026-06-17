import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, THEMES } from '../context/SettingsContext';

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme } = useSettings();
  const T = THEMES[theme];
  const isDark = theme === 'dark';

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background */}
      <LinearGradient
        colors={isDark ? ['#050510', '#0a0a1a', '#050510'] : ['#dbeafe', '#f0f9ff', '#dbeafe']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: T.text }]}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.content}>

        {/* Appearance */}
        <Text style={[s.sectionLabel, { color: T.textMuted }]}>Appearance</Text>
        <View style={[s.card, { backgroundColor: T.glass, borderColor: T.glassBorder }]}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.rowIcon, { backgroundColor: isDark ? '#1e1b4b' : '#ede9fe' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#818cf8' : '#f59e0b'} />
              </View>
              <View>
                <Text style={[s.rowTitle, { color: T.text }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={[s.rowSub, { color: T.textMuted }]}>{isDark ? 'Easy on the eyes' : 'Bright and clear'}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: '#4f46e5' }}
              thumbColor={isDark ? '#818cf8' : '#fff'}
            />
          </View>
        </View>

        {/* About */}
        <Text style={[s.sectionLabel, { color: T.textMuted }]}>About</Text>
        <View style={[s.card, { backgroundColor: T.glass, borderColor: T.glassBorder }]}>
          {[
            ['Version', '1.0.0'],
            ['Weather', 'Open-Meteo (free)'],
            ['Elevation', 'Open-Meteo (free)'],
            ['Geocoding', 'OpenStreetMap Nominatim'],
            ['Sun times', 'sunrise-sunset.org'],
            ['Regulations', 'DGAC Costa Rica'],
          ].map(([k, v], i, arr) => (
            <View key={k} style={[s.row, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border }]}>
              <Text style={[s.rowTitle, { color: T.textMuted }]}>{k}</Text>
              <Text style={[s.rowSub, { color: T.text, textAlign: 'right' }]}>{v}</Text>
            </View>
          ))}
        </View>

      </View>

      <View style={s.footer}>
        <Text style={[s.footerText, { color: T.textSub }]}>© {new Date().getFullYear()} Julian Sanchez LLC</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, width: 32 },
  title:   { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  content: { flex: 1, padding: 20, gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 12, marginBottom: 6, marginLeft: 4,
  },
  card: {
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, gap: 12,
  },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '500' },
  rowSub:   { fontSize: 12, marginTop: 1 },
  footer:   { paddingBottom: Platform.OS === 'ios' ? 40 : 24, alignItems: 'center' },
  footerText: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
});
