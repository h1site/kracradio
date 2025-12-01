'use client';
import RedirectTo from '../components/RedirectTo';
// src/pages/AuthLogin.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';

export default function AuthLogin() {
  const { t, lang } = useI18n();
  const { user, signIn, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const T = t?.auth || {}; // <-- évite "Cannot read ... 'login'"

  // Get redirect URL from query params (Next.js way)
  const redirectTo = searchParams?.get('from') || '/profile';
  const initialError = searchParams?.get('error') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [err, setErr] = useState(initialError);
  const [showResendVerification, setShowResendVerification] = useState(false);

  if (user) return <RedirectTo href={redirectTo} replace />;

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

  async function handleGoogleSignIn() {
    setLoadingGoogle(true);
    setErr('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(e.message || 'Erreur de connexion avec Google');
      setLoadingGoogle(false);
    }
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={T.login || 'Log in'}
        description={t?.meta?.homeDesc || 'Login'}
        path="/login"
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
                href="/reset-password"
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
                      href="/resend-verification"
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
            disabled={loading || loadingGoogle}
            className="btn-primary w-full h-11 rounded-xl font-semibold"
          >
            {loading ? '…' : (T.login || 'Log in')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#1e1e1e] text-gray-500">
              {T.orContinueWith || 'Ou continuer avec'}
            </span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || loadingGoogle}
          className="w-full h-11 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loadingGoogle ? 'Connexion...' : (T.continueWithGoogle || 'Continuer avec Google')}
        </button>

        <div className="mt-4 text-sm text-center">
          {T.noAccount || 'No account?'}{' '}
          <Link href="/register" className="underline">
            {T.register || 'Create account'}
          </Link>
        </div>
      </div>
    </main>
  );
}
