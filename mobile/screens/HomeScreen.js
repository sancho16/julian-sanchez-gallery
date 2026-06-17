import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, THEMES } from '../context/SettingsContext';
import { typography } from '../utils/typography';

function AppCard({ icon, title, subtitle, color, delay, onPress, T }) {
  const scale      = useRef(new Animated.Value(0.88)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(scale,      { toValue: 1, tension: 80, friction: 8, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ scale }, { translateY }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        <LinearGradient
          colors={[color + '22', color + '08']}
          style={[s.card, { borderColor: color + '44', backgroundColor: T.glass }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={[s.iconCircle, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Ionicons name={icon} size={32} color={color} />
          </View>
          <View style={s.cardText}>
            <Text style={[s.cardTitle, { color: T.text }]}>{title}</Text>
            <Text style={[s.cardSubtitle, { color: T.textMuted }]}>{subtitle}</Text>
          </View>
          <View style={[s.arrow, { backgroundColor: color + '20' }]}>
            <Ionicons name="chevron-forward" size={18} color={color} />
          </View>
          <View style={[s.glowDot, { backgroundColor: color }]} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { theme } = useSettings();
  const T = THEMES[theme];
  const isDark = theme === 'dark';

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(-20)).current;
  const gearRotate   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(titleY,       { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const onGearPress = () => {
    Animated.spring(gearRotate, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start(() => {
      gearRotate.setValue(0);
    });
    navigation.navigate('Settings');
  };

  const spin = gearRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={isDark ? ['#050505', '#0a0a14', '#050505'] : ['#dbeafe', '#f0f9ff', '#dbeafe']}
        style={StyleSheet.absoluteFill}
      />

      {/* Settings gear — top right */}
      <Animated.View style={[s.gearWrap, { transform: [{ rotate: spin }] }]}>
        <TouchableOpacity onPress={onGearPress} style={[s.gearBtn, { backgroundColor: T.glass, borderColor: T.glassBorder }]}>
          <Ionicons name="settings-outline" size={20} color={T.textMuted} />
        </TouchableOpacity>
      </Animated.View>

      {/* Header with logo */}
      <Animated.View style={[s.header, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Image
          source={require('../assets/logo.png')}
          style={s.logo}
          resizeMode="contain"
          onError={() => {}}
        />
        <Text style={[s.brand, { color: T.accent || T.text }]}>DRONIEN</Text>
        <Text style={[s.tagline, { color: T.textMuted }]}>Select an experience</Text>
      </Animated.View>

      {/* Cards */}
      <View style={s.cards}>
        <AppCard icon="play-circle"  title="Video Showcase"   subtitle="Drone footage gallery"          color="#0ea5e9" delay={200} onPress={() => navigation.navigate('Gallery')}     T={T} />
        <AppCard icon="airplane"     title="Drone Helper CR"  subtitle="Costa Rica flight planner"      color="#10b981" delay={380} onPress={() => navigation.navigate('DroneHelper')} T={T} />
      </View>

      <View style={s.footer}>
        <Text style={[s.footerText, { color: T.textSub }]}>© {new Date().getFullYear()} Julian Sanchez LLC</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  gearWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 20,
    zIndex: 100,
  },
  gearBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 28, paddingBottom: 40,
    alignItems: 'flex-start',
  },
  logo:    { width: 56, height: 56, marginBottom: 12 },
  brand:   { fontFamily: 'Dronien', fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 },
  tagline: { fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  cards:   { flex: 1, paddingHorizontal: 20, gap: 16, justifyContent: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden', gap: 16,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardText:    { flex: 1 },
  cardTitle:   { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, marginBottom: 4 },
  cardSubtitle:{ fontSize: 13 },
  arrow:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  glowDot:     { position: 'absolute', top: 14, right: 14, width: 6, height: 6, borderRadius: 3, opacity: 0.7 },
  footer:      { paddingBottom: Platform.OS === 'ios' ? 40 : 24, alignItems: 'center' },
  footerText:  { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
});
