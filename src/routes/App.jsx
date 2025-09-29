// src/routes/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Header from '../components/Header';
import PlayerBar from '../components/PlayerBar';
import Sidebar from '../components/Sidebar';

import Home from '../pages/Home';
import Channel from '../pages/Channel';

import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n';
import { AudioPlayerProvider } from '../context/AudioPlayerContext';
import { UIProvider, useUI } from '../context/UIContext';

function Shell() {
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();
  const ml = isDesktop && sidebarOpen ? sidebarWidth : 0;

  return (
    <>
      <Header />
      {isDesktop && <Sidebar />}

      {/* pas de pt-16 ici pour éviter double marge, les pages gèrent leur padding */}
      <main className="pt-0" style={{ marginLeft: isDesktop ? ml : 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/channel/:key" element={<Channel />} />

          {/* Pages placeholder */}
          <Route path="/articles" element={<div className="container-max py-6">Articles</div>} />
          <Route path="/artists" element={<div className="container-max py-6">Artistes</div>} />
          <Route path="/podcasts" element={<div className="container-max py-6">Podcasts</div>} />
          <Route path="/spotify" element={<div className="container-max py-6">Spotify Playlist</div>} />
          <Route path="/schedule" element={<div className="container-max py-6">Horaire</div>} />
          <Route path="/about" element={<div className="container-max py-6">À propos</div>} />
          <Route path="/contact" element={<div className="container-max py-6">Contact</div>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <PlayerBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <ThemeProvider>
          <I18nProvider>
            <AudioPlayerProvider>
              <UIProvider>
                <Shell />
              </UIProvider>
            </AudioPlayerProvider>
          </I18nProvider>
        </ThemeProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}
