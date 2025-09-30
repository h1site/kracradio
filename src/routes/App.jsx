// src/routes/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';

import Home from '../pages/Home';
import Channel from '../pages/Channel';

// Phase 2
import Articles from '../pages/Articles';
import Article from '../pages/Article';
import AuthLogin from '../pages/AuthLogin';
import AuthRegister from '../pages/AuthRegister';
import ArticleEditor from '../pages/ArticleEditor';
import ProtectedRoute from '../components/ProtectedRoute';

// Menu
import Artists from '../pages/Artists';
import Podcasts from '../pages/Podcasts';
import Spotify from '../pages/Spotify';
import Schedule from '../pages/Schedule';
import About from '../pages/About';
import Contact from '../pages/Contact';

import Profile from '../pages/Profile';
import MyArticles from '../pages/MyArticles';

import { useUI } from '../context/UIContext';

export default function App() {
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const PLAYER_H = 64;

  const mainStyle = {
    paddingTop: 0,
    paddingBottom: PLAYER_H,
    marginLeft: isDesktop ? (sidebarOpen ? sidebarWidth : 0) : 0,
    transition: 'margin-left 300ms ease',
    minHeight: '100vh',
  };

  return (
    <div className="bg-white text-black dark:bg-[#1e1e1e] dark:text-white">
      <Header />
      <Sidebar />

      <main style={mainStyle}>
        <Routes>
          {/* Accueil + chaînes */}
          <Route path="/" element={<Home />} />
          <Route path="/channel/:key" element={<Channel />} />

          {/* Articles (public) */}
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:slug" element={<Article />} />

          {/* Auth */}
          <Route path="/auth/login" element={<AuthLogin />} />
          <Route path="/auth/register" element={<AuthRegister />} />

          {/* Profil & dashboard (protégés) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/articles/mine"
            element={
              <ProtectedRoute>
                <MyArticles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/articles/edit"
            element={
              <ProtectedRoute>
                <ArticleEditor />
              </ProtectedRoute>
            }
          />
          {/* Édition par ID */}
          <Route
            path="/dashboard/articles/edit/:id"
            element={
              <ProtectedRoute>
                <ArticleEditor />
              </ProtectedRoute>
            }
          />

          {/* Autres pages */}
          <Route path="/artists" element={<Artists />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/spotify" element={<Spotify />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <PlayerBar />
    </div>
  );
}
