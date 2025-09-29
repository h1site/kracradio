import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Header({ theme, setTheme }) {
  const { t, lang, setLang } = useI18n();
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#1e1e1e] text-white border-b border-[#2a2a2a]">
      <div className="w-full h-16 flex items-center justify-between px-5">
        {/* Logo (image blanche) */}
        <Link to="/" className="flex items-center">
          <img src="/logo-white.png" alt="Logo" className="h-10 w-auto object-contain" />
        </Link>

        {/* Actions à droite : Boutique, Donation, KEMP3, Langue, Switch thème */}
        <div className="flex items-center gap-3">
          {/* Notre Boutique */}
          <a
            href="https://store.kracradio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
            aria-label={`${t.site.store} (ouvre un nouvel onglet)`}
          >
            {t.site.store}
          </a>

          {/* Donation */}
          <a
            href="https://www.paypal.com/donate/?hosted_button_id=GUPL4K5WR3ZG4"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
            aria-label={`${t.site.donation} (ouvre un nouvel onglet)`}
          >
            {t.site.donation}
          </a>

          {/* KEMP3.app */}
          <a
            href="https://kemp3.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm"
            aria-label="KEMP3.app (ouvre un nouvel onglet)"
          >
            KEMP3.app
          </a>

          {/* Sélecteur de langue */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-white border border-white/20 rounded-md px-2 py-1 text-sm"
            aria-label="Sélecteur de langue"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>

          {/* Switch thème (soleil/lune) */}
          <button
            type="button"
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
            title={isDark ? 'Thème: Sombre' : 'Thème: Clair'}
            className="relative w-14 h-8 rounded-full border border-white/20 bg-white/10 transition"
          >
            {/* Lune (gauche) */}
            <svg
              viewBox="0 0 24 24"
              className={`absolute left-1 top-1.5 w-5 h-5 transition ${isDark ? 'opacity-100' : 'opacity-50'}`}
            >
              <path
                fill="currentColor"
                d="M12 2a1 1 0 0 1 .97 1.243A8 8 0 1 0 20.757 11a1 1 0 0 1 1.243-.97A10 10 0 1 1 12 2z"
              />
            </svg>
            {/* Soleil (droite) */}
            <svg
              viewBox="0 0 24 24"
              className={`absolute right-1 top-1.5 w-5 h-5 transition ${isDark ? 'opacity-50' : 'opacity-100'}`}
            >
              <path
                fill="currentColor"
                d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79l1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm8.83-2.95l1.79-1.79l-1.79-1.79l-1.79 1.79l1.79 1.79zM17.24 4.84l1.79 1.79l1.79-1.79l-1.79-1.79l-1.79 1.79zM20 13h3v-2h-3v2zM11 1v3h2V1h-2zM4.22 17.66l-1.79 1.79l1.79 1.79l1.79-1.79l-1.79-1.79zM12 6a6 6 0 1 0 .001 12A6 6 0 0 0 12 6z"
              />
            </svg>
            {/* Knob */}
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
