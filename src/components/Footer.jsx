'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../i18n';
import { useUI } from '../context/UIContext';
import { LeaderboardAd } from './ads';

const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const STRINGS = {
  fr: {
    newsletter: {
      title: 'Abonnez-vous à notre newsletter',
      subtitle: 'Restez informé des nouveautés musicales, podcasts et événements exclusifs',
      placeholder: 'Votre adresse email',
      button: 'S\'abonner',
      success: 'Merci! Vous êtes inscrit.',
      error: 'Erreur. Réessayez.',
      invalidEmail: 'Email invalide.',
    },
    copyright: '© 2025 KracRadio. Tous droits réservés.',
  },
  en: {
    newsletter: {
      title: 'Subscribe to our newsletter',
      subtitle: 'Stay updated on music news, podcasts and exclusive events',
      placeholder: 'Your email address',
      button: 'Subscribe',
      success: 'Thank you! You are subscribed.',
      error: 'Error. Try again.',
      invalidEmail: 'Invalid email.',
    },
    copyright: '© 2025 KracRadio. All rights reserved.',
  },
  es: {
    newsletter: {
      title: 'Suscríbete a nuestro boletín',
      subtitle: 'Mantente al día con noticias musicales, podcasts y eventos exclusivos',
      placeholder: 'Tu dirección de correo',
      button: 'Suscribirse',
      success: '¡Gracias! Estás suscrito.',
      error: 'Error. Inténtalo de nuevo.',
      invalidEmail: 'Correo inválido.',
    },
    copyright: '© 2025 KracRadio. Todos los derechos reservados.',
  }
};

export default function Footer() {
  const { lang } = useI18n();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const L = STRINGS[lang] || STRINGS.fr;

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: L.newsletter.invalidEmail });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('https://gpcedzaflhiucwyjgdai.supabase.co/functions/v1/newsletter-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email, lang }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: L.newsletter.success });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || L.newsletter.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: L.newsletter.error });
    } finally {
      setLoading(false);
    }
  };

  const footerStyle = {
    marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
    transition: 'margin-left 300ms ease',
  };

  return (
    <footer
      className="bg-black"
      style={footerStyle}
    >
      <div className="px-8 py-12">
        {/* AD - Leaderboard dans le footer */}
        <div className="mx-auto max-w-4xl mb-12">
          <LeaderboardAd />
        </div>

        {/* Newsletter Section */}
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-2 text-2xl font-bold uppercase tracking-wide text-white">
            {L.newsletter.title}
          </h3>
          <p className="mb-6 text-sm text-gray-400">
            {L.newsletter.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={L.newsletter.placeholder}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-gray-600 dark:bg-white dark:text-gray-900 dark:placeholder-gray-400"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '...' : L.newsletter.button}
            </button>
          </form>

          {message && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          {L.copyright}
        </div>
      </div>
    </footer>
  );
}
