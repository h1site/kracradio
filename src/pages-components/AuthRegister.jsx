'use client';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../i18n';

const PASSWORD_REQUIREMENTS = {
  fr: {
    title: 'Le mot de passe doit contenir :',
    minLength: 'Au moins 6 caractères',
    uppercase: 'Au moins 1 lettre majuscule',
    number: 'Au moins 1 chiffre',
    special: 'Au moins 1 symbole (!@#$%^&*)',
    error: 'Le mot de passe ne respecte pas les critères de sécurité',
  },
  en: {
    title: 'Password must contain:',
    minLength: 'At least 6 characters',
    uppercase: 'At least 1 uppercase letter',
    number: 'At least 1 number',
    special: 'At least 1 symbol (!@#$%^&*)',
    error: 'Password does not meet security requirements',
  },
  es: {
    title: 'La contraseña debe contener:',
    minLength: 'Al menos 6 caracteres',
    uppercase: 'Al menos 1 letra mayúscula',
    number: 'Al menos 1 número',
    special: 'Al menos 1 símbolo (!@#$%^&*)',
    error: 'La contraseña no cumple con los requisitos de seguridad',
  },
};

export default function AuthRegister() {
  const { t, lang } = useI18n();
  const { signUp, signInWithGoogle } = useAuth();
  const nav = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const PASS_REQ = PASSWORD_REQUIREMENTS[lang] || PASSWORD_REQUIREMENTS.fr;

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
      valid: hasMinLength && hasUppercase && hasNumber && hasSpecial,
      hasMinLength,
      hasUppercase,
      hasNumber,
      hasSpecial,
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);

    // Valider le mot de passe
    const validation = validatePassword(pwd);
    if (!validation.valid) {
      setErr(PASS_REQ.error);
      setBusy(false);
      return;
    }

    try {
      await signUp({ email, password: pwd });
      nav.push('/settings'); // Rediriger vers settings après inscription
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErr(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(e.message || 'Erreur de connexion avec Google');
      setLoadingGoogle(false);
    }
  };

  return (
    <main className="h-full flex items-center justify-center px-4 pt-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm card p-6 bg-white dark:bg-[#151515]">
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

        <h1 className="text-xl font-bold mb-4">{t?.auth?.register ?? 'Créer un compte'}</h1>

        {err && <div className="text-sm text-red-500 mb-2">{err}</div>}

        <label className="block text-sm mb-1">Email</label>
        <input className="w-full input mb-3" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label className="block text-sm mb-1">{t?.auth?.password ?? 'Mot de passe'}</label>
        <input className="w-full input mb-2" type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} required />

        {/* Exigences du mot de passe */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs">
          <p className="font-semibold mb-2 text-gray-700 dark:text-gray-300">{PASS_REQ.title}</p>
          <ul className="space-y-1">
            <li className={pwd.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              {pwd.length >= 6 ? '✓' : '○'} {PASS_REQ.minLength}
            </li>
            <li className={/[A-Z]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              {/[A-Z]/.test(pwd) ? '✓' : '○'} {PASS_REQ.uppercase}
            </li>
            <li className={/[0-9]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              {/[0-9]/.test(pwd) ? '✓' : '○'} {PASS_REQ.number}
            </li>
            <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) ? '✓' : '○'} {PASS_REQ.special}
            </li>
          </ul>
        </div>

        <button className="btn-primary w-full h-10" disabled={busy || loadingGoogle}>{busy ? '...' : 'Créer le compte'}</button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#151515] text-gray-500">
              {t?.auth?.orContinueWith || 'Ou continuer avec'}
            </span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy || loadingGoogle}
          className="w-full h-10 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loadingGoogle ? 'Connexion...' : (t?.auth?.continueWithGoogle || 'Continuer avec Google')}
        </button>

        <p className="text-xs mt-4 opacity-70 text-center">
          {t?.auth?.already ?? 'Déjà inscrit ?'}{' '}
          <Link className="underline" href="/login">{t?.auth?.login ?? 'Connexion'}</Link>
        </p>
      </form>
    </main>
  );
}
