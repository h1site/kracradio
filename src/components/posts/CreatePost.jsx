import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

export default function CreatePost({ onPostCreated, replyTo = null }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_LENGTH = 2000;
  const MAX_FILES = 4;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + mediaFiles.length > MAX_FILES) {
      setError((t.posts?.createPost?.maxFilesError || 'Maximum {max} fichiers').replace('{max}', MAX_FILES));
      return;
    }

    // Créer les previews
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));

    setMediaFiles([...mediaFiles, ...files]);
    setMediaPreview([...mediaPreview, ...newPreviews]);
    setError(null);
  };

  const removeMedia = (index) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreview.filter((_, i) => i !== index);

    // Libérer l'URL de l'objet
    URL.revokeObjectURL(mediaPreview[index].url);

    setMediaFiles(newFiles);
    setMediaPreview(newPreviews);
  };

  const uploadMedia = async (files) => {
    const uploadedUrls = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('posts-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`${t.posts?.createPost?.uploadError || 'Erreur upload:'} ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts-media')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && mediaFiles.length === 0) {
      setError(t.posts?.createPost?.postRequired || 'Le post doit contenir du texte ou des médias');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrls = [];
      let mediaType = null;

      if (mediaFiles.length > 0) {
        mediaUrls = await uploadMedia(mediaFiles);
        mediaType = mediaFiles[0].type.startsWith('image/') ? 'image' : 'video';
      }

      const postData = {
        user_id: user.id,
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        visibility: 'public',
        reply_to_id: replyTo?.id || null
      };

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('*')
        .single();

      if (error) throw error;

      // Charger le profil de l'auteur séparément
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('id, username, artist_slug, avatar_url, is_verified')
        .eq('id', user.id)
        .single();

      const data = {
        ...newPost,
        author: authorProfile
      };

      // Reset le formulaire
      setContent('');
      setMediaFiles([]);
      setMediaPreview([]);

      // Libérer les URLs
      mediaPreview.forEach(preview => URL.revokeObjectURL(preview.url));

      if (onPostCreated) {
        onPostCreated(data);
      }

    } catch (err) {
      console.error('Erreur création post:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="bg-bg-secondary rounded-xl p-4 border border-border">
      {replyTo && (
        <div className="mb-3 text-sm text-text-secondary">
          {t.posts?.createPost?.replyingTo || 'En réponse à'} <span className="text-accent">@{replyTo.author?.username}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? (t.posts?.createPost?.replyPlaceholder || "Écrivez votre réponse...") : (t.posts?.createPost?.placeholder || "Quoi de neuf ?")}
          className="w-full bg-bg-primary text-text-primary rounded-lg p-3 border border-border focus:border-accent focus:outline-none resize-none"
          rows="4"
          maxLength={MAX_LENGTH}
        />

        {/* Prévisualisation des médias */}
        {mediaPreview.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {mediaPreview.map((preview, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden">
                {preview.type === 'image' ? (
                  <img src={preview.url} alt="Preview" className="w-full h-32 object-cover" />
                ) : (
                  <video src={preview.url} className="w-full h-32 object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-bg-primary/80 text-text-primary rounded-full p-1 hover:bg-bg-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Bouton d'ajout de média */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= MAX_FILES || isSubmitting}
              className="p-2 text-text-secondary hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t.posts?.createPost?.addMedia || 'Ajouter des images/vidéos'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Compteur de caractères */}
            <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-text-secondary'}`}>
              {remainingChars}
            </span>
          </div>

          {/* Bouton de publication */}
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0) || isOverLimit}
            className="px-6 py-2 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (t.posts?.createPost?.publishing || 'Publication...') : (replyTo ? (t.posts?.createPost?.reply || 'Répondre') : (t.posts?.createPost?.publish || 'Publier'))}
          </button>
        </div>
      </form>
    </div>
  );
}
