'use client';
// src/pages/AuthResetPassword.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';

export default function AuthResetPassword() {
  const { t, lang } = useI18n();
  const T = t?.auth || {};

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    setSuccess(false);

    try {
      const redirectTo = `${process.env.REACT_APP_URL || window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        console.error('Error sending password reset:', error);
      }
    } catch (e2) {
      console.error('Unexpected error sending password reset:', e2);
    } finally {
      // Always show success message to avoid email enumeration
      setSuccess(true);
      setLoading(false);
    }
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={T.resetPassword || 'Réinitialiser le mot de passe'}
        description="Réinitialiser votre mot de passe KracRadio"
        path="/reset-password"
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
          {T.resetPassword || 'Réinitialiser le mot de passe'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {T.resetPasswordDesc || 'Entrez votre adresse email pour recevoir un lien de réinitialisation.'}
        </p>

        {/* Info: Email viendra de Supabase */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <p className="text-blue-800 dark:text-blue-200 mb-1">
            {T.emailFromSupabase || '📧 Le courriel de confirmation viendra de Supabase (temporaire)'}
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-xs">
            {T.checkSpamFolder || '💡 N\'oubliez pas de vérifier votre dossier spam'}
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">
                    {T.resetPasswordSent || 'Email envoyé!'}
                  </p>
                  <p className="text-sm mt-1">
                    {T.resetPasswordSentDesc || 'Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 Astuce : Vérifiez votre dossier spam si vous ne voyez pas l'email.
              </p>
            </div>

            <Link
              href="/login"
              className="block text-center text-sm text-accent hover:text-accent-hover hover:underline"
            >
              {T.backToLogin || 'Retour à la connexion'}
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
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

            {err ? <div className="text-sm text-red-500">{err}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 rounded-xl font-semibold"
            >
              {loading ? '…' : (T.sendResetLink || 'Envoyer le lien')}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-accent hover:text-accent-hover hover:underline"
              >
                {T.backToLogin || 'Retour à la connexion'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
