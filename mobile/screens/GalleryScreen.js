import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, FlatList, Dimensions, TouchableOpacity,
  Text, StyleSheet, Animated, Platform, Modal,
  StatusBar, TouchableWithoutFeedback, Pressable,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../constants';

const { width: W, height: H } = Dimensions.get('window');
const COLS = 2;
const GAP = 4;
const CELL_W = (W - GAP * (COLS + 1)) / COLS;
const HEIGHTS = [CELL_W * 0.75, CELL_W * 1.1, CELL_W * 0.65, CELL_W * 0.9];

// ─── Animated sound bars ──────────────────────────────────────
function SoundBars() {
  const bars = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    bars.forEach((bar, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1,   duration: 250 + i * 90, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.3, duration: 250 + i * 90, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={s.soundBars}>
      {bars.map((b, i) => (
        <Animated.View key={i} style={[s.soundBar, { transform: [{ scaleY: b }] }]} />
      ))}
    </View>
  );
}

// ─── Thumbnail card (plays only when active) ─────────────────
function VideoCard({ item, isActive, onPress, onFullscreen }) {
  const videoRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [status, setStatus] = useState({});

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.04 : 1,
      useNativeDriver: true,
      tension: 140, friction: 8,
    }).start();
  }, [isActive]);

  // Only play when card is active
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
      videoRef.current.setIsMutedAsync(false).catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setIsMutedAsync(true).catch(() => {});
    }
  }, [isActive]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={[
        s.cardOuter,
        { width: CELL_W, height: item.height },
        isActive && s.cardActive,
      ]}>
        <Animated.View style={[s.cardInner, { transform: [{ scale: scaleAnim }] }]}>
          <Video
            ref={videoRef}
            source={{ uri: item.url }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isActive}
            isMuted={!isActive}
            onPlaybackStatusUpdate={setStatus}
            useNativeControls={false}
            progressUpdateIntervalMillis={500}
          />

          {/* Dark overlay when not playing */}
          {!isActive && (
            <View style={s.pausedOverlay} />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={s.gradient}
            pointerEvents="none"
          />

          {/* Fullscreen button */}
          {isActive && (
            <TouchableOpacity style={s.fullscreenBtn} onPress={onFullscreen}>
              <Ionicons name="expand" size={16} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Sound badge */}
          {isActive && (
            <View style={s.soundBadge}>
              <SoundBars />
            </View>
          )}

          {/* Play icon when inactive */}
          {!isActive && (
            <View style={s.playIconWrap}>
              <Ionicons name="play" size={22} color="rgba(255,255,255,0.7)" />
            </View>
          )}

          {item.description ? (
            <View style={s.captionWrap} pointerEvents="none">
              <Text style={s.caption} numberOfLines={2}>{item.description}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Fullscreen modal ─────────────────────────────────────────
function FullscreenModal({ video, visible, onClose, onNext, onPrev }) {
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start();
      startControlsTimer();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible]);

  const startControlsTimer = () => {
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      setShowControls(false);
    }, 3000);
  };

  const handleTap = () => {
    if (!showControls) {
      setShowControls(true);
      Animated.timing(controlsAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
    startControlsTimer();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 250, useNativeDriver: true }),
    ]).start(onClose);
  };

  if (!video) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <StatusBar hidden />
      <Animated.View style={[s.fsContainer, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={handleTap}>
          <Animated.View style={[s.fsVideoWrap, { transform: [{ translateY: slideAnim }] }]}>
            <Video
              ref={videoRef}
              source={{ uri: video.url }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              isMuted={false}
              useNativeControls={false}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Controls overlay */}
        <Animated.View style={[s.fsControls, { opacity: controlsAnim }]} pointerEvents={showControls ? 'box-none' : 'none'}>
          {/* Top bar */}
          <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={s.fsTopBar}>
            <TouchableOpacity onPress={handleClose} style={s.fsCloseBtn}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            {video.description ? (
              <Text style={s.fsTitle} numberOfLines={1}>{video.description}</Text>
            ) : null}
            <TouchableOpacity onPress={handleClose} style={s.fsCollapseBtn}>
              <Ionicons name="contract" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Side nav arrows */}
          <View style={s.fsSideNav}>
            <TouchableOpacity onPress={onPrev} style={s.fsNavBtn}>
              <Ionicons name="chevron-back" size={32} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={s.fsNavBtn}>
              <Ionicons name="chevron-forward" size={32} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={s.fsBottomBar}>
            <Text style={s.fsCopyright}>© {new Date().getFullYear()} Julian Sanchez LLC</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────
export default function GalleryScreen() {
  const [videos, setVideos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [fsIndex, setFsIndex] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetch(`${API_BASE}/api/videos`)
      .then(r => r.json())
      .then(data => {
        const withLayout = data.map((v, i) => ({
          ...v,
          height: HEIGHTS[i % HEIGHTS.length],
        }));
        setVideos(withLayout);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      })
      .catch(err => console.warn('Could not load videos:', err));
  }, []);

  const handlePress = useCallback((filename) => {
    setActiveId(prev => prev === filename ? null : filename);
  }, []);

  const handleFullscreen = useCallback((filename) => {
    const idx = videos.findIndex(v => v.filename === filename);
    setFsIndex(idx);
  }, [videos]);

  const handleNext = useCallback(() => {
    setFsIndex(prev => (prev + 1) % videos.length);
  }, [videos.length]);

  const handlePrev = useCallback(() => {
    setFsIndex(prev => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  const renderItem = useCallback(({ item }) => (
    <VideoCard
      item={item}
      isActive={activeId === item.filename}
      onPress={() => handlePress(item.filename)}
      onFullscreen={() => handleFullscreen(item.filename)}
    />
  ), [activeId, handlePress, handleFullscreen]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Julian Sanchez</Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={videos}
          keyExtractor={item => item.filename}
          renderItem={renderItem}
          numColumns={COLS}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
        />
      </Animated.View>

      <View style={s.footer}>
        <Text style={s.footerText}>© {new Date().getFullYear()} Julian Sanchez LLC. All rights reserved.</Text>
      </View>

      <FullscreenModal
        video={fsIndex !== null ? videos[fsIndex] : null}
        visible={fsIndex !== null}
        onClose={() => setFsIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  grid: { padding: GAP, paddingBottom: 60 },
  row: { gap: GAP, marginBottom: GAP },

  cardOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#111',
  },
  cardActive: {
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cardInner: { flex: 1 },

  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 1,
  },
  gradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', zIndex: 2,
  },

  playIconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },

  fullscreenBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  },

  soundBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(14,165,233,0.9)',
    borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 5,
    zIndex: 5,
  },
  soundBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 },
  soundBar: { width: 3, height: 10, backgroundColor: '#fff', borderRadius: 2 },

  captionWrap: { position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 4 },
  caption: { color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 15 },

  footer: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerText: { color: '#444', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },

  // ── Fullscreen ──
  fsContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fsVideoWrap: {
    width: W,
    height: H,
  },
  fsControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  fsTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  fsCloseBtn: { padding: 4 },
  fsCollapseBtn: { padding: 4 },
  fsTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  fsSideNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  fsNavBtn: {
    width: 50, height: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  fsBottomBar: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  fsCopyright: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
});
