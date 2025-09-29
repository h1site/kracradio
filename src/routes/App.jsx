// src/routes/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { AudioProvider } from '../context/AudioPlayerContext';
import Header from '../components/Header';
import PlayerBar from '../components/PlayerBar';
import Home from '../pages/Home';
import ChannelPage from '../pages/Channel';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <I18nProvider defaultLang="fr">
        <AudioProvider>
          <div className="min-h-screen bg-white text-black dark:bg-brand-black dark:text-white">
            <Header theme={theme} setTheme={setTheme} />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/channel/:key" element={<ChannelPage />} />
            </Routes>
            <PlayerBar />
          </div>
        </AudioProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
