import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

function AppCard({ icon, title, subtitle, color, delay, onPress }) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 80, friction: 8, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ scale }, { translateY }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[color + '22', color + '08']}
          style={[styles.card, { borderColor: color + '44' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Ionicons name={icon} size={32} color={color} />
          </View>

          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>

          <View style={[styles.arrow, { backgroundColor: color + '20' }]}>
            <Ionicons name="chevron-forward" size={18} color={color} />
          </View>

          {/* Glow dot */}
          <View style={[styles.glowDot, { backgroundColor: color }]} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(titleY,       { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#050505', '#0a0a14', '#050505']}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle grid lines */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Text style={styles.brand}>Julian Sanchez</Text>
        <Text style={styles.tagline}>Select an experience</Text>
      </Animated.View>

      {/* Cards */}
      <View style={styles.cards}>
        <AppCard
          icon="play-circle"
          title="Video Showcase"
          subtitle="Drone footage gallery"
          color="#0ea5e9"
          delay={200}
          onPress={() => navigation.navigate('Gallery')}
        />
        <AppCard
          icon="airplane"
          title="Drone Helper CR"
          subtitle="Costa Rica flight planner"
          color="#10b981"
          delay={380}
          onPress={() => navigation.navigate('DroneHelper')}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Julian Sanchez LLC</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    borderWidth: 0,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  brand: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cards: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 16,
  },
  iconCircle: {
    width: 60, height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  arrow: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  glowDot: {
    position: 'absolute',
    top: 14, right: 14,
    width: 6, height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
