// src/routes/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PlayerBar from '../components/PlayerBar';
import Footer from '../components/Footer';

import Home from '../pages/Home';
import Channel from '../pages/Channel';

// Phase 2
import Articles from '../pages/Articles';
import Article from '../pages/Article';
import AuthLogin from '../pages/AuthLogin';
import AuthRegister from '../pages/AuthRegister';
import AuthConfirmEmail from '../pages/AuthConfirmEmail';
import ArticleEditor from '../pages/ArticleEditor';
import ProtectedRoute from '../components/ProtectedRoute';

// Menu
import Artists from '../pages/Artists';
import Podcasts from '../pages/Podcasts';
import PodcastsNew from '../pages/PodcastsNew';
import PodcastDetail from '../pages/PodcastDetail';
import Dashboard from '../pages/Dashboard';
import Spotify from '../pages/Spotify';
import Schedule from '../pages/Schedule';
import About from '../pages/About';
import Contact from '../pages/Contact';

import Profile from '../pages/Profile';
import MyArticles from '../pages/MyArticles';
import AdminPanel from '../pages/AdminPanel';

import { useUI } from '../context/UIContext';
import { useLocation } from 'react-router-dom';

export default function App() {
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const location = useLocation();
  const PLAYER_H = 64;

  // Pages pleine largeur sans marge (Schedule uniquement)
  const fullWidthPages = ['/schedule'];
  const isFullWidth = fullWidthPages.includes(location.pathname);

  const mainStyle = {
    paddingTop: isFullWidth ? '0px' : '20px',
    paddingLeft: isFullWidth ? '0px' : '30px',
    paddingBottom: PLAYER_H,
    marginLeft: isFullWidth ? 0 : (isDesktop ? (sidebarOpen ? sidebarWidth : 30) : 0),
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
          <Route path="/auth/confirm-email" element={<AuthConfirmEmail />} />

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
          <Route path="/podcasts" element={<PodcastsNew />} />
          <Route path="/podcasts/submit" element={<Podcasts />} />
          <Route path="/podcast/:id" element={<PodcastDetail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/spotify" element={<Spotify />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <Footer />
      <PlayerBar />
    </div>
  );
}
