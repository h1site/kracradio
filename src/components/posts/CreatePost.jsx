import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useCommunity';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';

export default function CreatePost({ onPostCreated, replyTo = null }) {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const MAX_LENGTH = 2000;
  const MAX_FILES = 4;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + mediaFiles.length > MAX_FILES) {
      setError((t.posts?.createPost?.maxFilesError || 'Maximum {max} fichiers').replace('{max}', MAX_FILES));
      return;
    }

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

      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('id, username, artist_slug, avatar_url, is_verified')
        .eq('id', user.id)
        .single();

      const data = {
        ...newPost,
        author: authorProfile
      };

      setContent('');
      setMediaFiles([]);
      setMediaPreview([]);
      setIsFocused(false);
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
  const showCharCount = content.length > MAX_LENGTH - 200;

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + 'px';
    }
  };

  if (replyTo) {
    // Compact reply form
    return (
      <form onSubmit={handleSubmit} className="flex items-start gap-3">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1">
          <div className={`flex items-center rounded-full ${isDark ? 'bg-[#3a3b3c]' : 'bg-gray-100'} pr-2`}>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.posts?.createPost?.replyPlaceholder || "Écrivez une réponse..."}
              className={`flex-1 px-4 py-2.5 bg-transparent border-none outline-none text-[15px] ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="p-2 text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-1 px-2">{error}</p>}
        </div>
      </form>
    );
  }

  // Main create post form
  return (
    <div className={`rounded-2xl ${isDark ? 'bg-[#242526]' : 'bg-white'}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 p-4">
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-transparent hover:ring-red-500/50 transition-all cursor-pointer"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white' : 'bg-gradient-to-br from-red-500 to-pink-600 text-white'}`}>
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          {/* Input area */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onFocus={() => setIsFocused(true)}
              placeholder={t.posts?.createPost?.placeholder || "Quoi de neuf ?"}
              className={`w-full bg-transparent border-none outline-none resize-none text-[17px] leading-relaxed ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
              rows="1"
              style={{ minHeight: '24px' }}
            />
          </div>
        </div>

        {/* Media previews */}
        {mediaPreview.length > 0 && (
          <div className="px-4 pb-3">
            <div className={`grid gap-2 ${mediaPreview.length === 1 ? 'grid-cols-1' : mediaPreview.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} rounded-xl overflow-hidden`}>
              {mediaPreview.map((preview, index) => (
                <div key={index} className="relative group aspect-video">
                  {preview.type === 'image' ? (
                    <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={preview.url} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 pb-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Divider */}
        <div className={`border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`} />

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            {/* Photo/Video button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= MAX_FILES || isSubmitting}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-green-400' : 'hover:bg-gray-100 text-green-600'} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/>
              </svg>
              <span className="text-sm font-medium hidden sm:inline">{t.feed?.photo || 'Photo'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Character count */}
            {showCharCount && (
              <div className="flex items-center gap-2 ml-2">
                <div className="relative w-5 h-5">
                  <svg className="w-5 h-5 transform -rotate-90">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      strokeWidth="2"
                      className={isDark ? 'stroke-gray-700' : 'stroke-gray-200'}
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      strokeWidth="2"
                      strokeDasharray={50.265}
                      strokeDashoffset={50.265 * (1 - Math.min(content.length / MAX_LENGTH, 1))}
                      className={isOverLimit ? 'stroke-red-500' : remainingChars < 50 ? 'stroke-yellow-500' : 'stroke-red-500'}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {remainingChars < 50 && (
                  <span className={`text-xs font-medium ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`}>
                    {remainingChars}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0) || isOverLimit}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.posts?.createPost?.publishing || 'Publication...'}</span>
              </>
            ) : (
              <span>{t.posts?.createPost?.publish || 'Publier'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
