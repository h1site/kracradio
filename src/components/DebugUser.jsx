// src/components/DebugUser.jsx - Composant temporaire pour debug
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function DebugUser() {
  const { user } = useAuth();

  if (!user) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copié dans le presse-papier!');
  };

  return (
    <div className="fixed bottom-4 left-4 bg-accent/90 text-bg-primary p-4 rounded-lg shadow-xl z-50 max-w-md">
      <h3 className="font-bold mb-2">🐛 Debug Info</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>ID:</strong>
          <div className="flex items-center gap-2">
            <code className="bg-black/20 px-2 py-1 rounded text-xs break-all">
              {user.id}
            </code>
            <button
              onClick={() => copyToClipboard(user.id)}
              className="px-2 py-1 bg-bg-primary/20 hover:bg-bg-primary/30 rounded text-xs"
            >
              📋 Copier
            </button>
          </div>
        </div>

        <div>
          <strong>Email:</strong> {user.email}
        </div>

        <div>
          <strong>URL Profil:</strong>
          <a
            href={`/profile/${user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs underline mt-1"
          >
            /profile/{user.id}
          </a>
        </div>
      </div>
    </div>
  );
}
