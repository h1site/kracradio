'use client';

import { useState } from 'react';
import { useI18n } from '../../i18n';

const CHANNELS = [
  { key: 'all', name: 'Toutes les chaînes (avec sélecteur)' },
  { key: 'kracradio', name: 'KracRadio (principale)' },
  { key: 'ebm_industrial', name: 'EBM Industrial' },
  { key: 'electro', name: 'Electro' },
  { key: 'francophonie', name: 'Francophonie' },
  { key: 'jazz', name: 'Jazz' },
  { key: 'metal', name: 'Metal' },
  { key: 'rock', name: 'Rock' }
];

const SIZES = [
  { key: 'small', name: 'Petit', width: 350, height: 200 },
  { key: 'medium', name: 'Moyen', width: 420, height: 220 },
  { key: 'large', name: 'Grand', width: 500, height: 240 }
];

export default function WidgetPage() {
  const { t } = useI18n();
  const [selectedChannel, setSelectedChannel] = useState('kracradio');
  const [selectedSize, setSelectedSize] = useState('medium');
  const [copied, setCopied] = useState(false);

  const size = SIZES.find(s => s.key === selectedSize);
  const embedUrl = `https://kracradio.com/embed/${selectedChannel}`;

  const embedCode = `<iframe
  src="${embedUrl}"
  width="${size.width}"
  height="${size.height}"
  frameborder="0"
  allow="autoplay; encrypted-media"
  style="border-radius: 12px; overflow: hidden;"
  title="KracRadio Player"
></iframe>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Widget KracRadio</h1>
          <p className="text-gray-400 text-lg">
            Ajoutez notre lecteur radio sur votre site web
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Options */}
          <div className="space-y-6">
            {/* Channel Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Chaîne</h2>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              >
                {CHANNELS.map(ch => (
                  <option key={ch.key} value={ch.key} className="bg-gray-900">
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Taille</h2>
              <div className="grid grid-cols-3 gap-3">
                {SIZES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedSize(s.key)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      selectedSize === s.key
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-70">{s.width}x{s.height}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Embed Code */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Code à copier</h2>
                <button
                  onClick={copyCode}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {copied ? '✓ Copié!' : 'Copier'}
                </button>
              </div>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
                {embedCode}
              </pre>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Aperçu</h2>
              <div
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-center"
                style={{ minHeight: size.height + 40 }}
              >
                <iframe
                  src={embedUrl}
                  width={size.width}
                  height={size.height}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  style={{ borderRadius: '12px', overflow: 'hidden' }}
                  title="KracRadio Player Preview"
                />
              </div>
            </div>

            {/* Features */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Caractéristiques</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Affiche la chanson en cours
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Lecture en un clic
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Design responsive
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Lien vers kracradio.com (backlink)
                </li>
                {selectedChannel === 'all' && (
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    Sélecteur de chaînes intégré
                  </li>
                )}
              </ul>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl p-6 border border-red-500/30">
              <h3 className="font-semibold mb-2">Besoin d'aide?</h3>
              <p className="text-gray-300 text-sm mb-3">
                Si vous avez des questions sur l'intégration du widget, contactez-nous.
              </p>
              <a
                href="/contact"
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Nous contacter →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
