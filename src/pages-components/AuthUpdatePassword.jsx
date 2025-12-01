'use client';
// src/pages/AuthUpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';

export default function AuthUpdatePassword() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const T = t?.auth || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Error retrieving session:', error);
      }
      if (data?.session) {
        setHasRecoverySession(true);
      }
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          setHasRecoverySession(true);
        }
        setCheckingSession(false);
      }
      if (event === 'SIGNED_OUT') {
        setHasRecoverySession(false);
      }
    });

    return () => {
      active = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

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
      if (!hasRecoverySession) {
        setErr('Lien invalide ou expiré. Demandez un nouveau lien.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        setErr(error.message || 'Erreur lors de la mise à jour du mot de passe');
      } else {
        await supabase.auth.signOut();
        alert(T.passwordUpdated || 'Mot de passe mis à jour avec succès!');
        router.push('/login');
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
        path="/update-password"
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

        {checkingSession ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Vérification du lien...</p>
          </div>
        ) : hasRecoverySession ? (
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
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Lien invalide</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien pour continuer.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/reset-password"
              className="btn-primary w-full h-11 rounded-xl font-semibold inline-block text-center"
            >
              Demander un nouveau lien
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
