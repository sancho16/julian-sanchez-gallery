import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, FlatList, Dimensions, TouchableOpacity,
  Text, StyleSheet, Animated, Platform, Modal,
  StatusBar, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { API_BASE } from '../constants';

const COLS = 2;
const GAP  = 4;

function getDims() {
  const { width, height } = Dimensions.get('window');
  return { W: width, H: height, cellW: (width - GAP * (COLS + 1)) / COLS };
}

const HEIGHTS = [0.75, 1.1, 0.65, 0.9];

// ─── Set audio mode once at app level ────────────────────────
// This prevents echo by ensuring only one audio session is active
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
}).catch(() => {});

// ─── Circular loading ring ────────────────────────────────────
function LoadingRing({ size = 48, color = '#0ea5e9' }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Spinning ring
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringSize  = size;
  const thickness = size * 0.1;

  return (
    <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow behind ring */}
      <Animated.View style={{
        position: 'absolute',
        width: ringSize + 10,
        height: ringSize + 10,
        borderRadius: (ringSize + 10) / 2,
        backgroundColor: color,
        opacity: pulse,
        transform: [{ scale: pulse }],
        // Blur-like effect using shadow
        shadowColor: color,
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      }} />

      {/* Spinning arc */}
      <Animated.View style={{
        width: ringSize,
        height: ringSize,
        borderRadius: ringSize / 2,
        borderWidth: thickness,
        borderColor: 'transparent',
        borderTopColor: color,
        borderRightColor: `${color}88`,
        transform: [{ rotate: spin }],
        shadowColor: color,
        shadowOpacity: 0.8,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      }} />

      {/* Inner dot */}
      <View style={{
        position: 'absolute',
        width: ringSize * 0.25,
        height: ringSize * 0.25,
        borderRadius: ringSize * 0.125,
        backgroundColor: color,
        shadowColor: color,
        shadowOpacity: 1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      }} />
    </View>
  );
}

// ─── Sound bars ───────────────────────────────────────────────
function SoundBars() {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];
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

