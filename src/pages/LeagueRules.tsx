import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LeagueRulesSettings } from '../components/league/LeagueRulesSettings'

export const LeagueRulesPage = () => {
  const { t } = useTranslation()
  const { leagueId } = useParams<{ leagueId: string }>()
  const navigate = useNavigate()

  if (!leagueId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-50 mb-2">{t('leagueRules.notFoundTitle')}</h2>
          <p className="text-slate-400 mb-4">{t('leagueRules.notFoundDescription')}</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            {t('leagueRules.backToAdmin')}
          </button>
        </div>
      </div>
    )
  }

  return <LeagueRulesSettings leagueId={leagueId} />
}
