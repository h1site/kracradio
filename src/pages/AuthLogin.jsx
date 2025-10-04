// src/pages/AuthLogin.jsx
import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';

export default function AuthLogin() {
  const { t, lang } = useI18n();
  const { user, signIn } = useAuth();
  const location = useLocation();

  const T = t?.auth || {}; // <-- évite "Cannot read ... 'login'"

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const from = (location.state && location.state.from) || '/profile';
  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const { error } = await signIn({ email, password });
      if (error) setErr(error.message || 'Error');
    } catch (e2) {
      setErr(e2.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={T.login || 'Log in'}
        description={t?.meta?.homeDesc || 'Login'}
        path="/auth/login"
        type="website"
      />

      <div className="max-w-md mx-auto card p-5 dark:bg-[#1e1e1e]">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-md">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="w-16 h-16"
            />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold mb-4">{T.login || 'Log in'}</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm opacity-80">{T.email || 'Email'}</span>
            <input
              type="email"
              required
              className="input w-full mt-1"
              placeholder={T.email || 'Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-sm opacity-80">{T.password || 'Password'}</span>
            <input
              type="password"
              required
              className="input w-full mt-1"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {err ? <div className="text-sm text-red-500">{err}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 rounded-xl font-semibold"
          >
            {loading ? '…' : (T.login || 'Log in')}
          </button>
        </form>

        <div className="mt-4 text-sm">
          {T.noAccount || 'No account?'}{' '}
          <Link to="/auth/register" className="underline">
            {T.register || 'Create account'}
          </Link>
        </div>
      </div>
    </main>
  );
}
