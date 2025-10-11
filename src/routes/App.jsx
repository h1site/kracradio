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
import AuthResetPassword from '../pages/AuthResetPassword';
import AuthUpdatePassword from '../pages/AuthUpdatePassword';
import AuthVerifyEmail from '../pages/AuthVerifyEmail';
import AuthResendVerification from '../pages/AuthResendVerification';
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
import PodcastEditor from '../pages/PodcastEditor';
import CommunityDashboard from '../pages/CommunityDashboard';
import PublicProfile from '../pages/PublicProfile';

import { useUI } from '../context/UIContext';
import { useLocation } from 'react-router-dom';

export default function App() {
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const location = useLocation();
  const PLAYER_H = 64;

  // Pages pleine largeur sans marge (Schedule uniquement)
  const fullWidthPages = ['/schedule'];
  const isFullWidth = fullWidthPages.includes(location.pathname) || location.pathname.startsWith('/article/');

  const mainStyle = {
    paddingTop: isFullWidth ? '0px' : '20px',
    paddingLeft: isFullWidth ? '0px' : (isDesktop ? '30px' : '0px'),
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
          <Route path="/auth/verify-email" element={<AuthVerifyEmail />} />
          <Route path="/auth/resend-verification" element={<AuthResendVerification />} />
          <Route path="/auth/reset-password" element={<AuthResetPassword />} />
          <Route path="/auth/update-password" element={<AuthUpdatePassword />} />

          {/* Profil personnel (protégé, route exacte) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Alias /settings vers /profile */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Profil public par slug/username (après /profile exacte) */}
          <Route path="/profile/:username" element={<PublicProfile />} />
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

          {/* Podcasts - Création et édition */}
          <Route
            path="/dashboard/podcasts/edit"
            element={
              <ProtectedRoute>
                <PodcastEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/podcasts/edit/:id"
            element={
              <ProtectedRoute>
                <PodcastEditor />
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
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityDashboard />
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
