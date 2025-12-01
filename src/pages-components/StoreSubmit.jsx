'use client';
// src/pages/StoreSubmit.jsx
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase, SUPABASE_FUNCTIONS_URL } from '../lib/supabase';

const PRICES = [
  { value: '0.99', label: '0,99 $' },
  { value: '1.29', label: '1,29 $' },
  { value: '1.99', label: '1,99 $' },
  { value: '2.99', label: '2,99 $' },
  { value: '4.99', label: '4,99 $' },
  { value: '9.99', label: '9,99 $' },
];

const PRODUCT_TYPES = [
  { value: 'single', labelFr: 'Single', labelEn: 'Single', labelEs: 'Single' },
  { value: 'ep', labelFr: 'EP', labelEn: 'EP', labelEs: 'EP' },
  { value: 'album', labelFr: 'Album', labelEn: 'Album', labelEs: 'Álbum' },
];

const STRINGS = {
  fr: {
    title: 'Soumettre pour la vente',
    description: 'Vendez votre musique sur store.kracradio.com',
    loginRequired: 'Connexion requise',
    loginMessage: 'Vous devez être connecté pour soumettre de la musique à la vente.',
    loginButton: 'Se connecter',

    // Form
    trackTitle: 'Titre du morceau',
    trackTitlePlaceholder: 'Ex: My Song',
    artistName: 'Nom d\'artiste',
    artistNamePlaceholder: 'Ex: DJ Krac',
    productType: 'Type de produit',
    price: 'Prix de vente',
    selectPrice: 'Sélectionnez un prix',
    audioFile: 'Fichier audio (MP3)',
    audioFileNote: 'Format MP3 uniquement - Qualité 320kbps recommandée',
    coverImage: 'Image de couverture',
    coverImageNote: 'Format JPG/PNG - Minimum 1400x1400px recommandé',
    artistMessage: 'Message pour l\'équipe (optionnel)',
    artistMessagePlaceholder: 'Informations supplémentaires...',

    // Rights confirmation
    rightsTitle: 'Confirmation des droits',
    rightsConfirm: 'Je confirme détenir tous les droits nécessaires pour vendre cette musique',

    // Commission info
    commissionTitle: 'Répartition des revenus',
    commissionArtist: 'Part artiste',
    commissionPlatform: 'Part plateforme',

    // Submit
    submit: 'Soumettre pour approbation',
    submitting: 'Envoi en cours...',

    // Messages
    success: 'Soumission envoyée avec succès!',
    successDesc: 'Notre équipe examinera votre demande sous 2-3 jours.',
    error: 'Erreur lors de l\'envoi',
    errorTitle: 'Veuillez entrer un titre',
    errorArtist: 'Veuillez entrer votre nom d\'artiste',
    errorPrice: 'Veuillez sélectionner un prix',
    errorRights: 'Vous devez confirmer détenir les droits',
    errorAudio: 'Veuillez sélectionner un fichier audio',

    // Info
    infoTitle: 'Comment ça marche ?',
    info1: 'Remplissez le formulaire avec les informations de votre morceau',
    info2: 'Notre équipe examine votre soumission (2-3 jours)',
    info3: 'Si approuvé, votre musique sera mise en vente sur store.kracradio.com',
    info4: 'Vous recevez 85% des revenus de chaque vente',

    // Back
    back: '← Retour au dashboard',
  },
  en: {
    title: 'Submit for Sale',
    description: 'Sell your music on store.kracradio.com',
    loginRequired: 'Login Required',
    loginMessage: 'You must be logged in to submit music for sale.',
    loginButton: 'Log In',

    // Form
    trackTitle: 'Track Title',
    trackTitlePlaceholder: 'Ex: My Song',
    artistName: 'Artist Name',
    artistNamePlaceholder: 'Ex: DJ Krac',
    productType: 'Product Type',
    price: 'Sale Price',
    selectPrice: 'Select a price',
    audioFile: 'Audio File (MP3)',
    audioFileNote: 'MP3 format only - 320kbps quality recommended',
    coverImage: 'Cover Image',
    coverImageNote: 'JPG/PNG format - Minimum 1400x1400px recommended',
    artistMessage: 'Message for the team (optional)',
    artistMessagePlaceholder: 'Additional information...',

    // Rights confirmation
    rightsTitle: 'Rights Confirmation',
    rightsConfirm: 'I confirm that I hold all necessary rights to sell this music',

    // Commission info
    commissionTitle: 'Revenue Split',
    commissionArtist: 'Artist share',
    commissionPlatform: 'Platform share',

    // Submit
    submit: 'Submit for Approval',
    submitting: 'Submitting...',

    // Messages
    success: 'Submission sent successfully!',
    successDesc: 'Our team will review your request within 2-3 days.',
    error: 'Error during submission',
    errorTitle: 'Please enter a title',
    errorArtist: 'Please enter your artist name',
    errorPrice: 'Please select a price',
    errorRights: 'You must confirm you hold the rights',
    errorAudio: 'Please select an audio file',

    // Info
    infoTitle: 'How it works?',
    info1: 'Fill out the form with your track information',
    info2: 'Our team reviews your submission (2-3 days)',
    info3: 'If approved, your music will be listed on store.kracradio.com',
    info4: 'You receive 85% of revenue from each sale',

    // Back
    back: '← Back to dashboard',
  },
  es: {
    title: 'Enviar para venta',
    description: 'Vende tu música en store.kracradio.com',
    loginRequired: 'Inicio de sesión requerido',
    loginMessage: 'Debes iniciar sesión para enviar música para venta.',
    loginButton: 'Iniciar sesión',

    // Form
    trackTitle: 'Título de la pista',
    trackTitlePlaceholder: 'Ej: My Song',
    artistName: 'Nombre del artista',
    artistNamePlaceholder: 'Ej: DJ Krac',
    productType: 'Tipo de producto',
    price: 'Precio de venta',
    selectPrice: 'Selecciona un precio',
    audioFile: 'Archivo de audio (MP3)',
    audioFileNote: 'Solo formato MP3 - Calidad 320kbps recomendada',
    coverImage: 'Imagen de portada',
    coverImageNote: 'Formato JPG/PNG - Mínimo 1400x1400px recomendado',
    artistMessage: 'Mensaje para el equipo (opcional)',
    artistMessagePlaceholder: 'Información adicional...',

    // Rights confirmation
    rightsTitle: 'Confirmación de derechos',
    rightsConfirm: 'Confirmo que poseo todos los derechos necesarios para vender esta música',

    // Commission info
    commissionTitle: 'División de ingresos',
    commissionArtist: 'Parte del artista',
    commissionPlatform: 'Parte de la plataforma',

    // Submit
    submit: 'Enviar para aprobación',
    submitting: 'Enviando...',

    // Messages
    success: '¡Envío exitoso!',
    successDesc: 'Nuestro equipo revisará tu solicitud en 2-3 días.',
    error: 'Error durante el envío',
    errorTitle: 'Por favor ingresa un título',
    errorArtist: 'Por favor ingresa tu nombre de artista',
    errorPrice: 'Por favor selecciona un precio',
    errorRights: 'Debes confirmar que posees los derechos',
    errorAudio: 'Por favor selecciona un archivo de audio',

    // Info
    infoTitle: '¿Cómo funciona?',
    info1: 'Completa el formulario con la información de tu pista',
    info2: 'Nuestro equipo revisa tu envío (2-3 días)',
    info3: 'Si es aprobado, tu música estará a la venta en store.kracradio.com',
    info4: 'Recibes el 85% de los ingresos de cada venta',

    // Back
    back: '← Volver al dashboard',
  },
};

