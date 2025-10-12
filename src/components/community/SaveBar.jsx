// src/components/community/SaveBar.jsx
import React from 'react';
import { useI18n } from '../../i18n';

export default function SaveBar({
  onSave,
  onCancel,
  loading = false,
  disabled = false,
  message = null,
  saveText = null,
  cancelText = null
}) {
  const { t } = useI18n();
  const common = t?.common ?? {};
  const effectiveSaveLabel = saveText ?? (common.save ?? 'Enregistrer');
  const effectiveCancelLabel = cancelText ?? (common.cancel ?? 'Annuler');
  const savingInProgress = common.savingInProgress ?? 'Enregistrement en cours...';
  const noChanges = common.noChanges ?? 'Aucune modification à enregistrer';
  const saving = common.saving ?? 'Enregistrement...';

  return (
    <>
      {/* Messages de feedback */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Barre de sauvegarde */}
      <div className="bg-bg-secondary border-t border-border p-4 mt-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {loading && `💾 ${savingInProgress}`}
            {!loading && disabled && `⚠️ ${noChanges}`}
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {effectiveCancelLabel}
              </button>
            )}

            <button
              onClick={onSave}
              disabled={loading || disabled}
              className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg
                       hover:bg-accent-hover transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bg-primary"></div>
                  {saving}
                </>
              ) : (
                <>
                  💾 {effectiveSaveLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
