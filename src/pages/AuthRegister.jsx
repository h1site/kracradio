import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

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
      nav('/auth/confirm-email'); // Rediriger vers la page de confirmation
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
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

        {/* Info: Email viendra de Supabase */}
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <p className="text-blue-800 dark:text-blue-200 mb-1">
            {t?.auth?.emailFromSupabase ?? '📧 Le courriel de confirmation viendra de Supabase (temporaire)'}
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-xs">
            {t?.auth?.checkSpamFolder ?? '💡 N\'oubliez pas de vérifier votre dossier spam'}
          </p>
        </div>

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

        <button className="btn-primary w-full h-10" disabled={busy}>{busy ? '...' : 'Créer le compte'}</button>
        <p className="text-xs mt-3 opacity-70">
          {t?.auth?.already ?? 'Déjà inscrit ?'}{' '}
          <Link className="underline" to="/auth/login">{t?.auth?.login ?? 'Connexion'}</Link>
        </p>
      </form>
    </main>
  );
}
