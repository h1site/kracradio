// src/pages/AuthUpdatePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';

export default function AuthUpdatePassword() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const T = t?.auth || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErr(error.message || 'Erreur lors de la mise à jour du mot de passe');
      } else {
        // Succès - rediriger vers la page de login
        alert(T.passwordUpdated || 'Mot de passe mis à jour avec succès!');
        navigate('/auth/login');
      }
    } catch (e2) {
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
        path="/auth/update-password"
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
      </div>
    </main>
  );
}
