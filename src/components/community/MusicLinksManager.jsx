// src/components/community/MusicLinksManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useMusicLinks, useManageMusicLinks, useProfile, useUpdateProfile } from '../../hooks/useCommunity';

const PLATFORMS = [
  { id: 'spotify', name: 'Spotify', color: 'text-green-400', bgColor: 'bg-green-500/20' }
];

// Complete genre list organized by categories
const GENRE_CATEGORIES = {
  'Pop': [
    'Pop', 'Pop mainstream / Top 40', 'Pop rock', 'Pop électro / electro-pop', 'Synth-pop',
    'Dance-pop', 'Teen pop / boy bands / girl groups', 'K-Pop', 'J-Pop', 'Indie pop', 'Dream pop'
  ],
  'Rock': [
    'Rock', 'Rock classique / classic rock', 'Rock n\' roll', 'Rock alternatif', 'Rock moderne',
    'Rock psychédélique', 'Rock progressif', 'Garage rock', 'Stoner rock', 'Post-rock',
    'Southern rock', 'Arena rock / stadium rock'
  ],
  'Metal': [
    'Metal', 'Heavy metal', 'Thrash metal', 'Speed metal', 'Power metal', 'Death metal',
    'Black metal', 'Doom metal', 'Gothic metal', 'Symphonic metal', 'Progressive metal',
    'Industrial metal', 'Nu-metal', 'Metalcore', 'Deathcore', 'Sludge metal'
  ],
  'Punk / Hardcore': [
    'Punk', 'Punk rock', 'Hardcore punk', 'Skate punk', 'Pop punk', 'Street punk / Oi!',
    'Post-punk', 'Emo', 'Post-hardcore', 'Screamo'
  ],
  'Indie / Alternative': [
    'Alternative', 'Indie rock', 'Indie pop', 'Lo-fi rock', 'Shoegaze', 'Noise rock',
    'Math rock', 'Post-grunge'
  ],
  'Hip-Hop / Rap': [
    'Hip-hop / rap', 'Rap old school', 'Rap 90s', 'Boom bap', 'Rap moderne', 'Trap', 'Drill',
    'Cloud rap', 'Gangsta rap', 'Hip-hop alternatif', 'Conscious rap', 'Underground hip-hop',
    'Latin rap', 'Grime'
  ],
  'R&B / Soul / Funk': [
    'R&B', 'R&B contemporain', 'Soul', 'Soul classique / Motown', 'Neo-soul', 'Funk',
    'P-Funk', 'Disco', 'Nu-disco', 'Quiet storm'
  ],
  'Électro / Dance': [
    'Musique électronique', 'EDM', 'Dance', 'Eurodance', 'Big room', 'Progressive house (EDM)',
    'Electro house', 'Future house', 'Bass house'
  ],
  'House': [
    'House', 'Deep house', 'Tech house', 'Progressive house', 'Chicago house', 'Detroit house',
    'Acid house', 'Soulful house', 'Funky house', 'Minimal house', 'Tropical house'
  ],
  'Techno / Trance': [
    'Techno', 'Detroit techno', 'Minimal techno', 'Acid techno', 'Industrial techno',
    'Hard techno', 'Schranz', 'Trance', 'Psytrance', 'Goa trance', 'Uplifting trance',
    'Hard trance', 'Eurotrance'
  ],
  'Breakbeat / DnB': [
    'Breakbeat', 'Big beat', 'Drum & bass', 'Jungle', 'Liquid DnB', 'Neurofunk',
    'Half-time', 'Breakcore'
  ],
  'Dubstep / Bass': [
    'Dubstep', 'Brostep', 'Riddim', 'Chillstep', 'Trap EDM', 'Future bass', 'Hybrid trap'
  ],
  'Industrial / Dark / Goth': [
    'Industrial', 'EBM', 'Dark electro', 'Electro-indus', 'Aggrotech / hellectro',
    'Industrial rock', 'Industrial metal', 'Power noise / rhythmic noise', 'Darkwave',
    'Coldwave', 'Goth rock', 'Post-punk dark', 'Cyberpunk / futurepop'
  ],
  'Ambient / Downtempo': [
    'Ambient', 'Dark ambient', 'Drone', 'Downtempo', 'Trip-hop', 'Chillout', 'Lounge',
    'Lo-fi hip-hop / chillhop', 'New age'
  ],
  'Expérimental / Avant-garde': [
    'Expérimental', 'Avant-garde', 'Noise', 'Musique concrète', 'Glitch', 'IDM'
  ],
  'Jazz': [
    'Jazz', 'Jazz traditionnel', 'Swing', 'Bebop', 'Hard bop', 'Cool jazz', 'Jazz fusion',
    'Jazz-rock', 'Smooth jazz', 'Latin jazz', 'Nu-jazz'
  ],
  'Blues': [
    'Blues', 'Delta blues', 'Chicago blues', 'Electric blues', 'Blues rock',
    'Country blues', 'Modern blues'
  ],
  'Country / Folk': [
    'Country', 'Country classique', 'Country moderne / pop country', 'Country rock',
    'Bluegrass', 'Americana', 'Folk', 'Neo-folk', 'Singer-songwriter / acoustique'
  ],
  'Chanson / Francophone': [
    'Chanson française', 'Chanson québécoise', 'Pop francophone', 'Rap francophone',
    'Folk francophone', 'Slam / poésie chantée'
  ],
  'Reggae / Dub / Ska': [
    'Reggae', 'Roots reggae', 'Dancehall', 'Ragga', 'Dub', 'Dub roots', 'Ska', 'Ska punk'
  ],
  'Latin': [
    'Latin pop', 'Reggaeton', 'Latin trap', 'Salsa', 'Bachata', 'Merengue', 'Cumbia',
    'Bossa nova', 'Samba', 'Latin rock'
  ],
  'Afro / Africaines': [
    'Afrobeat', 'Afropop', 'Afrofusion', 'Highlife', 'Soukous', 'Kizomba', 'Coupe-décalé'
  ],
  'Musiques du monde': [
    'Musiques celtiques', 'Musiques arabes / orientales', 'Musiques indiennes',
    'Musiques asiatiques traditionnelles', 'Flamenco', 'Musiques gitanes', 'Musiques des Balkans'
  ],
  'Classique / Orchestrale': [
    'Musique classique', 'Baroque', 'Classique romantique', 'Classique moderne',
    'Musique de film / soundtrack', 'Musique épique / trailer', 'Néoclassique',
    'Musique de jeu vidéo'
  ],
  'Électro-pop culture': [
    'Chiptune / 8-bit', 'Synthwave', 'Retrowave / outrun', 'Vaporwave', 'Nerdcore'
  ],
  'Religieux / Spirituel': [
    'Gospel', 'Musique chrétienne contemporaine', 'Chants religieux', 'Chorale / choeur'
  ],
  'Humour / Enfants': [
    'Musique pour enfants', 'Comptines', 'Chansons humoristiques', 'Parodies', 'Novelty songs'
  ],
  'Saisonnier': [
    'Noël / Christmas', 'Halloween / horror-themed', 'Fête / party mix'
  ]
};

