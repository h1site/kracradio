'use client';
// src/pages/AuthResendVerification.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';

export default function AuthResendVerification() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' or 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setMessage('');

    try {
      const redirectTo = `${process.env.REACT_APP_URL || window.location.origin}/verify-email`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) {
        console.error('Error resending verification:', error);
      }

      setStatus('success');
      setMessage('Si un compte existe pour cet email, un nouveau lien de vérification a été envoyé.');
    } catch (error) {
      console.error('Unexpected error resending verification:', error);
      setStatus('success');
      setMessage('Si un compte existe pour cet email, un nouveau lien de vérification a été envoyé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title="Renvoyer l'email de vérification"
        description="Renvoyer l'email de vérification"
        path="/resend-verification"
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

        <h1 className="text-2xl font-extrabold mb-2 text-center">
          Renvoyer l'email de vérification
        </h1>
        <p className="text-sm text-text-secondary mb-6 text-center">
          Entrez votre adresse email pour recevoir un nouveau lien de vérification
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                  Email envoyé !
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {message}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm opacity-80">Email</span>
              <input
                type="email"
                required
                className="input w-full mt-1"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            {status === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {message}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 rounded-xl font-semibold"
            >
              {loading ? '...' : 'Renvoyer l\'email'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-2 text-sm text-center">
          <p className="text-text-secondary">
            💡 Astuce : Vérifiez votre dossier spam
          </p>
          <p>
            <Link href="/login" className="text-accent hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
