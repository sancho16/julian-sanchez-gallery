import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Gallery from './Gallery';
import Admin from './Admin';
import './styles.css';

function App() {
  const location = useLocation();
  const isGallery = location.pathname === '/';
  
  return (
    <>
      <nav className="nav">
        <Link to="/">Gallery</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/admin" element={
          <>
            <Admin />
            <footer className="copyright">
              © {new Date().getFullYear()} Julian Sanchez LLC. All rights reserved.
            </footer>
          </>
        } />
      </Routes>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
