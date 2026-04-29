import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Gallery from './Gallery';
import Admin from './Admin';
import './styles.css';

function Nav() {
  const loc = useLocation();
  return (
    <nav className="nav">
      <span className="nav-brand">Julian Sanchez</span>
      <Link to="/" style={{ color: loc.pathname === '/' ? '#fff' : undefined }}>Gallery</Link>
      <Link to="/admin" style={{ color: loc.pathname === '/admin' ? '#fff' : undefined }}>Admin</Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