export default function MusicLinksManager() {
  const { user } = useAuth();
  const { musicLinks, loading, refetch } = useMusicLinks(user?.id);
  const { addMusicLink, removeMusicLink, loading: managing } = useManageMusicLinks();
  const { profile, loading: loadingProfile, refetch: refetchProfile } = useProfile(user?.id);
  const { updateProfile, loading: updating } = useUpdateProfile();
  const { t } = useI18n();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ platform: 'spotify', url: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [genres, setGenres] = useState([]);
  const [showGenres, setShowGenres] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Load genres from profile
  useEffect(() => {
    if (profile?.genres) {
      setGenres(profile.genres);
    }
  }, [profile]);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.url.trim()) {
      setMessage({ type: 'error', text: t.community?.musicLinks?.enterUrl || 'Please enter a URL' });
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      setMessage({ type: 'error', text: t.community?.musicLinks?.invalidUrl || 'Invalid URL' });
      return;
    }

    if (musicLinks.length > 0) {
      setMessage({ type: 'error', text: t.community?.musicLinks?.deleteExisting || 'Delete existing link to add a new one' });
      return;
    }

    try {
      await addMusicLink(user.id, formData.platform, formData.url);
      setMessage({ type: 'success', text: t.community?.musicLinks?.linkAdded || 'Link added' });
      setFormData({ platform: 'spotify', url: '' });
      setShowForm(false);
      refetch();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleRemove = async (linkId) => {
    if (!confirm(t.community?.musicLinks?.deleteConfirm || 'Delete this music link?')) return;

    try {
      await removeMusicLink(linkId);
      setMessage({ type: 'success', text: t.community?.musicLinks?.linkRemoved || 'Link removed' });
      refetch();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const addGenre = async (genre) => {
    if (genre && !genres.includes(genre) && genres.length < 3) {
      const newGenres = [...genres, genre];
      setGenres(newGenres);
      try {
        await updateProfile(user.id, { genres: newGenres });
        await refetchProfile();
        setMessage({ type: 'success', text: t.community?.musicLinks?.genreAdded || 'Genre added' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setGenres(genres); // Rollback
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const removeGenre = async (genre) => {
    const newGenres = genres.filter(g => g !== genre);
    setGenres(newGenres);
    try {
      await updateProfile(user.id, { genres: newGenres });
      await refetchProfile();
      setMessage({ type: 'success', text: t.community?.musicLinks?.genreRemoved || 'Genre removed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setGenres(genres); // Rollback
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Message feedback */}
      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section: Artist Section - Genres */}
      <div className="bg-[#242526] rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-[17px] font-semibold text-white">{t.community?.musicLinks?.artistSection || "Artist Section"}</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">{t.community?.musicLinks?.artistSectionDesc || "Define your musical style (max 3 genres)"}</p>
        </div>

        <div className="p-4">
          {/* Selected genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map(genre => (
                <span
                  key={genre}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-[13px] flex items-center gap-1.5"
                >
                  {genre}
                  <button
                    type="button"
                    onClick={() => removeGenre(genre)}
                    disabled={updating}
                    className="hover:text-white disabled:opacity-50"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Toggle to show/hide genre selection */}
          <button
            type="button"
            onClick={() => setShowGenres(!showGenres)}
            className="text-[14px] text-blue-400 hover:underline flex items-center gap-1"
          >
            {showGenres ? (t.community?.musicLinks?.hideGenres || 'Hide genres') : (genres.length < 3 ? (t.community?.musicLinks?.addGenres || 'Add genres') : (t.community?.musicLinks?.changeGenres || 'Change genres'))}
            <svg className={`w-4 h-4 transition-transform ${showGenres ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Genre categories */}
          {showGenres && genres.length < 3 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(GENRE_CATEGORIES).map(([category, genreList]) => (
                <div key={category} className="border border-gray-700/50 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    className="w-full px-3 py-2.5 bg-[#3a3b3c] hover:bg-[#4a4b4c] text-left flex items-center justify-between transition-colors"
                  >
                    <span className="text-[14px] font-medium text-white">{category}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedCategory === category && (
                    <div className="p-3 bg-[#18191a] flex flex-wrap gap-2">
                      {genreList.filter(g => !genres.includes(g)).map(genre => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => addGenre(genre)}
                          disabled={updating || genres.length >= 3}
                          className="px-3 py-1.5 bg-[#3a3b3c] hover:bg-blue-500/30 hover:text-blue-400 rounded-full text-[12px] text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + {genre}
                        </button>
                      ))}
                      {genreList.filter(g => !genres.includes(g)).length === 0 && (
                        <p className="text-[12px] text-gray-500 italic">{t.community?.musicLinks?.allGenresSelected || 'All genres from this category selected'}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {genres.length === 0 && !showGenres && (
            <p className="text-[13px] text-gray-500 mt-2">{t.community?.musicLinks?.noGenresSelected || 'No genres selected. Add genres to help others discover your music.'}</p>
          )}
        </div>
      </div>

      {/* Section: Liens musicaux */}
      <div className="bg-[#242526] rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-semibold text-white">{t.community?.musicLinks?.title || "Music links"}</h3>
            <p className="text-[13px] text-gray-400 mt-0.5">{t.community?.musicLinks?.subtitle || "Share your music on your profile"}</p>
          </div>
          {musicLinks.length === 0 && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-[14px]"
            >
              {t.community?.musicLinks?.addButton || "Add"}
            </button>
          )}
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="p-4 border-b border-gray-700/50">
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-[13px] text-gray-400 mb-2">{t.community?.musicLinks?.platform || "Platform"}</label>
                <div className="flex gap-2">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, platform: platform.id }))}
                      className={`
                        px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 text-[14px] font-medium
                        ${formData.platform === platform.id
                          ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50'
                          : 'bg-[#3a3b3c] text-gray-300 hover:bg-[#4a4b4c]'
                        }
                      `}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[13px] text-gray-400 mb-2">{t.community?.musicLinks?.spotifyUrl || "Spotify URL"}</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full px-3 py-2.5 bg-[#3a3b3c] rounded-lg text-white text-[15px] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[12px] text-gray-500 mt-1">{t.community?.musicLinks?.spotifyUrlHint || "Paste your artist profile, album or Spotify playlist URL"}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-[#3a3b3c] hover:bg-[#4a4b4c] text-gray-300 font-medium rounded-lg transition-colors text-[15px]"
                >
                  {t.community?.musicLinks?.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={managing}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-[15px]"
                >
                  {managing ? (t.community?.musicLinks?.adding || 'Adding...') : (t.community?.musicLinks?.add || 'Add link')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des liens */}
        {musicLinks.length === 0 && !showForm ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3a3b3c] flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <p className="text-[15px] font-medium text-white mb-1">{t.community?.musicLinks?.noLinks || "No music links"}</p>
            <p className="text-[13px] text-gray-400">{t.community?.musicLinks?.noLinksDesc || "Add your Spotify link to share on your profile"}</p>
          </div>
        ) : (
          <div>
            {musicLinks.map((link) => {
              const platform = PLATFORMS.find(p => p.id === link.platform);

              return (
                <div key={link.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${platform?.bgColor || 'bg-gray-700'} flex items-center justify-center`}>
                        <svg className={`w-5 h-5 ${platform?.color || 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-[15px] font-medium ${platform?.color || 'text-white'}`}>
                          {platform?.name || 'Lien'}
                        </h4>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-blue-400 hover:underline truncate block max-w-sm"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(link.id)}
                      disabled={managing}
                      className="px-3 py-1.5 text-[13px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t.community?.musicLinks?.remove || "Remove"}
                    </button>
                  </div>

                  {/* Lecteur embarqué */}
                  {link.embed_html && (
                    <div
                      className="bg-[#18191a] rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: link.embed_html }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Conseils */}
      <div className="bg-[#242526] rounded-lg">
        <div className="px-4 py-4">
          <h4 className="text-[15px] font-medium text-white mb-2">{t.community?.musicLinks?.tips || "Tips"}</h4>
          <ul className="text-[13px] text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-gray-500">•</span>
              {t.community?.musicLinks?.tip1 || "Spotify link appears on your public profile"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-500">•</span>
              {t.community?.musicLinks?.tip2 || "Only one Spotify link allowed per profile"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-500">•</span>
              {t.community?.musicLinks?.tip3 || "Spotify player displays directly on your profile"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
