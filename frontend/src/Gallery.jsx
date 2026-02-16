import React, { useState, useEffect, useRef } from 'react';

export default function Gallery() {
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const videoRefs = useRef({});
  const containerRef = useRef(null);

  const generateRandomPosition = (index, total, containerWidth, containerHeight) => {
    // Create more varied sizes
    const sizeVariants = [
      { width: 280, height: 160 },   // small
      { width: 350, height: 200 },   // medium-small
      { width: 420, height: 240 },   // medium
      { width: 500, height: 280 },   // medium-large
      { width: 600, height: 340 },   // large
      { width: 450, height: 800 },   // tall portrait
      { width: 380, height: 680 },   // medium portrait
    ];
    
    const size = sizeVariants[Math.floor(Math.random() * sizeVariants.length)];
    
    // Calculate safe boundaries
    const maxX = Math.max(containerWidth - size.width - 40, 0);
    const maxY = Math.max(containerHeight - size.height - 40, 0);
    
    // Generate random position with some spacing
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    
    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
    };
  };

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        const container = containerRef.current;
        if (!container) return;
        
        const containerWidth = window.innerWidth - 80;
        const containerHeight = Math.max(window.innerHeight * 1.5, data.length * 200);
        
        // Assign random positions and sizes
        const videosWithLayout = data.map((video, index) => ({
          ...video,
          style: generateRandomPosition(index, data.length, containerWidth, containerHeight)
        }));
        
        setVideos(videosWithLayout);
        
        // Set container height
        container.style.minHeight = `${containerHeight}px`;
      });
  }, []);

  const handleVideoClick = (filename) => {
    // Mute all videos
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      if (ref) {
        ref.muted = key !== filename;
      }
    });
    
    setActiveVideo(filename);
  };

  const handleVideoLoad = (filename) => {
    const ref = videoRefs.current[filename];
    if (ref) {
      ref.muted = true;
      ref.play().catch(() => {});
    }
  };

  return (
    <>
      <div className="gallery-container">
        <div className="masonry-gallery" ref={containerRef}>
          {videos.map(video => (
            <div 
              key={video.filename} 
              className={`video-card ${activeVideo === video.filename ? 'active' : ''}`}
              style={video.style}
              onClick={() => handleVideoClick(video.filename)}
            >
              <video 
                ref={el => videoRefs.current[video.filename] = el}
                className="video-player"
                loop
                playsInline
                muted
                onLoadedData={() => handleVideoLoad(video.filename)}
              >
                <source src={video.url} type="video/mp4" />
                <source src={video.url} type="video/quicktime" />
              </video>
              <div className="video-info">
                <p className="video-description">{video.description}</p>
              </div>
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
