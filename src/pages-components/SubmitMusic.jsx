'use client';
// src/pages/SubmitMusic.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import Link from 'next/link';

const STRINGS = {
  fr: {
    title: 'Soumettre votre musique',
    description: 'Partagez votre musique avec KracRadio et touchez une nouvelle audience',
    loginRequired: 'Connexion requise',
    loginMessage: 'Vous devez être connecté pour soumettre de la musique.',
    loginButton: 'Se connecter',
    registerButton: 'Créer un compte',
    artistName: 'Nom d\'artiste',
    artistNamePlaceholder: 'Votre nom d\'artiste ou groupe',
    uploadFiles: 'Fichiers MP3',
    uploadInstruction: 'Glissez-déposez vos fichiers MP3 ici ou cliquez pour parcourir',
    uploadNote: 'Format accepté: MP3 uniquement • Maximum: 10 fichiers',
    filesSelected: 'fichier(s) sélectionné(s)',
    removeFile: 'Retirer',
    submit: 'Soumettre la musique',
    submitting: 'Envoi en cours...',
    success: '✅ Musique soumise avec succès!',
    successMessage: 'Vos fichiers ont été envoyés. Notre équipe les examinera sous 2-3 jours.',
    error: 'Erreur lors de l\'envoi',
    errorArtistName: 'Veuillez entrer votre nom d\'artiste',
    errorFiles: 'Veuillez sélectionner au moins un fichier MP3',
    errorUpload: 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.',
    howItWorks: 'Comment ça marche?',
    step1: '1. Connectez-vous',
    step1Desc: 'Créez un compte gratuit ou connectez-vous à votre compte KracRadio',
    step2: '2. Remplissez le formulaire',
    step2Desc: 'Entrez votre nom d\'artiste',
    step3: '3. Téléversez vos MP3',
    step3Desc: 'Glissez-déposez vos fichiers MP3 (maximum 10 fichiers)',
    step4: '4. Soumettez',
    step4Desc: 'Vos fichiers seront envoyés dans notre Dropbox pour révision',
    guidelines: 'Directives de soumission',
    guideline1: 'Seuls les fichiers MP3 sont acceptés',
    guideline2: 'Maximum 10 fichiers par soumission',
    guideline3: 'Assurez-vous d\'avoir les droits sur la musique soumise',
    guideline4: 'La musique sera examinée avant d\'être diffusée',
    guideline5: 'Délai de révision: 5-7 jours ouvrables',
    // MP3 Tag Important Section
    importantTitle: 'IMPORTANT - Tags MP3 ID3',
    importantDesc: 'Pour maximiser vos chances d\'approbation, vos fichiers MP3 doivent avoir des métadonnées (tags ID3) correctement remplies. Des tags incomplets ou manquants peuvent entraîner un refus.',
    mp3TagsTitle: 'Tags ID3 requis:',
    mp3Tag1: 'Titre de la chanson (Title)',
    mp3Tag2: 'Nom de l\'artiste (Artist)',
    mp3Tag3: 'Nom de l\'album (Album)',
    mp3Tag4: 'Année de sortie (Year)',
    mp3Tag5: 'Genre musical (Genre)',
    mp3Tag6: 'Image de couverture (Album Art) - fortement recommandé',
    verifyTitle: 'Vérifiez vos tags MP3',
    verifyDesc: 'Utilisez notre application web gratuite pour vérifier et éditer les tags ID3 de vos fichiers MP3 avant de soumettre:',
    verifyLink: 'kemp3.app',
    verifyNote: 'Cette étape est cruciale pour éviter les refus!'
  },
  en: {
    title: 'Submit Your Music',
    description: 'Share your music with KracRadio and reach a new audience',
    loginRequired: 'Login Required',
    loginMessage: 'You must be logged in to submit music.',
    loginButton: 'Log In',
    registerButton: 'Create Account',
    artistName: 'Artist Name',
    artistNamePlaceholder: 'Your artist or band name',
    uploadFiles: 'MP3 Files',
    uploadInstruction: 'Drag and drop your MP3 files here or click to browse',
    uploadNote: 'Accepted format: MP3 only • Maximum: 10 files',
    filesSelected: 'file(s) selected',
    removeFile: 'Remove',
    submit: 'Submit Music',
    submitting: 'Submitting...',
    success: '✅ Music submitted successfully!',
    successMessage: 'Your files have been sent. Our team will review them within 2-3 days.',
    error: 'Upload Error',
    errorArtistName: 'Please enter your artist name',
    errorFiles: 'Please select at least one MP3 file',
    errorUpload: 'An error occurred during upload. Please try again.',
    howItWorks: 'How It Works?',
    step1: '1. Log In',
    step1Desc: 'Create a free account or log in to your KracRadio account',
    step2: '2. Fill the Form',
    step2Desc: 'Enter your artist name',
    step3: '3. Upload MP3s',
    step3Desc: 'Drag and drop your MP3 files (maximum 10 files)',
    step4: '4. Submit',
    step4Desc: 'Your files will be sent to our Dropbox for review',
    guidelines: 'Submission Guidelines',
    guideline1: 'Only MP3 files are accepted',
    guideline2: 'Maximum 10 files per submission',
    guideline3: 'Ensure you own the rights to the music submitted',
    guideline4: 'Music will be reviewed before being broadcast',
    guideline5: 'Review time: 5-7 business days',
    // MP3 Tag Important Section
    importantTitle: 'IMPORTANT - MP3 ID3 Tags',
    importantDesc: 'To maximize your chances of approval, your MP3 files must have properly filled metadata (ID3 tags). Incomplete or missing tags may result in rejection.',
    mp3TagsTitle: 'Required ID3 Tags:',
    mp3Tag1: 'Song Title (Title)',
    mp3Tag2: 'Artist Name (Artist)',
    mp3Tag3: 'Album Name (Album)',
    mp3Tag4: 'Release Year (Year)',
    mp3Tag5: 'Music Genre (Genre)',
    mp3Tag6: 'Cover Image (Album Art) - highly recommended',
    verifyTitle: 'Verify Your MP3 Tags',
    verifyDesc: 'Use our free web application to verify and edit the ID3 tags of your MP3 files before submitting:',
    verifyLink: 'kemp3.app',
    verifyNote: 'This step is crucial to avoid rejection!'
  },
  es: {
    title: 'Enviar tu música',
    description: 'Comparte tu música con KracRadio y alcanza una nueva audiencia',
    loginRequired: 'Inicio de sesión requerido',
    loginMessage: 'Debes iniciar sesión para enviar música.',
    loginButton: 'Iniciar sesión',
    registerButton: 'Crear cuenta',
    artistName: 'Nombre del artista',
    artistNamePlaceholder: 'Tu nombre de artista o banda',
    uploadFiles: 'Archivos MP3',
    uploadInstruction: 'Arrastra y suelta tus archivos MP3 aquí o haz clic para explorar',
    uploadNote: 'Formato aceptado: solo MP3 • Máximo: 10 archivos',
    filesSelected: 'archivo(s) seleccionado(s)',
    removeFile: 'Eliminar',
    submit: 'Enviar música',
    submitting: 'Enviando...',
    success: '✅ ¡Música enviada con éxito!',
    successMessage: 'Tus archivos han sido enviados. Nuestro equipo los revisará en 2-3 días.',
    error: 'Error de carga',
    errorArtistName: 'Por favor ingresa tu nombre de artista',
    errorFiles: 'Por favor selecciona al menos un archivo MP3',
    errorUpload: 'Ocurrió un error durante la carga. Por favor intenta de nuevo.',
    howItWorks: '¿Cómo funciona?',
    step1: '1. Inicia sesión',
    step1Desc: 'Crea una cuenta gratuita o inicia sesión en tu cuenta KracRadio',
    step2: '2. Completa el formulario',
    step2Desc: 'Ingresa tu nombre de artista',
    step3: '3. Sube MP3s',
    step3Desc: 'Arrastra y suelta tus archivos MP3 (máximo 10 archivos)',
    step4: '4. Enviar',
    step4Desc: 'Tus archivos serán enviados a nuestro Dropbox para revisión',
    guidelines: 'Pautas de envío',
    guideline1: 'Solo se aceptan archivos MP3',
    guideline2: 'Máximo 10 archivos por envío',
    guideline3: 'Asegúrate de tener los derechos de la música enviada',
    guideline4: 'La música será revisada antes de ser transmitida',
    guideline5: 'Tiempo de revisión: 5-7 días hábiles',
    // MP3 Tag Important Section
    importantTitle: 'IMPORTANTE - Etiquetas ID3 MP3',
    importantDesc: 'Para maximizar tus posibilidades de aprobación, tus archivos MP3 deben tener metadatos (etiquetas ID3) correctamente completados. Etiquetas incompletas o faltantes pueden resultar en rechazo.',
    mp3TagsTitle: 'Etiquetas ID3 requeridas:',
    mp3Tag1: 'Título de la canción (Title)',
    mp3Tag2: 'Nombre del artista (Artist)',
    mp3Tag3: 'Nombre del álbum (Album)',
    mp3Tag4: 'Año de lanzamiento (Year)',
    mp3Tag5: 'Género musical (Genre)',
    mp3Tag6: 'Imagen de portada (Album Art) - altamente recomendado',
    verifyTitle: 'Verifica tus etiquetas MP3',
    verifyDesc: 'Usa nuestra aplicación web gratuita para verificar y editar las etiquetas ID3 de tus archivos MP3 antes de enviar:',
    verifyLink: 'kemp3.app',
    verifyNote: '¡Este paso es crucial para evitar el rechazo!'
  }
};

