import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function AppCard({ to, icon, title, subtitle, color, delay }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px) scale(0.96)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Link to={to} className="home-card" ref={ref} style={{ '--card-color': color }}>
      <div className="home-card-glow" />
      <div className="home-card-icon">
        <span className="home-card-icon-inner">{icon}</span>
      </div>
      <div className="home-card-body">
        <h2 className="home-card-title">{title}</h2>
        <p className="home-card-sub">{subtitle}</p>
      </div>
      <div className="home-card-arrow">›</div>
      <div className="home-card-dot" />
    </Link>
  );
}

export default function Home() {
  const headRef = useRef(null);
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(-16px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="home-wrapper">
      {/* Animated background particles */}
      <div className="home-bg" aria-hidden="true">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="home-particle" style={{
            left: `${Math.random() * 100}%`,
            top:  `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width:  `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            opacity: 0.15 + Math.random() * 0.2,
          }} />
        ))}
      </div>

      <div className="home-content">
        {/* Header */}
        <div className="home-header" ref={headRef}>
          <h1 className="home-title">Julian Sanchez</h1>
          <p className="home-tagline">Select an experience</p>
        </div>

        {/* Cards */}
        <div className="home-cards">
          <AppCard
            to="/gallery"
            icon="▶"
            title="Video Showcase"
            subtitle="Drone footage gallery — 4K aerial cinematography"
            color="#0ea5e9"
            delay={220}
          />
          <AppCard
            to="/drone"
            icon="✈"
            title="Drone Helper CR"
            subtitle="Costa Rica flight planner — real-time weather & regulations"
            color="#10b981"
            delay={400}
          />
        </div>
      </div>

      <footer className="copyright">
        © {new Date().getFullYear()} Julian Sanchez LLC. All rights reserved.
      </footer>
    </div>
  );
}
