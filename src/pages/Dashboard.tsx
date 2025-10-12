import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLeagueTeamsQuery } from '../api/teams'
import { useLeagueScheduleQuery } from '../api/schedule'
import { useAiJobsQuery } from '../api/aiJobs'
import { createLeague } from '../api/leagues'
import { useLeagueStore } from '../state/useLeagueStore'
import { useSessionContext } from '../providers/SessionProvider'

export const Dashboard = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { session } = useSessionContext()
  const { leagues, selectedLeagueId, selectLeague } = useLeagueStore()
  const [isCreatingLeague, setIsCreatingLeague] = useState(false)
  const [leagueName, setLeagueName] = useState('')
  const [salaryCap, setSalaryCap] = useState(82_500_000)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createMessage, setCreateMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeLeague = useMemo(
    () => leagues.find((league) => league.id === selectedLeagueId) ?? null,
    [leagues, selectedLeagueId],
  )
  const leagueCount = leagues.length
  const pendingLeagues = leagues.filter((league) => league.status === 'pending').length

  const { data: teams = [], isLoading: teamsLoading } = useLeagueTeamsQuery(selectedLeagueId)
  const { data: schedule = [], isLoading: scheduleLoading } = useLeagueScheduleQuery(selectedLeagueId, 10)
  const { data: aiJobs = [], isFetching: aiJobsFetching, refetch: refetchAiJobs } = useAiJobsQuery(selectedLeagueId)
  const nhlTeams = teams.filter((team) => team.level === 'NHL').length
  const ahlTeams = teams.filter((team) => team.level === 'AHL').length
  const scheduledGames = schedule.filter((item) => item.game?.status === 'scheduled' || !item.game).length
  const finals = schedule.filter((item) => item.game?.status === 'final').length
  const inProgress = schedule.filter((item) => item.game?.status === 'in_progress').length
  const queuedJobs = aiJobs.filter((job) => job.status === 'queued').length
  const runningJobs = aiJobs.filter((job) => job.status === 'running').length
  const failedJobs = aiJobs.filter((job) => job.status === 'failed').length
  const completedJobs = aiJobs.filter((job) => job.status === 'completed').length

  const handleCreateLeague = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!leagueName.trim()) {
      setCreateError(t('dashboard.createLeague.form.errors.nameRequired'))
      return
    }
    setCreateError(null)
    setCreateMessage(null)
    setIsSubmitting(true)
    try {
      const commissionerName =
        session?.user?.user_metadata?.display_name ?? session?.user?.email ?? 'Commissioner'
      const leagueId = await createLeague({
        name: leagueName.trim(),
        salaryCap,
        displayName: commissionerName,
      })
      await queryClient.invalidateQueries({ queryKey: ['leagues'] })
      selectLeague(leagueId)
      setCreateMessage(t('dashboard.createLeague.form.success'))
      setLeagueName('')
      setSalaryCap(82_500_000)
      setIsCreatingLeague(false)
    } catch (error: any) {
      setCreateError(error?.message ?? t('dashboard.createLeague.form.errors.default'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-50">{t('dashboard.title')}</h2>
        <p className="text-sm text-slate-400">{t('dashboard.description')}</p>
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        {isCreatingLeague ? (
          <form className="space-y-3" onSubmit={handleCreateLeague}>
            <div>
              <label htmlFor="league-name" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('dashboard.createLeague.form.leagueNameLabel')}
              </label>
              <input
                id="league-name"
                value={leagueName}
                onChange={(event) => setLeagueName(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
                placeholder={t('dashboard.createLeague.form.leagueNamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="league-salary" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('dashboard.createLeague.form.salaryCapLabel')}
              </label>
              <input
                id="league-salary"
                type="number"
                value={salaryCap}
                onChange={(event) => setSalaryCap(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
                min={0}
                step={100000}
              />
            </div>
            {createError && <p className="text-xs text-red-400">{createError}</p>}
            {createMessage && <p className="text-xs text-emerald-400">{createMessage}</p>}
            <div className="flex gap-2 text-xs font-semibold">
              <button
                type="submit"
                className="rounded-md bg-sky-500 px-3 py-2 text-white hover:bg-sky-400 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('dashboard.createLeague.form.submitting') : t('dashboard.createLeague.form.submit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingLeague(false)
                  setCreateError(null)
                  setCreateMessage(null)
                }}
                className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500"
              >
                {t('dashboard.createLeague.form.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">{t('dashboard.createLeague.cardTitle')}</h3>
              <p className="text-xs text-slate-500">{t('dashboard.createLeague.cardDescription')}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingLeague(true)}
              className="rounded-md border border-sky-600 px-3 py-2 text-xs font-semibold text-sky-200 hover:border-sky-400"
            >
              {t('dashboard.createLeague.toggleButton')}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">{t('dashboard.cards.leagues.title')}</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">{leagueCount}</p>
          <p className="text-xs text-slate-400">
            {pendingLeagues > 0
              ? t('dashboard.cards.leagues.pending', { count: pendingLeagues })
              : t('dashboard.cards.leagues.completed')}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">{t('dashboard.cards.currentLeague.title')}</h3>
          <p className="mt-2 text-lg text-slate-100">
            {activeLeague?.name ?? t('dashboard.cards.currentLeague.noSelection')}
          </p>
          <p className="text-xs text-slate-400">
            {t('dashboard.cards.currentLeague.season', { season: activeLeague?.seasonYear ?? '—' })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">{t('dashboard.cards.teams.title')}</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {teamsLoading ? '...' : `${nhlTeams + ahlTeams}`}
          </p>
          <p className="text-xs text-slate-400">
            {teamsLoading
              ? t('dashboard.cards.teams.loading')
              : t('dashboard.cards.teams.summary', { nhl: nhlTeams, ahl: ahlTeams })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">{t('dashboard.cards.games.title')}</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {scheduleLoading ? '...' : scheduledGames}
          </p>
          <p className="text-xs text-slate-400">
            {scheduleLoading
              ? t('dashboard.cards.games.loading')
              : t('dashboard.cards.games.summary', { inProgress, final: finals })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200">{t('dashboard.cards.jobs.title')}</h3>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-100">
              {aiJobsFetching && aiJobs.length === 0 ? '...' : queuedJobs + runningJobs}
            </p>
            <button
              type="button"
              onClick={() => refetchAiJobs()}
              className="text-xs text-slate-400 hover:text-slate-200"
              disabled={aiJobsFetching}
            >
              {t('dashboard.cards.jobs.refresh')}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            {aiJobsFetching && aiJobs.length > 0
              ? t('dashboard.cards.jobs.loading')
              : t('dashboard.cards.jobs.summary', { running: runningJobs, queued: queuedJobs })}
          </p>
          <p className="text-xs text-slate-500">
            {t('dashboard.cards.jobs.totals', { failed: failedJobs, completed: completedJobs })}
          </p>
        </div>
      </div>
    </section>
  )
}
