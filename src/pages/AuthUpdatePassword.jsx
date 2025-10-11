// src/pages/AuthUpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';
import { verifyPasswordResetToken, markPasswordResetTokenUsed } from '../lib/emailService';

export default function AuthUpdatePassword() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const T = t?.auth || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  const [tokenData, setTokenData] = useState(null);

  // Check token on mount
  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      // No token - could be from Supabase auth flow
      setTokenValid(true);
      return;
    }

    // Verify the token
    verifyPasswordResetToken(token)
      .then((data) => {
        setTokenValid(true);
        setTokenData(data);
      })
      .catch((error) => {
        console.error('Token verification failed:', error);
        setTokenValid(false);
        setErr(error.message || 'Token invalide ou expiré');
      });
  }, [searchParams]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');

    if (password !== confirmPassword) {
      setErr(T.passwordMismatch || 'Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErr(T.passwordTooShort || 'Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      if (tokenData) {
        // Using our custom token system
        // Call Edge Function to update password with admin privileges
        const { data, error } = await supabase.functions.invoke('reset-password', {
          body: {
            userId: tokenData.userId,
            newPassword: password
          }
        });

        if (error || !data?.success) {
          console.error('Error calling reset-password function:', error);
          setErr('Impossible de mettre à jour le mot de passe. Veuillez réessayer.');
          return;
        }

        // Mark token as used
        await markPasswordResetTokenUsed(tokenData.tokenId);

        alert(T.passwordUpdated || 'Mot de passe mis à jour avec succès!');
        navigate('/auth/login');
      } else {
        // Using Supabase auth flow (legacy)
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          setErr(error.message || 'Erreur lors de la mise à jour du mot de passe');
        } else {
          alert(T.passwordUpdated || 'Mot de passe mis à jour avec succès!');
          navigate('/auth/login');
        }
      }
    } catch (e2) {
      console.error('Error updating password:', e2);
      setErr(e2.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={T.updatePassword || 'Mettre à jour le mot de passe'}
        description="Mettre à jour votre mot de passe KracRadio"
        path="/auth/update-password"
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

        <h1 className="text-2xl font-extrabold mb-2">
          {T.updatePassword || 'Nouveau mot de passe'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {T.updatePasswordDesc || 'Choisissez un nouveau mot de passe pour votre compte.'}
        </p>

        {tokenValid === null ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Vérification du lien...</p>
          </div>
        ) : tokenValid === false ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Lien invalide</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{err}</p>
                </div>
              </div>
            </div>
            <Link
              to="/auth/reset-password"
              className="btn-primary w-full h-11 rounded-xl font-semibold inline-block text-center"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm opacity-80">{T.newPassword || 'Nouveau mot de passe'}</span>
            <input
              type="password"
              required
              className="input w-full mt-1"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
          </label>

          <label className="block">
            <span className="text-sm opacity-80">{T.confirmPassword || 'Confirmer le mot de passe'}</span>
            <input
              type="password"
              required
              className="input w-full mt-1"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
          </label>

          {err ? <div className="text-sm text-red-500">{err}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 rounded-xl font-semibold"
          >
            {loading ? '…' : (T.updatePassword || 'Mettre à jour')}
          </button>
        </form>
        )}
      </div>
    </main>
  );
}
