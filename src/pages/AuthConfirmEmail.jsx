import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

const STRINGS = {
  fr: {
    title: 'Vérifiez votre email',
    message: 'Un email de confirmation a été envoyé à votre adresse.',
    instruction: 'Veuillez cliquer sur le lien dans l\'email pour activer votre compte.',
    checkSpam: 'Si vous ne voyez pas l\'email, vérifiez votre dossier spam.',
    backToLogin: '← Retour à la connexion',
  },
  en: {
    title: 'Check your email',
    message: 'A confirmation email has been sent to your address.',
    instruction: 'Please click on the link in the email to activate your account.',
    checkSpam: 'If you don\'t see the email, check your spam folder.',
    backToLogin: '← Back to login',
  },
  es: {
    title: 'Revisa tu correo',
    message: 'Se ha enviado un correo de confirmación a tu dirección.',
    instruction: 'Por favor, haz clic en el enlace del correo para activar tu cuenta.',
    checkSpam: 'Si no ves el correo, revisa tu carpeta de spam.',
    backToLogin: '← Volver al inicio de sesión',
  },
};

export default function AuthConfirmEmail() {
  const { lang } = useI18n();
  const L = STRINGS[lang] || STRINGS.fr;

  return (
    <main className="h-full flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-8 bg-white dark:bg-[#151515] text-center">
        {/* Logo */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-md mx-auto">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="w-16 h-16"
            />
          </div>
        </div>

        {/* Icône email */}
        <div className="mb-6">
          <svg
            viewBox="0 0 24 24"
            className="w-20 h-20 mx-auto text-red-600 dark:text-red-500"
            fill="currentColor"
          >
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold mb-4">{L.title}</h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          {L.message}
        </p>

        <p className="text-gray-600 dark:text-gray-400 mb-3">
          {L.instruction}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          {L.checkSpam}
        </p>

        {/* Bouton retour */}
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-red-600 dark:text-red-500 hover:underline"
        >
          {L.backToLogin}
        </Link>
      </div>
    </main>
  );
}
