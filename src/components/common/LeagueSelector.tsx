import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLeaguesQuery } from '../../api/leagues'
import { useLeagueStore } from '../../state/useLeagueStore'

interface LeagueSelectorProps {
  hideLabel?: boolean
}

export const LeagueSelector = ({ hideLabel = false }: LeagueSelectorProps) => {
  const { t } = useTranslation()
  const { leagues, selectedLeagueId, setLeagues, selectLeague } = useLeagueStore()
  const { data, isLoading, error, refetch, isFetching } = useLeaguesQuery()

  const formattedLeagues = useMemo(
    () =>
      (data ?? []).map((league) => ({
        id: league.id,
        name: league.name,
        seasonYear: new Date().getFullYear(),
        membershipId: league.membershipId,
        role: league.role,
        status: league.status,
      })),
    [data],
  )

  useEffect(() => {
    if (formattedLeagues.length > 0) {
      setLeagues(formattedLeagues)
      if (!selectedLeagueId) {
        const firstActive = formattedLeagues.find((league) => league.status === 'active') ?? formattedLeagues[0]
        selectLeague(firstActive.id)
      }
    } else {
      setLeagues([])
      selectLeague(null)
    }
  }, [formattedLeagues, selectLeague, selectedLeagueId, setLeagues])

  return (
    <div className="flex flex-col gap-2">
      {!hideLabel && (
        <label htmlFor="league-selector" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('sidebar.activeLeague')}
        </label>
      )}
      <select
        id="league-selector"
        value={selectedLeagueId ?? ''}
        onChange={(event) => selectLeague(event.target.value || null)}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading || isFetching || formattedLeagues.length === 0}
      >
        <option value="">
          {isLoading
            ? t('leagueSelector.loading')
            : formattedLeagues.length === 0
              ? t('leagueSelector.empty')
              : t('sidebar.selectLeague')}
        </option>
        {leagues.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name}
            {league.status === 'pending' ? t('leagueSelector.pendingTag') : ''}
          </option>
        ))}
      </select>
      <div className="flex items-center justify-between text-xs">
        {error && <p className="text-red-400">{t('leagueSelector.error')}</p>}
        {!isLoading && (
          <button type="button" onClick={() => refetch()} className="text-slate-400 hover:text-slate-200">
            {t('common.refresh')}
          </button>
        )}
      </div>
      {formattedLeagues.length === 0 && !isLoading && !error && (
        <p className="text-xs text-slate-400">{t('leagueSelector.noLeaguesMessage')}</p>
      )}
    </div>
  )
}
