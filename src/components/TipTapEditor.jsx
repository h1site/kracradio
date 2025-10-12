// src/components/TipTapEditor.jsx
import React, { useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { supabase } from '../lib/supabaseClient';
import { useI18n } from '../i18n';

const STRINGS = {
  fr: {
    uploadError: 'Erreur lors du téléversement de l\'image: ',
    uploadChoice: 'Voulez-vous téléverser une image depuis votre ordinateur?\n\nOK = Téléverser\nAnnuler = Insérer une URL',
    imageUrlPrompt: 'URL de l\'image:',
    youtubeUrlPrompt: 'URL YouTube:',
    urlPrompt: 'URL:',
    textColorPrompt: 'Couleur du texte (ex: #ff0000):',
    highlightColorPrompt: 'Couleur de surlignage (ex: #ffff00):',
    bold: 'Gras (Ctrl+B)',
    italic: 'Italique (Ctrl+I)',
    underline: 'Souligné (Ctrl+U)',
    strike: 'Barré',
    inlineCode: 'Code inline',
    superscript: 'Exposant',
    subscript: 'Indice',
    paragraph: 'Paragraphe',
    heading1: 'Titre 1',
    heading2: 'Titre 2',
    heading3: 'Titre 3',
    heading4: 'Titre 4',
    heading5: 'Titre 5',
    heading6: 'Titre 6',
    alignLeft: 'Aligner à gauche',
    alignCenter: 'Centrer',
    alignRight: 'Aligner à droite',
    justify: 'Justifier',
    bulletList: 'Liste à puces',
    orderedList: 'Liste numérotée',
    blockquote: 'Citation',
    codeBlock: 'Bloc de code',
    textColor: 'Couleur du texte',
    highlight: 'Surligner',
    clearFormatting: 'Effacer le formatage',
    insertImage: 'Insérer une image',
    uploading: 'Téléversement en cours...',
    youtube: 'Vidéo YouTube',
    insertLink: 'Insérer un lien',
    insertTable: 'Insérer un tableau',
    undo: 'Annuler (Ctrl+Z)',
    redo: 'Refaire (Ctrl+Y)',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    placeholder: 'Commencez à écrire votre article... Utilisez la barre d\'outils pour formater'
  },
  en: {
    uploadError: 'Error uploading image: ',
    uploadChoice: 'Do you want to upload an image from your computer?\n\nOK = Upload\nCancel = Insert a URL',
    imageUrlPrompt: 'Image URL:',
    youtubeUrlPrompt: 'YouTube URL:',
    urlPrompt: 'URL:',
    textColorPrompt: 'Text color (e.g. #ff0000):',
    highlightColorPrompt: 'Highlight color (e.g. #ffff00):',
    bold: 'Bold (Ctrl+B)',
    italic: 'Italic (Ctrl+I)',
    underline: 'Underline (Ctrl+U)',
    strike: 'Strikethrough',
    inlineCode: 'Inline code',
    superscript: 'Superscript',
    subscript: 'Subscript',
    paragraph: 'Paragraph',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    heading4: 'Heading 4',
    heading5: 'Heading 5',
    heading6: 'Heading 6',
    alignLeft: 'Align left',
    alignCenter: 'Center',
    alignRight: 'Align right',
    justify: 'Justify',
    bulletList: 'Bullet list',
    orderedList: 'Numbered list',
    blockquote: 'Quote',
    codeBlock: 'Code block',
    textColor: 'Text color',
    highlight: 'Highlight',
    clearFormatting: 'Clear formatting',
    insertImage: 'Insert an image',
    uploading: 'Uploading...',
    youtube: 'YouTube video',
    insertLink: 'Insert link',
    insertTable: 'Insert table',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    placeholder: 'Start writing your article... Use the toolbar to format'
  },
  es: {
    uploadError: 'Error al subir la imagen: ',
    uploadChoice: '¿Quieres subir una imagen desde tu computadora?\n\nAceptar = Subir\nCancelar = Insertar una URL',
    imageUrlPrompt: 'URL de la imagen:',
    youtubeUrlPrompt: 'URL de YouTube:',
    urlPrompt: 'URL:',
    textColorPrompt: 'Color del texto (ej.: #ff0000):',
    highlightColorPrompt: 'Color de resaltado (ej.: #ffff00):',
    bold: 'Negrita (Ctrl+B)',
    italic: 'Itálica (Ctrl+I)',
    underline: 'Subrayado (Ctrl+U)',
    strike: 'Tachado',
    inlineCode: 'Código en línea',
    superscript: 'Superíndice',
    subscript: 'Subíndice',
    paragraph: 'Párrafo',
    heading1: 'Título 1',
    heading2: 'Título 2',
    heading3: 'Título 3',
    heading4: 'Título 4',
    heading5: 'Título 5',
    heading6: 'Título 6',
    alignLeft: 'Alinear a la izquierda',
    alignCenter: 'Centrar',
    alignRight: 'Alinear a la derecha',
    justify: 'Justificar',
    bulletList: 'Lista con viñetas',
    orderedList: 'Lista numerada',
    blockquote: 'Cita',
    codeBlock: 'Bloque de código',
    textColor: 'Color del texto',
    highlight: 'Resaltar',
    clearFormatting: 'Limpiar formato',
    insertImage: 'Insertar una imagen',
    uploading: 'Subiendo...',
    youtube: 'Video de YouTube',
    insertLink: 'Insertar enlace',
    insertTable: 'Insertar tabla',
    undo: 'Deshacer (Ctrl+Z)',
    redo: 'Rehacer (Ctrl+Y)',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    placeholder: 'Comienza a escribir tu artículo... Usa la barra de herramientas para dar formato'
  }
};

const MenuBar = ({ editor, isDarkMode, setIsDarkMode }) => {
  if (!editor) return null;

  const { lang } = useI18n();
  const strings = STRINGS[lang] || STRINGS.fr;

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `article-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('kracradio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('kracradio')
        .getPublicUrl(filePath);

      console.log('Image uploaded, URL:', publicUrl);
      console.log('Editor exists:', !!editor);

      if (editor && !editor.isDestroyed) {
        // Insert as HTML string
        const imageHtml = `<img src="${publicUrl}" alt="Uploaded image" class="max-w-full h-auto rounded-lg" />`;

        editor.chain()
          .focus()
          .insertContent(imageHtml)
          .run();

        console.log('Image HTML inserted:', imageHtml);
      } else {
        console.error('Editor not available or destroyed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(strings.uploadError + error.message);
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const choice = window.confirm(strings.uploadChoice);

    if (choice) {
      // Téléverser
      fileInputRef.current?.click();
    } else {
      // URL
      const url = window.prompt(strings.imageUrlPrompt);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor]);

  const addYouTube = useCallback(() => {
    const url = window.prompt(strings.youtubeUrlPrompt);
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt(strings.urlPrompt, previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setColor = useCallback(() => {
    const color = window.prompt(strings.textColorPrompt, '#000000');
    if (color) {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const setHighlight = useCallback(() => {
    const color = window.prompt(strings.highlightColorPrompt, '#ffff00');
    if (color) {
      editor.chain().focus().setHighlight({ color }).run();
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900/50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadImage(file);
          }
          e.target.value = ''; // Reset input
        }}
      />

      {/* Format de texte de base */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.bold}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-sm font-semibold italic transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.italic}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`rounded px-2 py-1 text-sm font-semibold underline transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('underline') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.underline}
        >
          U
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('strike') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.strike}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`rounded px-2 py-1 text-sm font-mono font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('code') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.inlineCode}
        >
          {'</>'}
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Superscript / Subscript */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`rounded px-2 py-1 text-xs font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('superscript') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.superscript}
        >
          x<sup>2</sup>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`rounded px-2 py-1 text-xs font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('subscript') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.subscript}
        >
          x<sub>2</sub>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Titres dropdown */}
      <div className="relative">
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' :
            editor.isActive('heading', { level: 4 }) ? '4' :
            editor.isActive('heading', { level: 5 }) ? '5' :
            editor.isActive('heading', { level: 6 }) ? '6' :
            'p'
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'p') {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
            }
          }}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-semibold transition hover:bg-gray-50 focus:border-red-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          <option value="p">{strings.paragraph}</option>
          <option value="1">{strings.heading1}</option>
          <option value="2">{strings.heading2}</option>
          <option value="3">{strings.heading3}</option>
          <option value="4">{strings.heading4}</option>
          <option value="5">{strings.heading5}</option>
          <option value="6">{strings.heading6}</option>
        </select>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Alignement */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.alignLeft}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.alignCenter}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.alignRight}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.justify}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
          </svg>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Listes */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.bulletList}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.orderedList}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('blockquote') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.blockquote}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded px-2 py-1 text-sm font-mono font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('codeBlock') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.codeBlock}
        >
          {'{ }'}
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Couleurs et surlignage */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={setColor}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800"
          title={strings.textColor}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M9.62 12L12 5.67 14.38 12M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={setHighlight}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('highlight') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.highlight}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M6 14l3 3-3 3v4h18v-4l-3-3 3-3V6H6v8zm5-6h6v2h-6V8zm0 3h6v2h-6v-2z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800"
          title={strings.clearFormatting}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6zm14 14l1.27-1.27L3.55 0 2.27 1.27 7.73 6.73 5.5 13H8l1.78-5.09 4.99 4.99-1.5 3.1h2.5l1.68-3.44 2.32 2.32L21 14z"/>
          </svg>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Médias */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={addImage}
          disabled={uploading}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-800"
          title={uploading ? strings.uploading : strings.insertImage}
        >
          {uploading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={addYouTube}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800"
          title={strings.youtube}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M10 16.5l6-4.5-6-4.5v9zM23 12s0-3.5-.5-5c-.3-.8-1-1.5-1.8-1.8C19 5 12 5 12 5s-7 0-8.7.2c-.8.3-1.5 1-1.8 1.8C1 8.5 1 12 1 12s0 3.5.5 5c.3.8 1 1.5 1.8 1.8C5 19 12 19 12 19s7 0 8.7-.2c.8-.3 1.5-1 1.8-1.8.5-1.5.5-5 .5-5z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={setLink}
          className={`rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800 ${
            editor.isActive('link') ? 'bg-gray-300 dark:bg-gray-700' : ''
          }`}
          title={strings.insertLink}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Table */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800"
          title={strings.insertTable}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/>
          </svg>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-800"
          title={strings.undo}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="rounded px-2 py-1 text-sm font-semibold transition hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-800"
          title={strings.redo}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
          </svg>
        </button>
      </div>

      <div className="ml-auto h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* Dark Mode Toggle */}
      <button
        type="button"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="ml-2 rounded px-3 py-1 text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-800"
        title={isDarkMode ? strings.lightMode : strings.darkMode}
      >
        {isDarkMode ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default function TipTapEditor({ content, onChange }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { lang } = useI18n();
  const strings = STRINGS[lang] || STRINGS.fr;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 underline hover:text-red-700',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: strings.placeholder,
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[500px] px-6 py-4',
      },
    },
  });

  // Mettre à jour le contenu quand il change
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={`overflow-hidden rounded-xl border shadow-2xl ${isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'}`}>
      <MenuBar editor={editor} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div className={isDarkMode ? 'dark' : ''}>
        <EditorContent editor={editor} />
      </div>

      {/* TipTap Styles */}
      <style>{`
        .tiptap-editor {
          color: ${isDarkMode ? '#e5e7eb' : '#1f2937'};
          font-size: 16px;
          line-height: 1.8;
        }

        .tiptap-editor h1 {
          font-size: 2.5em;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: ${isDarkMode ? '#f9fafb' : '#111827'};
        }

        .tiptap-editor h2 {
          font-size: 2em;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: ${isDarkMode ? '#f9fafb' : '#111827'};
        }

        .tiptap-editor h3 {
          font-size: 1.5em;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
        }

        .tiptap-editor h4 {
          font-size: 1.25em;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
        }

        .tiptap-editor h5 {
          font-size: 1.125em;
          font-weight: 600;
          line-height: 1.5;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: ${isDarkMode ? '#f3f4f6' : '#374151'};
        }

        .tiptap-editor h6 {
          font-size: 1em;
          font-weight: 600;
          line-height: 1.5;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: ${isDarkMode ? '#f3f4f6' : '#374151'};
        }

        .tiptap-editor p {
          margin-top: 1em;
          margin-bottom: 1em;
        }

        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${isDarkMode ? '#6b7280' : '#9ca3af'};
          pointer-events: none;
          height: 0;
        }

        .tiptap-editor a {
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap-editor a:hover {
          color: ${isDarkMode ? '#93c5fd' : '#2563eb'};
        }

        .tiptap-editor strong {
          font-weight: 700;
        }

        .tiptap-editor em {
          font-style: italic;
        }

        .tiptap-editor code {
          background: ${isDarkMode ? '#374151' : '#f3f4f6'};
          color: ${isDarkMode ? '#f87171' : '#dc2626'};
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: 'Courier New', monospace;
        }

        .tiptap-editor pre {
          background: ${isDarkMode ? '#1f2937' : '#f9fafb'};
          border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
          padding: 1em;
          margin: 1.5em 0;
          overflow-x: auto;
        }

        .tiptap-editor pre code {
          background: none;
          color: ${isDarkMode ? '#e5e7eb' : '#374151'};
          padding: 0;
          font-size: 0.875em;
        }

        .tiptap-editor blockquote {
          border-left: 4px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
        }

        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        .tiptap-editor ul {
          list-style-type: disc;
        }

        .tiptap-editor ol {
          list-style-type: decimal;
        }

        .tiptap-editor li {
          margin: 0.5em 0;
        }

        .tiptap-editor ul ul,
        .tiptap-editor ol ul {
          list-style-type: circle;
        }

        .tiptap-editor ol ol,
        .tiptap-editor ul ol {
          list-style-type: lower-alpha;
        }

        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5em 0;
          display: block;
        }

        .tiptap-editor hr {
          border: none;
          border-top: 2px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          margin: 2em 0;
        }

        .tiptap-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5em 0;
          overflow: hidden;
          border-radius: 8px;
        }

        .tiptap-editor table td,
        .tiptap-editor table th {
          border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          padding: 0.75em 1em;
          text-align: left;
        }

        .tiptap-editor table th {
          background: ${isDarkMode ? '#1f2937' : '#f9fafb'};
          font-weight: 600;
        }

        .tiptap-editor table tr:nth-child(even) {
          background: ${isDarkMode ? '#111827' : '#f9fafb'};
        }

        .tiptap-editor mark {
          background: ${isDarkMode ? '#fbbf24' : '#fef3c7'};
          color: ${isDarkMode ? '#000' : '#92400e'};
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        .tiptap-editor .ProseMirror-selectednode {
          outline: 3px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'};
        }

        /* YouTube embeds */
        .tiptap-editor iframe {
          border-radius: 8px;
          margin: 1.5em 0;
        }

        /* Text alignment */
        .tiptap-editor [style*="text-align: center"] {
          text-align: center;
        }

        .tiptap-editor [style*="text-align: right"] {
          text-align: right;
        }

        .tiptap-editor [style*="text-align: justify"] {
          text-align: justify;
        }
      `}</style>
    </div>
  );
}
