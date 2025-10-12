import { useTranslation } from 'react-i18next'

export const DraftPage = () => {
  const { t } = useTranslation()

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('draft.title')}</h2>
          <p className="text-sm text-slate-400">{t('draft.description')}</p>
        </div>
        <button className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">
          {t('draft.actions.launchDraftRoom')}
        </button>
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t('draft.prospectRankings.title')}
        </h3>
        <p className="mt-2 text-sm text-slate-400">{t('draft.prospectRankings.description')}</p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t('draft.development.title')}
        </h3>
        <p className="mt-2 text-sm text-slate-400">{t('draft.development.description')}</p>
      </div>
    </section>
  )
}
