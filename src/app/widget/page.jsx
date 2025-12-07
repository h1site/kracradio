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

const THEMES = [
  { key: 'dark', name: 'Sombre' },
  { key: 'light', name: 'Clair' }
];

const WIDTHS = [
  { key: '350', name: 'Petit (350px)' },
  { key: '400', name: 'Moyen (400px)' },
  { key: '450', name: 'Grand (450px)' }
];

export default function WidgetPage() {
  const { t } = useI18n();
  const [selectedChannel, setSelectedChannel] = useState('kracradio');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedWidth, setSelectedWidth] = useState('400');
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://kracradio.com/embed.js" data-channel="${selectedChannel}" data-theme="${selectedTheme}" data-width="${selectedWidth}"></script>`;

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
            Ajoutez notre lecteur radio sur votre site web avec une simple ligne de code
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

            {/* Theme Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Thème</h2>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map(th => (
                  <button
                    key={th.key}
                    onClick={() => setSelectedTheme(th.key)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      selectedTheme === th.key
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    {th.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Width Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Largeur</h2>
              <div className="grid grid-cols-3 gap-3">
                {WIDTHS.map(w => (
                  <button
                    key={w.key}
                    onClick={() => setSelectedWidth(w.key)}
                    className={`py-3 px-4 rounded-lg border transition-all text-sm ${
                      selectedWidth === w.key
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    {w.name}
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
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-sm text-green-400 font-mono whitespace-pre-wrap break-all">
                {embedCode}
              </pre>
              <p className="mt-3 text-xs text-gray-500">
                Collez ce code dans le HTML de votre site, là où vous voulez afficher le widget.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Aperçu en direct</h2>
              <div
                className={`rounded-xl p-4 flex items-center justify-center ${
                  selectedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                style={{ minHeight: '220px' }}
              >
                {/* Live preview using the actual script */}
                <div
                  id="widget-preview"
                  key={`${selectedChannel}-${selectedTheme}-${selectedWidth}`}
                  dangerouslySetInnerHTML={{
                    __html: `<script src="/embed.js" data-channel="${selectedChannel}" data-theme="${selectedTheme}" data-width="${selectedWidth}"></script>`
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">
                Aperçu fonctionnel - cliquez sur play pour tester!
              </p>
            </div>

            {/* Features */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Avantages</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span><strong>Une seule ligne de code</strong> - Simple à intégrer</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span><strong>Backlink garanti</strong> - Le code ne peut pas être modifié</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Affiche la chanson en cours avec pochette</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Contrôle du volume intégré</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Thème sombre ou clair</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Mise à jour automatique des infos</span>
                </li>
                {selectedChannel === 'all' && (
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Navigation entre toutes les chaînes</span>
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

        {/* Technical Info */}
        <div className="mt-12 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Informations techniques</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <h3 className="font-medium text-white mb-2">Compatibilité</h3>
              <p>Fonctionne sur tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Performance</h3>
              <p>Script léger (~8KB), chargement asynchrone, aucun impact sur votre SEO</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Sécurité</h3>
              <p>Aucune donnée collectée, pas de cookies, respecte la vie privée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
