// src/components/community/MusicLinksManager.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMusicLinks, useManageMusicLinks } from '../../hooks/useCommunity';

const PLATFORMS = [
  { id: 'spotify', name: 'Spotify', icon: '🎵', color: 'text-green-400' }
];

export default function MusicLinksManager() {
  const { user } = useAuth();
  const { musicLinks, loading, refetch } = useMusicLinks(user?.id);
  const { addMusicLink, removeMusicLink, loading: managing } = useManageMusicLinks();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'spotify',
    url: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.url.trim()) {
      setMessage({ type: 'error', text: '❌ Veuillez entrer une URL' });
      return;
    }

    // Validation basique de l'URL
    try {
      new URL(formData.url);
    } catch {
      setMessage({ type: 'error', text: '❌ URL invalide' });
      return;
    }

    // Vérifier qu'il n'y a pas déjà un lien
    if (musicLinks.length > 0) {
      setMessage({ type: 'error', text: '❌ Vous pouvez ajouter un seul lien Spotify. Supprimez l\'existant pour en ajouter un nouveau.' });
      return;
    }

    try {
      await addMusicLink(user.id, formData.platform, formData.url);
      setMessage({ type: 'success', text: '✅ Lien ajouté avec succès' });
      setFormData({ platform: 'spotify', url: '' });
      setShowForm(false);
      refetch();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    }
  };

  const handleRemove = async (linkId) => {
    if (!confirm('Supprimer ce lien musical ?')) return;

    try {
      await removeMusicLink(linkId);
      setMessage({ type: 'success', text: '✅ Lien supprimé' });
      refetch();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          🎶 Mes liens musicaux
        </h2>
        <div className="flex items-center gap-3">
          {musicLinks.length === 0 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-text-primary font-medium transition-colors"
            >
              {showForm ? '✖ Annuler' : '➕ Ajouter un lien'}
            </button>
          )}
          <button
            onClick={async () => {
              await refetch();
              setMessage({ type: 'success', text: '✅ Modifications enregistrées' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
            className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            💾 Enregistrer
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-6 bg-bg-secondary rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Ajouter un nouveau lien
          </h3>

          {/* Sélection plateforme */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Plateforme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, platform: platform.id }))}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${formData.platform === platform.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-bg-tertiary hover:border-accent/50'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{platform.icon}</div>
                  <div className={`text-sm font-medium ${platform.color}`}>
                    {platform.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              URL du lien
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder={getPlaceholder(formData.platform)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                       text-text-primary placeholder-text-secondary
                       focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-text-secondary mt-1">
              {getHelpText(formData.platform)}
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={managing}
              className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg
                       hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {managing ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {/* Liste des liens */}
      {musicLinks.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-lg border border-border">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Aucun lien musical
          </h3>
          <p className="text-text-secondary mb-6">
            Ajoutez vos liens Spotify, Bandcamp, etc. pour les partager sur votre profil
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg
                     hover:bg-accent-hover transition-colors"
          >
            ➕ Ajouter mon premier lien
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {musicLinks.map((link) => {
            const platform = PLATFORMS.find(p => p.id === link.platform);

            return (
              <div
                key={link.id}
                className="bg-bg-secondary rounded-lg border border-border overflow-hidden"
              >
                {/* Header du lien */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{platform?.icon}</div>
                    <div>
                      <h4 className={`font-semibold ${platform?.color || 'text-text-primary'}`}>
                        {platform?.name || 'Lien'}
                      </h4>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:text-accent-hover truncate block max-w-md"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(link.id)}
                    disabled={managing}
                    className="px-3 py-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors
                             disabled:opacity-50"
                  >
                    🗑️ Supprimer
                  </button>
                </div>

                {/* Lecteur embarqué */}
                {link.embed_html && (
                  <div className="px-4 pb-4">
                    <div
                      className="bg-bg-tertiary rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: link.embed_html }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Informations */}
      <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
        <h4 className="font-semibold text-text-primary mb-2">💡 Conseils</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• Le lien Spotify apparaît sur votre profil public</li>
          <li>• Un seul lien Spotify est autorisé par profil</li>
          <li>• Le lecteur Spotify s'affiche directement sur votre profil</li>
        </ul>
      </div>
    </div>
  );
}

// Helpers
function getPlaceholder(platform) {
  const placeholders = {
    spotify: 'https://open.spotify.com/track/...',
    bandcamp: 'https://votreartiste.bandcamp.com/album/...',
    apple_music: 'https://music.apple.com/...',
    soundcloud: 'https://soundcloud.com/votreartiste/...',
    youtube: 'https://youtube.com/watch?v=...',
    other: 'https://...'
  };
  return placeholders[platform] || 'https://...';
}

function getHelpText(platform) {
  const help = {
    spotify: 'Copiez le lien depuis l\'app Spotify (Partager → Copier le lien)',
    bandcamp: 'Copiez l\'URL de votre album ou track Bandcamp',
    apple_music: 'Copiez le lien depuis Apple Music',
    soundcloud: 'Copiez l\'URL de votre track SoundCloud',
    youtube: 'Copiez l\'URL de votre vidéo YouTube',
    other: 'Collez n\'importe quel lien musical'
  };
  return help[platform] || '';
}
