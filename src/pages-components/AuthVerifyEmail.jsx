'use client';
// src/pages/AuthVerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';

export default function AuthVerifyEmail() {
  const { t, lang } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const errorDescription = searchParams.get('error_description');
    const errorCode = searchParams.get('error_code');

    if (errorDescription || errorCode) {
      const decoded = decodeURIComponent(errorDescription || 'Une erreur s\'est produite');
      setStatus('error');
      setMessage(decoded);
      return;
    }

    setStatus('success');
    setMessage('Votre email a été vérifié avec succès !');

    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title="Vérification d'email"
        description="Vérifiez votre adresse email"
        path="/verify-email"
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

        <h1 className="text-2xl font-extrabold mb-4 text-center">
          Vérification d'email
        </h1>

        <div className="text-center py-8">
          {status === 'loading' && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-text-secondary">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                Succès !
              </p>
              <p className="text-text-secondary mb-4">{message}</p>
              <p className="text-sm text-text-secondary">
                Redirection vers la page de connexion...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Erreur
              </p>
              <p className="text-text-secondary mb-6">{message}</p>
              <Link
                href="/register"
                className="btn-primary inline-block"
              >
                Retour à l'inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
