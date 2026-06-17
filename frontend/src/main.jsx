import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home        from './Home';
import Gallery     from './Gallery';
import DroneHelper from './DroneHelper';
import Admin       from './Admin';
import './styles.css';

function Nav() {
  const loc = useLocation();
  const active = path => loc.pathname === path ? 'nav-link-active' : '';

  return (
    <nav className={`nav`}>
      <Link to="/" className="nav-brand">
        <img src="/logo.png" alt="DRONIEN" className="nav-logo" />
        DRONIEN
      </Link>
      <div className="nav-links">
        <Link to="/gallery" className={`nav-link ${active('/gallery')}`}>Gallery</Link>
        <Link to="/drone"   className={`nav-link ${active('/drone')}`}>Drone CR</Link>
        <Link to="/admin"   className={`nav-link ${active('/admin')}`}>Admin</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"       element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/drone"  element={<DroneHelper />} />
        <Route path="/admin"  element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
