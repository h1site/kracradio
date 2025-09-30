import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function AuthRegister() {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await signUp(email, pwd);
    setBusy(false);
    if (error) setErr(error.message);
    else nav('/'); // selon tes settings email confirmation
  };

  return (
    <main className="h-full flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm card p-6 bg-white dark:bg-[#151515]">
        <h1 className="text-xl font-bold mb-4">{t?.auth?.register ?? 'Créer un compte'}</h1>
        {err && <div className="text-sm text-red-500 mb-2">{err}</div>}
        <label className="block text-sm mb-1">Email</label>
        <input className="w-full input mb-3" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <label className="block text-sm mb-1">{t?.auth?.password ?? 'Mot de passe'}</label>
        <input className="w-full input mb-4" type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} required />
        <button className="btn-primary w-full h-10" disabled={busy}>{busy ? '...' : 'Créer le compte'}</button>
        <p className="text-xs mt-3 opacity-70">
          {t?.auth?.already ?? 'Déjà inscrit ?'}{' '}
          <Link className="underline" to="/auth/login">{t?.auth?.login ?? 'Connexion'}</Link>
        </p>
      </form>
    </main>
  );
}