export default function StoreSubmit() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const router = useRouter();

  const [form, setForm] = useState({
    trackTitle: '',
    artistName: '',
    productType: 'single',
    price: '',
    artistMessage: '',
    rightsConfirmed: false,
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'audio/mpeg' || file.name.endsWith('.mp3'))) {
      setAudioFile(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i))) {
      setCoverFile(file);
      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!form.trackTitle.trim()) {
      setMessage({ type: 'error', text: L.errorTitle });
      return;
    }
    if (!form.artistName.trim()) {
      setMessage({ type: 'error', text: L.errorArtist });
      return;
    }
    if (!form.price) {
      setMessage({ type: 'error', text: L.errorPrice });
      return;
    }
    if (!form.rightsConfirmed) {
      setMessage({ type: 'error', text: L.errorRights });
      return;
    }

    setSubmitting(true);

    try {
      let dropboxAudioUrl = null;
      let dropboxCoverUrl = null;

      // Upload files directly to Dropbox via edge function (bypasses Supabase Storage)
      if (audioFile || coverFile) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        // Build FormData with files
        const uploadFormData = new FormData();
        uploadFormData.append('artist_name', form.artistName.trim());
        uploadFormData.append('track_title', form.trackTitle.trim());

        if (audioFile) {
          uploadFormData.append('audio_file', audioFile);
        }
        if (coverFile) {
          uploadFormData.append('cover_file', coverFile);
        }

        console.log('Uploading files directly to Dropbox...');
        const dropboxResponse = await fetch(
          `${SUPABASE_FUNCTIONS_URL}/dropbox-upload-submission`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Note: Don't set Content-Type for FormData - browser will set it with boundary
            },
            body: uploadFormData,
          }
        );

        const dropboxResult = await dropboxResponse.json();
        console.log('Dropbox upload result:', dropboxResult);

        if (!dropboxResponse.ok) {
          throw new Error(dropboxResult.error || 'Failed to upload files');
        }

        if (dropboxResult.success) {
          dropboxAudioUrl = dropboxResult.audio_dropbox_url;
          dropboxCoverUrl = dropboxResult.cover_dropbox_url;
        }
      }

      // Create submission record with Dropbox URLs
      const { error } = await supabase.from('store_submissions').insert({
        user_id: user.id,
        track_title: form.trackTitle.trim(),
        artist_name: form.artistName.trim(),
        requested_price: parseFloat(form.price),
        product_type: form.productType,
        audio_file_url: dropboxAudioUrl,
        cover_image_url: dropboxCoverUrl,
        rights_confirmed: form.rightsConfirmed,
        artist_message: form.artistMessage.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      setSuccess(true);
      setMessage({ type: 'success', text: L.success });

    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'error', text: L.error + ': ' + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] px-4 py-12">
        <Seo lang={lang} title={L.title} description={L.description} path="/store/submit" type="website" />
        <div className="max-w-lg mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              {L.loginRequired}
            </h2>
            <p className="text-yellow-800 dark:text-yellow-300 mb-4">
              {L.loginMessage}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              {L.loginButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] px-4 py-12">
        <Seo lang={lang} title={L.title} description={L.description} path="/store/submit" type="website" />
        <div className="max-w-lg mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 dark:text-green-200 mb-2">
              {L.success}
            </h2>
            <p className="text-green-800 dark:text-green-300 mb-6">
              {L.successDesc}
            </p>
            <button
              onClick={() => router.push('/dashboard/store')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              {L.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Seo lang={lang} title={L.title} description={L.description} path="/store/submit" type="website" />

      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            {L.back}
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{L.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{L.description}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Track Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {L.trackTitle} *
                </label>
                <input
                  type="text"
                  value={form.trackTitle}
                  onChange={(e) => setForm({ ...form, trackTitle: e.target.value })}
                  placeholder={L.trackTitlePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Artist Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {L.artistName} *
                </label>
                <input
                  type="text"
                  value={form.artistName}
                  onChange={(e) => setForm({ ...form, artistName: e.target.value })}
                  placeholder={L.artistNamePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Product Type & Price */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {L.productType}
                  </label>
                  <select
                    value={form.productType}
                    onChange={(e) => setForm({ ...form, productType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {PRODUCT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {lang === 'fr' ? type.labelFr : lang === 'es' ? type.labelEs : type.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {L.price} *
                  </label>
                  <select
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">{L.selectPrice}</option>
                    {PRICES.map((price) => (
                      <option key={price.value} value={price.value}>{price.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audio File */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {L.audioFile}
                </label>
                <input
                  type="file"
                  accept="audio/mpeg,.mp3"
                  onChange={handleAudioChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 dark:file:bg-green-900/30 dark:file:text-green-300"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{L.audioFileNote}</p>
                {audioFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {L.coverImage}
                </label>
                <div className="flex items-start gap-4">
                  {coverPreview && (
                    <img src={coverPreview} alt="Cover preview" className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 dark:file:bg-green-900/30 dark:file:text-green-300"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{L.coverImageNote}</p>
                  </div>
                </div>
              </div>

              {/* Artist Message */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {L.artistMessage}
                </label>
                <textarea
                  value={form.artistMessage}
                  onChange={(e) => setForm({ ...form, artistMessage: e.target.value })}
                  placeholder={L.artistMessagePlaceholder}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Rights Confirmation */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{L.rightsTitle}</h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rightsConfirmed}
                    onChange={(e) => setForm({ ...form, rightsConfirmed: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{L.rightsConfirm}</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? L.submitting : L.submit}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How it works */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{L.infoTitle}</h3>
              <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-medium">1</span>
                  <span>{L.info1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-medium">2</span>
                  <span>{L.info2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-medium">3</span>
                  <span>{L.info3}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-medium">4</span>
                  <span>{L.info4}</span>
                </li>
              </ol>
            </div>

            {/* Commission Info */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-4">{L.commissionTitle}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800 dark:text-green-300">{L.commissionArtist}</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-200">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800 dark:text-green-300">{L.commissionPlatform}</span>
                  <span className="text-sm text-green-700 dark:text-green-300">15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