export default function SubmitMusic() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const L = STRINGS[lang] || STRINGS.fr;

  const [artistName, setArtistName] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
      </div>
    );
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const mp3Files = selectedFiles.filter(file => file.type === 'audio/mpeg' || file.name.endsWith('.mp3'));

    if (mp3Files.length !== selectedFiles.length) {
      setMessage({ type: 'error', text: 'Seuls les fichiers MP3 sont acceptés / Only MP3 files accepted' });
    }

    setFiles(prev => [...prev, ...mp3Files].slice(0, 10)); // Max 10 files
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const mp3Files = droppedFiles.filter(file => file.type === 'audio/mpeg' || file.name.endsWith('.mp3'));

    if (mp3Files.length !== droppedFiles.length) {
      setMessage({ type: 'error', text: 'Seuls les fichiers MP3 sont acceptés / Only MP3 files accepted' });
    }

    setFiles(prev => [...prev, ...mp3Files].slice(0, 10));
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit to Dropbox
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!artistName.trim()) {
      setMessage({ type: 'error', text: L.errorArtistName });
      return;
    }
    if (files.length === 0) {
      setMessage({ type: 'error', text: L.errorFiles });
      return;
    }

    setUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('artistName', artistName);
      formData.append('userEmail', user?.email || 'unknown');
      formData.append('userId', user?.id || 'unknown');

      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // Call Supabase Edge Function
      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://gpcedzaflhiucwyjgdai.supabase.co';
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-music`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      // Success
      setMessage({ type: 'success', text: L.success });
      setArtistName('');
      setFiles([]);

      // Show success message for longer
      setTimeout(() => {
        setMessage(prev => prev?.type === 'success' ? { ...prev, text: L.successMessage } : prev);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: L.errorUpload });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Seo
        lang={lang}
        title={L.title}
        description={L.description}
        path="/submit-music"
        type="website"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {L.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {L.description}
        </p>
      </div>

      {/* Not logged in */}
      {!user && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            {L.loginRequired}
          </h2>
          <p className="text-yellow-800 dark:text-yellow-300 mb-4">
            {L.loginMessage}
          </p>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              {L.loginButton}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              {L.registerButton}
            </Link>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {L.howItWorks}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold text-red-600 dark:text-red-400 mb-1">{L.step1}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{L.step1Desc}</p>
          </div>
          <div>
            <div className="font-semibold text-red-600 dark:text-red-400 mb-1">{L.step2}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{L.step2Desc}</p>
          </div>
          <div>
            <div className="font-semibold text-red-600 dark:text-red-400 mb-1">{L.step3}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{L.step3Desc}</p>
          </div>
          <div>
            <div className="font-semibold text-red-600 dark:text-red-400 mb-1">{L.step4}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{L.step4Desc}</p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      {user && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Artist Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {L.artistName} *
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder={L.artistNamePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              required
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {L.uploadFiles} *
            </label>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-red-600 dark:hover:border-red-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                accept="audio/mpeg,.mp3"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  📁 {L.uploadInstruction}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {L.uploadNote}
                </div>
              </label>
            </div>

            {/* Selected files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {files.length} {L.filesSelected}
                </div>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">🎵</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      {L.removeFile}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? L.submitting : L.submit}
          </button>
        </form>
      )}

      {/* Important MP3 Tags Section */}
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
          <span>⚠️</span> {L.importantTitle}
        </h2>
        <p className="text-red-800 dark:text-red-300 mb-4">
          {L.importantDesc}
        </p>

        <div className="mb-4">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
            {L.mp3TagsTitle}
          </h3>
          <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
            <li className="flex items-center gap-2">
              <span className="text-red-600">✓</span> {L.mp3Tag1}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-600">✓</span> {L.mp3Tag2}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-600">✓</span> {L.mp3Tag3}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-600">✓</span> {L.mp3Tag4}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-600">✓</span> {L.mp3Tag5}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-600">✓</span> {L.mp3Tag6}
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {L.verifyTitle}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {L.verifyDesc}
          </p>
          <a
            href="https://kemp3.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            {L.verifyLink}
          </a>
          <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">
            {L.verifyNote}
          </p>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {L.guidelines}
        </h2>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
            <span>{L.guideline1}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
            <span>{L.guideline2}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
            <span>{L.guideline3}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
            <span>{L.guideline4}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
            <span>{L.guideline5}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
