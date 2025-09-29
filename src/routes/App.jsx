// src/routes/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import MobileMenu from '../components/MobileMenu';

import Home from '../pages/Home';
import Channel from '../pages/Channel';
import Articles from '../pages/Articles';
import Artists from '../pages/Artists';
import Podcasts from '../pages/Podcasts';
import Spotify from '../pages/Spotify';
import Schedule from '../pages/Schedule';
import About from '../pages/About';
import Contact from '../pages/Contact';

import { useTheme } from '../context/ThemeContext';
import { useUI } from '../context/UIContext';

export default function App() {
  const { theme, setTheme } = useTheme();
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const appBg = theme === 'dark' ? 'bg-[#141414] text-white' : 'bg-[#e9eaee] text-black';

  // Home & Channel: pas de pt-16 sous le header
  const noTopPad = location.pathname === '/' || location.pathname.startsWith('/channel/');
  const topPadClass = noTopPad ? 'pt-0' : 'pt-16';

  // Réserves fixes
  const HEADER = 64;  // h-16
  const PLAYER = 64;  // h-16

  // Si on met un padding-top (pages autres que home/channel), on le soustrait à la hauteur calculée
  const reservedTop = noTopPad ? 0 : HEADER;

  // Décalage gauche animé quand la sidebar est ouverte en desktop
  const marginLeft = isDesktop && sidebarOpen ? sidebarWidth : 0;

  // Hauteur stricte : viewport - header - player - (éventuel padding-top)
  const mainStyle = {
    marginLeft,
    height: `calc(100vh - ${HEADER + PLAYER + reservedTop}px)`,
    overflow: 'hidden', // pas de scroll global ici
  };

  return (
    <div className={`min-h-screen ${appBg}`}>
      <Header theme={theme} setTheme={setTheme} onOpenMenu={() => setMobileMenuOpen(true)} />
      <Sidebar />

      {/* content-shift = transition de margin-left */}
      <main className={`content-shift ${topPadClass}`} style={mainStyle}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/channel/:key" element={<Channel />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/spotify" element={<Spotify />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <PlayerBar />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}
