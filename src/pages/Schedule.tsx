import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLeagueScheduleQuery, generateSchedule, useImportNHLSchedule } from '../api/schedule'
import { useGameEventsQuery, formatGameTime } from '../api/gameEvents'
import { useLeagueTeamsQuery } from '../api/teams'
import { useLeagueStore } from '../state/useLeagueStore'
import { supabase } from '../api/supabaseClient'
import Papa from 'papaparse'

export const SchedulePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [i18n.language],
  )
  const { selectedLeagueId } = useLeagueStore()
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateMessage, setGenerateMessage] = useState<string | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [scheduleStartDate, setScheduleStartDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-10-01`
  })
  const [scheduleEndDate, setScheduleEndDate] = useState('')
  const [gamesPerMatch, setGamesPerMatch] = useState(2)
  const [maxBackToBack, setMaxBackToBack] = useState(2)
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear())
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const importNHLSchedule = useImportNHLSchedule()

  const { data: teams = [] } = useLeagueTeamsQuery(selectedLeagueId)
  const {
    data: schedule = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useLeagueScheduleQuery(selectedLeagueId, 1000) // Show all games in schedule
  const { data: gameEvents = [], isLoading: eventsLoading } = useGameEventsQuery(selectedGameId)

  const teamNameMap = useMemo(() => {
    const map = new Map<string, string>()
    teams.forEach((team) => {
      map.set(team.id, `${team.city} ${team.name}`)
    })
    return map
  }, [teams])

  useEffect(() => {
    if (schedule.length > 0) {
      const firstGame = schedule[0]
      setSelectedGameId(firstGame.game?.id ?? firstGame.schedule.id)
    } else {
      setSelectedGameId(null)
    }
  }, [schedule])

  const handleDebugSimulation = async () => {
    if (!selectedLeagueId) {
      alert('Veuillez sélectionner une ligue')
      return
    }

    try {
      const { data, error } = await supabase.rpc('fn_simulate_next_day_debug', {
        p_league_id: selectedLeagueId,
      })

      if (error) {
        alert(`Erreur: ${error.message}`)
        return
      }

      const debugInfo = data[0]?.debug_info
      alert(`Debug Info:\n${JSON.stringify(debugInfo, null, 2)}`)
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const handleSimulateNextDay = async () => {
    if (!selectedLeagueId) {
      setSimulationError('Veuillez sélectionner une ligue')
      return
    }

    setSimulationError(null)
    setSimulationMessage(null)
    setIsSimulating(true)

    try {
      console.log('🎮 Calling fn_simulate_next_day with leagueId:', selectedLeagueId)

      const { data, error } = await supabase.rpc('fn_simulate_next_day', {
        p_league_id: selectedLeagueId,
      })

      console.log('📊 Result data:', data)
      console.log('❌ Result error:', error)

      // Check for RPC error first
      if (error) {
        console.error('💥 RPC Error:', error)
        throw new Error(error.message || 'Erreur lors de l\'appel RPC')
      }

      // Check if data is valid
      if (!data || data.length === 0) {
        console.error('💥 No data returned from RPC')
        throw new Error('Aucun résultat retourné par la fonction')
      }

      const result = data[0]
      console.log('📦 Parsed result:', result)
      console.log('🔴 Errors:', result?.errors)

      // Check if result structure is valid
      if (!result || typeof result !== 'object') {
        console.error('💥 Invalid result structure:', result)
        throw new Error('Structure de résultat invalide')
      }

      // Check for errors in the result
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        // Filter out null errors
        const validErrors = result.errors.filter((e: any) => e !== null && e !== undefined)
        if (validErrors.length > 0) {
          console.error('Simulation errors:', validErrors)
          setSimulationError(`Jour ${result.day_number}: ${result.games_simulated} matchs simulés\n\nERREURS:\n${validErrors.join('\n')}`)
        } else {
          setSimulationMessage(`Jour ${result.day_number}: ${result.games_simulated} matchs simulés avec succès!`)
        }
      } else if (result.games_simulated === 0) {
        setSimulationMessage('Aucun match à simuler - le calendrier est terminé!')
      } else {
        setSimulationMessage(`Jour ${result.day_number}: ${result.games_simulated} matchs simulés avec succès!`)
      }

      refetch()
    } catch (err: any) {
      console.error('💥 Simulation error:', err)
      setSimulationError(err.message ?? 'Erreur lors de la simulation')
    } finally {
      setIsSimulating(false)
    }
  }

  const handleImportNHLSchedule = async () => {
    if (!selectedLeagueId) {
      setImportError('Please select a league first')
      return
    }

    // Create file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImportError(null)
      setImportMessage(null)
      setIsImporting(true)

      // Parse CSV
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<Record<string, string>>) => {
          try {
            const scheduleData = results.data.map((row: Record<string, string>) => ({
              day: parseInt(row.Day),
              away: row.Away,
              home: row.Home,
            }))

            const result = await importNHLSchedule.mutateAsync({
              leagueId: selectedLeagueId,
              season: seasonYear,
              scheduleData,
              startDate: scheduleStartDate,
            })

            if (result.errors && result.errors.length > 0) {
              setImportError(`Imported ${result.imported_count} games with errors:\n${result.errors.slice(0, 10).join('\n')}${result.errors.length > 10 ? `\n... and ${result.errors.length - 10} more errors` : ''}`)
            } else {
              setImportMessage(`Successfully imported ${result.imported_count} games!`)
            }

            refetch()
          } catch (err: any) {
            setImportError(err.message ?? 'Failed to import NHL schedule')
          } finally {
            setIsImporting(false)
          }
        },
        error: (error: Error) => {
          setImportError(`CSV parsing error: ${error.message}`)
          setIsImporting(false)
        },
      })
    }

    // Trigger file picker
    input.click()
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('schedule.title')}</h2>
          <p className="text-sm text-slate-400">{t('schedule.description')}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-emerald-700 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-60"
            onClick={handleSimulateNextDay}
            disabled={!selectedLeagueId || isSimulating}
          >
            {isSimulating ? 'Simulation...' : '🎮 Simuler Prochaine Journée'}
          </button>
          <button
            className="rounded-md border border-orange-700 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 hover:bg-orange-500/20"
            onClick={handleDebugSimulation}
            disabled={!selectedLeagueId}
          >
            🐛 Debug
          </button>
          <button
            className="rounded-md border border-sky-700 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 disabled:opacity-60"
            onClick={handleImportNHLSchedule}
            disabled={!selectedLeagueId || isImporting}
          >
            {isImporting ? 'Importing...' : 'Import NHL Schedule'}
          </button>
          <button
            className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:opacity-60"
            onClick={() => {
              if (!selectedLeagueId) {
                setGenerateError(t('schedule.errors.generateSelectLeague'))
                return
              }
              setIsGenerateModalOpen(true)
            }}
          >
            {t('schedule.actions.generate')}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isFetching}
          >
            {t('schedule.actions.refresh')}
          </button>
        </div>
      </header>

      {!selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
          {t('schedule.messages.noLeague')}
        </div>
      )}

      {selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t('schedule.upcomingGames.title')}
          </h3>

          {isLoading ? (
            <p className="mt-3 text-sm text-slate-500">{t('schedule.upcomingGames.loading')}</p>
          ) : schedule.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t('schedule.upcomingGames.empty')}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4 font-semibold">{t('schedule.upcomingGames.headers.date')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('schedule.upcomingGames.headers.match')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('schedule.upcomingGames.headers.status')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('schedule.upcomingGames.headers.score')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {schedule.map(({ schedule: item, game }) => {
                    const home = teamNameMap.get(item.homeTeamId) ?? t('schedule.upcomingGames.placeholderHome')
                    const away = teamNameMap.get(item.awayTeamId) ?? t('schedule.upcomingGames.placeholderAway')
                    const statusLabel =
                      game?.status === 'final'
                        ? t('schedule.upcomingGames.status.final')
                        : game?.status === 'in_progress'
                          ? t('schedule.upcomingGames.status.inProgress')
                          : t('schedule.upcomingGames.status.scheduled')
                    const isCompleted = game?.status === 'final'

                    return (
                      <tr
                        key={item.id}
                        className={[
                          selectedGameId === (game?.id ?? item.id) ? 'bg-slate-800/40' : '',
                          'cursor-pointer hover:bg-slate-800/60 transition-colors',
                          isCompleted ? 'hover:bg-sky-900/30' : '',
                        ].join(' ')}
                        onClick={() => {
                          if (isCompleted && game?.id) {
                            navigate(`/game/${game.id}`)
                          } else {
                            setSelectedGameId(game?.id ?? item.id)
                          }
                        }}
                      >
                        <td className="py-3 pr-4 text-slate-300">{dateFormatter.format(new Date(item.date))}</td>
                        <td className="py-3 pr-4 text-slate-200">
                          <span className="font-medium text-slate-100">{away}</span>
                          <span className="mx-2 text-slate-500">{t('schedule.upcomingGames.separator')}</span>
                          <span className="font-medium text-slate-100">{home}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{statusLabel}</td>
                        <td className="py-3 pr-4">
                          {game ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-200">{game.scoreAway} - {game.scoreHome}</span>
                              {isCompleted && (
                                <span className="text-xs text-sky-400">→ Voir détails</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-200">{t('schedule.upcomingGames.scorePlaceholder')}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-400">{t('schedule.errors.load', { message: error.message })}</p>
          )}
          {generateMessage && <p className="mt-3 text-xs text-emerald-400">{generateMessage}</p>}
          {generateError && <p className="mt-3 text-xs text-red-400">{generateError}</p>}
          {simulationMessage && <p className="mt-3 text-xs text-emerald-400">{simulationMessage}</p>}
          {simulationError && <p className="mt-3 text-xs text-red-400">{simulationError}</p>}
          {importMessage && <p className="mt-3 text-xs text-emerald-400">{importMessage}</p>}
          {importError && <p className="mt-3 text-xs text-red-400 whitespace-pre-wrap">{importError}</p>}
          <p className="mt-3 text-xs text-slate-500">{t('schedule.messages.connectRealtime')}</p>
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t('schedule.gameEvents.title')}
        </h3>
        {selectedGameId ? (
          eventsLoading ? (
            <p className="mt-3 text-sm text-slate-500">{t('schedule.gameEvents.loading')}</p>
          ) : gameEvents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t('schedule.gameEvents.empty')}</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {gameEvents.map((event) => {
                const description =
                  typeof event.details?.description === 'string'
                    ? event.details.description
                    : t('schedule.gameEvents.item.fallbackDescription')
                return (
                  <li key={event.id} className="rounded border border-slate-800 bg-slate-900/70 px-3 py-2">
                    <div className="flex items-center justify-between text-xs uppercase text-slate-500">
                      <span>{t('schedule.gameEvents.item.period', { period: event.period })}</span>
                      <span>{formatGameTime(event.game_time_seconds)}</span>
                    </div>
                    <p className="text-sm text-slate-200">
                      {event.event_type.toUpperCase()} — {description}
                    </p>
                  </li>
                )
              })}
            </ul>
          )
        ) : (
          <p className="mt-3 text-sm text-slate-400">{t('schedule.messages.selectGame')}</p>
        )}
      </div>

      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur">
          <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">{t('schedule.generateModal.title')}</h3>
            <p className="mt-1 text-xs text-slate-500">{t('schedule.generateModal.description')}</p>

            <form
              className="mt-4 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!selectedLeagueId) {
                  setGenerateError(t('schedule.generateModal.errors.selectLeague'))
                  return
                }
                setGenerateError(null)
                setGenerateMessage(null)
                setIsGenerating(true)
                try {
                  await generateSchedule(selectedLeagueId, {
                    season: seasonYear,
                    startDate: scheduleStartDate || undefined,
                    endDate: scheduleEndDate || undefined,
                    gamesPerMatch,
                    maxBackToBack,
                  })
                  setGenerateMessage(t('schedule.messages.generateSuccess', { season: seasonYear }))
                  refetch()
                  setIsGenerateModalOpen(false)
                } catch (scheduleError: any) {
                  setGenerateError(scheduleError?.message ?? t('schedule.errors.generate'))
                } finally {
                  setIsGenerating(false)
                }
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('schedule.generateModal.fields.season')}
                  </label>
                  <input
                    type="number"
                    value={seasonYear}
                    onChange={(event) => setSeasonYear(Number(event.target.value))}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    min={1900}
                    max={3000}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('schedule.generateModal.fields.start')}
                  </label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(event) => setScheduleStartDate(event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('schedule.generateModal.fields.end')}
                  </label>
                  <input
                    type="date"
                    value={scheduleEndDate}
                    onChange={(event) => setScheduleEndDate(event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('schedule.generateModal.fields.gamesPerMatch')}
                  </label>
                  <input
                    type="number"
                    value={gamesPerMatch}
                    onChange={(event) => setGamesPerMatch(Math.max(1, Number(event.target.value)))}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    min={1}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('schedule.generateModal.fields.maxBackToBack')}
                  </label>
                  <input
                    type="number"
                    value={maxBackToBack}
                    onChange={(event) => setMaxBackToBack(Math.max(1, Number(event.target.value)))}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    min={1}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  {t('schedule.generateModal.actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sky-500 px-3 py-2 text-white hover:bg-sky-400 disabled:opacity-60"
                  disabled={isGenerating}
                >
                  {isGenerating
                    ? t('schedule.generateModal.actions.generating')
                    : t('schedule.generateModal.actions.generate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
