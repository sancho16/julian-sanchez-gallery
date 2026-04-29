import React, { useState, useEffect, useRef, useCallback } from 'react';

const SIZES = [
  { cols: 2, rows: 2 },
  { cols: 1, rows: 1 },
  { cols: 1, rows: 2 },
  { cols: 2, rows: 1 },
  { cols: 1, rows: 1 },
  { cols: 1, rows: 1 },
];

export default function Gallery() {
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const videoRefs = useRef({});

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const withSizes = shuffled.map((v, i) => ({
          ...v,
          size: SIZES[i % SIZES.length],
        }));
        setVideos(withSizes);
        setTimeout(() => setLoaded(true), 100);
      });
  }, []);

  const handleTap = useCallback((filename) => {
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      if (!ref) return;
      if (key === filename) {
        ref.muted = false;
        ref.play().catch(() => {});
      } else {
        ref.muted = true;
      }
    });
    setActiveVideo(filename);
  }, []);

  const handleVideoReady = useCallback((filename) => {
    const ref = videoRefs.current[filename];
    if (ref) {
      ref.muted = true;
      ref.play().catch(() => {});
    }
  }, []);

  return (
    <>
      <div className={`gallery-wrapper ${loaded ? 'gallery-visible' : ''}`}>
        <div className="bento-grid">
          {videos.map((video, i) => (
            <div
              key={video.filename}
              className={`bento-cell ${activeVideo === video.filename ? 'bento-active' : ''}`}
              style={{
                '--cols': video.size.cols,
                '--rows': video.size.rows,
                animationDelay: `${i * 80}ms`,
              }}
              onClick={() => handleTap(video.filename)}
            >
              <video
                ref={el => videoRefs.current[video.filename] = el}
                className="bento-video"
                loop
                playsInline
                muted
                onLoadedData={() => handleVideoReady(video.filename)}
              >
                <source src={video.url} type="video/mp4" />
                <source src={video.url} type="video/quicktime" />
              </video>

              {/* Gradient overlay */}
              <div className="bento-overlay" />

              {/* Sound indicator */}
              {activeVideo === video.filename && (
                <div className="sound-badge">
                  <span className="sound-bar" />
                  <span className="sound-bar" />
                  <span className="sound-bar" />
                </div>
              )}

              {/* Description */}
              {video.description && (
                <div className="bento-caption">
                  <p>{video.description}</p>
                </div>
              )}

              {/* Tap hint on inactive */}
              {activeVideo !== video.filename && (
                <div className="tap-hint">
                  <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <footer className="copyright">
        © {new Date().getFullYear()} Julian Sanchez LLC. All rights reserved.
      </footer>
    </>
  );
}