// ─── Video card ───────────────────────────────────────────────
function VideoCard({ item, isActive, onPress, onFullscreen }) {
  const videoRef    = useRef(null);
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const [buffering, setBuffering] = useState(false);
  const [ready,     setReady]     = useState(false);
  const { cellW }   = getDims();

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.04 : 1,
      useNativeDriver: true,
      tension: 140, friction: 8,
    }).start();
  }, [isActive]);

  // Strictly control audio — only active card gets sound
  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;
    if (isActive) {
      ref.setIsMutedAsync(false).catch(() => {});
      ref.playAsync().catch(() => {});
    } else {
      // Mute FIRST, then pause — prevents audio bleed
      ref.setIsMutedAsync(true).catch(() => {});
      ref.pauseAsync().catch(() => {});
    }
  }, [isActive]);

  const handleStatus = useCallback((status) => {
    if (!status.isLoaded) return;
    // Show spinner when buffering (isPlaying but no progress)
    setBuffering(status.isBuffering || false);
    if (!ready && status.isLoaded) setReady(true);
  }, [ready]);

  const cardH = cellW * HEIGHTS[item.index % HEIGHTS.length];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={[s.cardOuter, { width: cellW, height: cardH }, isActive && s.cardActive]}>
        <Animated.View style={[s.cardInner, { transform: [{ scale: scaleAnim }] }]}>
          <Video
            ref={videoRef}
            source={{ uri: item.url }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isActive}
            isMuted={!isActive}
            useNativeControls={false}
            progressUpdateIntervalMillis={500}
            onPlaybackStatusUpdate={handleStatus}
          />

          {/* Loading ring — shown when buffering or not yet ready */}
          {(buffering || (!ready && isActive)) && (
            <View style={s.loadingOverlay}>
              <LoadingRing size={40} color="#0ea5e9" />
            </View>
          )}

          {!isActive && <View style={s.pausedOverlay} />}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={s.gradient}
            pointerEvents="none"
          />

          {isActive && (
            <TouchableOpacity style={s.fullscreenBtn} onPress={onFullscreen}>
              <Ionicons name="expand" size={16} color="#fff" />
            </TouchableOpacity>
          )}

          {isActive  && !buffering && <View style={s.soundBadge}><SoundBars /></View>}
          {isActive  &&  buffering && (
            <View style={[s.soundBadge, { paddingHorizontal: 6 }]}>
              <Text style={{ color: '#fff', fontSize: 9 }}>Loading</Text>
            </View>
          )}

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
  const videoRef     = useRef(null);
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(40)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const [showControls, setShowControls] = useState(true);
  const [dims,         setDims]         = useState(getDims());
  const [isLandscape,  setIsLandscape]  = useState(false);
  const [buffering,    setBuffering]    = useState(true);
  const controlsTimer = useRef(null);

  useEffect(() => {
    if (!visible) return;
    ScreenOrientation.unlockAsync();
    const sub = ScreenOrientation.addOrientationChangeListener((evt) => {
      const ori = evt.orientationInfo.orientation;
      const land = ori === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                   ori === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(land);
      setDims(getDims());
    });
    const dimSub = Dimensions.addEventListener('change', ({ window }) => {
      setDims({ W: window.width, H: window.height, cellW: (window.width - GAP * (COLS + 1)) / COLS });
      setIsLandscape(window.width > window.height);
    });
    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      dimSub?.remove();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsLandscape(false);
      setBuffering(true);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setBuffering(true);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start();
      startControlsTimer();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible, video]);

  const startControlsTimer = () => {
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      setShowControls(false);
    }, 3500);
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
      Animated.timing(fadeAnim,  { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 40, duration: 250, useNativeDriver: true }),
    ]).start(onClose);
  };

  const handleStatus = useCallback((status) => {
    if (!status.isLoaded) return;
    setBuffering(status.isBuffering || false);
  }, []);

  if (!video) return null;
  const { W, H } = dims;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <StatusBar hidden />
      <Animated.View style={[s.fsContainer, { opacity: fadeAnim, width: W, height: H }]}>

        <TouchableWithoutFeedback onPress={handleTap}>
          <Animated.View style={[s.fsVideoWrap, { width: W, height: H, transform: [{ translateY: slideAnim }] }]}>
            <Video
              ref={videoRef}
              source={{ uri: video.url }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              isMuted={false}
              useNativeControls={false}
              progressUpdateIntervalMillis={500}
              onPlaybackStatusUpdate={handleStatus}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Fullscreen loading ring */}
        {buffering && (
          <View style={s.fsLoadingOverlay} pointerEvents="none">
            <LoadingRing size={64} color="#0ea5e9" />
            <Text style={s.fsLoadingText}>Loading video…</Text>
          </View>
        )}

        {/* Controls */}
        <Animated.View
          style={[s.fsControls, { width: W, height: H, opacity: controlsAnim }]}
          pointerEvents={showControls ? 'box-none' : 'none'}
        >
          <LinearGradient colors={['rgba(0,0,0,0.75)', 'transparent']} style={[s.fsTopBar, isLandscape && s.fsTopBarLandscape]}>
            <TouchableOpacity onPress={handleClose} style={s.fsCloseBtn}>
              <Ionicons name="chevron-down" size={isLandscape ? 24 : 28} color="#fff" />
            </TouchableOpacity>
            {video.description ? (
              <Text style={s.fsTitle} numberOfLines={1}>{video.description}</Text>
            ) : null}
            <TouchableOpacity onPress={handleClose} style={s.fsCollapseBtn}>
              <Ionicons name="contract" size={isLandscape ? 18 : 20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={[s.fsSideNav, isLandscape && s.fsSideNavLandscape]}>
            <TouchableOpacity onPress={onPrev} style={s.fsNavBtn}>
              <Ionicons name="chevron-back" size={isLandscape ? 28 : 32} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={s.fsNavBtn}>
              <Ionicons name="chevron-forward" size={isLandscape ? 28 : 32} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={[s.fsBottomBar, isLandscape && s.fsBottomBarLandscape]}>
            <Text style={s.fsCopyright}>© {new Date().getFullYear()} Julian Sanchez LLC</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────
export default function GalleryScreen({ navigation }) {
  const [videos,   setVideos]   = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [fsIndex,  setFsIndex]  = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Lock portrait on gallery, mute all audio initially
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/videos`)
      .then(r => r.json())
      .then(data => {
        setVideos(data.map((v, i) => ({ ...v, index: i })));
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      })
      .catch(err => console.warn('Could not load videos:', err));
  }, []);

  // When fullscreen opens, mute the grid card to prevent echo
  const handleFullscreen = useCallback((id) => {
    setActiveId(null); // deactivate grid card (mutes it)
    setTimeout(() => {
      setFsIndex(videos.findIndex(v => v.filename === id));
    }, 100); // small delay so card mutes before fullscreen audio starts
  }, [videos]);

  // When fullscreen closes, don't auto-resume grid audio
  const handleFsClose = useCallback(() => {
    setFsIndex(null);
    setActiveId(null);
  }, []);

  const handlePress  = useCallback((id) => setActiveId(p => p === id ? null : id), []);
  const handleNext   = useCallback(() => setFsIndex(p => (p + 1) % videos.length), [videos.length]);
  const handlePrev   = useCallback(() => setFsIndex(p => (p - 1 + videos.length) % videos.length), [videos.length]);

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
        {navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        )}
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
        onClose={handleFsClose}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', flex: 1 },
  backBtn: { marginRight: 8, padding: 2 },
  grid:  { padding: GAP, paddingBottom: 60 },
  row:   { gap: GAP, marginBottom: GAP },

  cardOuter: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#111',
  },
  cardActive: {
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9', shadowOpacity: 0.5,
    shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  cardInner:     { flex: 1 },
  pausedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1 },
  gradient:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', zIndex: 2 },
  playIconWrap:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 3 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },

  fullscreenBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15, alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  soundBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(14,165,233,0.9)',
    borderRadius: 20, paddingHorizontal: 7, paddingVertical: 5, zIndex: 5,
  },
  soundBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 },
  soundBar:  { width: 3, height: 10, backgroundColor: '#fff', borderRadius: 2 },
  captionWrap: { position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 4 },
  caption:     { color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 15 },
  footer:      { paddingVertical: 14, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  footerText:  { color: '#444', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },

  // ── Fullscreen ──
  fsContainer:  { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fsVideoWrap:  { position: 'absolute' },
  fsControls:   { position: 'absolute', top: 0, left: 0, justifyContent: 'space-between' },

  fsLoadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    gap: 16,
  },
  fsLoadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  fsTopBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 20, paddingHorizontal: 16, gap: 12,
  },
  fsTopBarLandscape: { paddingTop: Platform.OS === 'ios' ? 16 : 12, paddingBottom: 12 },
  fsCloseBtn:    { padding: 4 },
  fsCollapseBtn: { padding: 4 },
  fsTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500', textAlign: 'center' },

  fsSideNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, alignItems: 'center' },
  fsSideNavLandscape: { paddingHorizontal: 4 },
  fsNavBtn: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 25, alignItems: 'center', justifyContent: 'center' },

  fsBottomBar: { paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 20, alignItems: 'center' },
  fsBottomBarLandscape: { paddingBottom: Platform.OS === 'ios' ? 16 : 12, paddingTop: 12 },
  fsCopyright: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
});
