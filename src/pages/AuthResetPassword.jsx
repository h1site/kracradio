// src/pages/AuthResetPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setErr(error.message || 'Erreur lors de l\'envoi du lien');
      } else {
        setSuccess(true);
      }
    } catch (e2) {
      setErr(e2.message || 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={T.resetPassword || 'Réinitialiser le mot de passe'}
        description="Réinitialiser votre mot de passe KracRadio"
        path="/auth/reset-password"
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {T.resetPasswordDesc || 'Entrez votre adresse email pour recevoir un lien de réinitialisation.'}
        </p>

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

            <Link
              to="/auth/login"
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
                to="/auth/login"
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
