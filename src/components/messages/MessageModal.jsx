// src/components/messages/MessageModal.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

const STRINGS = {
  fr: {
    sendMessage: 'Envoyer un message',
    to: 'À',
    placeholder: 'Écrivez votre message...',
    send: 'Envoyer',
    sending: 'Envoi...',
    close: 'Fermer',
    success: 'Message envoyé!',
    error: 'Erreur lors de l\'envoi',
    loginRequired: 'Connectez-vous pour envoyer un message',
  },
  en: {
    sendMessage: 'Send a message',
    to: 'To',
    placeholder: 'Write your message...',
    send: 'Send',
    sending: 'Sending...',
    close: 'Close',
    success: 'Message sent!',
    error: 'Error sending message',
    loginRequired: 'Log in to send a message',
  },
  es: {
    sendMessage: 'Enviar un mensaje',
    to: 'Para',
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    sending: 'Enviando...',
    close: 'Cerrar',
    success: '¡Mensaje enviado!',
    error: 'Error al enviar el mensaje',
    loginRequired: 'Inicia sesión para enviar un mensaje',
  },
};

export default function MessageModal({ isOpen, onClose, recipient }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const L = STRINGS[lang] || STRINGS.fr;
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
    // Reset state when modal opens
    if (isOpen) {
      setMessage('');
      setStatus(null);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSend = async () => {
    if (!message.trim() || !user || !recipient?.id) return;

    setSending(true);
    setStatus(null);

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: recipient.id,
        content: message.trim(),
      });

      if (error) throw error;

      setStatus({ type: 'success', text: L.success });
      setMessage('');

      // Close modal after 1.5s on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus({ type: 'error', text: L.error });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {L.sendMessage}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Recipient info */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{L.to}:</span>
          <div className="flex items-center gap-2">
            {recipient?.avatar_url ? (
              <img
                src={recipient.avatar_url}
                alt={recipient.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {recipient?.username || 'Utilisateur'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!user ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-4">
              {L.loginRequired}
            </p>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={L.placeholder}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                disabled={sending}
              />

              {/* Status message */}
              {status && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  status.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {status.text}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {user && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {L.close}
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {L.sending}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {L.send}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
