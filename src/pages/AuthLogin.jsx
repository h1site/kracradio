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
  const [showResendVerification, setShowResendVerification] = useState(false);

  const from = (location.state && location.state.from) || '/profile';
  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    setShowResendVerification(false);
    try {
      const { error } = await signIn({ email, password });
      if (error) setErr(error.message || 'Error');
    } catch (e2) {
      const errorMsg = e2.message || 'Error';
      if (errorMsg === 'EMAIL_NOT_VERIFIED') {
        setErr('Votre email n\'a pas été vérifié. Veuillez vérifier votre boîte de réception et votre dossier spam.');
        setShowResendVerification(true);
      } else {
        setErr(errorMsg);
      }
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
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm opacity-80">{T.password || 'Password'}</span>
              <Link
                to="/auth/reset-password"
                className="text-xs text-accent hover:text-accent-hover hover:underline"
              >
                {T.forgotPassword || 'Mot de passe oublié?'}
              </Link>
            </div>
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

          {err ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200">{err}</p>
                  {showResendVerification && (
                    <Link
                      to="/auth/resend-verification"
                      className="text-sm text-accent hover:underline mt-2 inline-block"
                    >
                      Renvoyer l'email de vérification
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : null}

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
