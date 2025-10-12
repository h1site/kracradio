import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMyAssignedTeamsQuery } from '../api/teams'
import { useRosterQuery, useUpdatePlayerRosterAssignment, type RosterEntry } from '../api/roster'
import { useLeagueStore } from '../state/useLeagueStore'
import { PlayerLink } from '../components/player/PlayerLink'

type SortDirection = 'asc' | 'desc'
type SortKey = string

const skaterRatingColumns = ['CK', 'FG', 'DI', 'SK', 'ST', 'EN', 'DU', 'PH', 'FO', 'PA', 'SC', 'DF', 'PS', 'EX', 'LD', 'PO', 'OV'] as const
const goalieRatingColumns = ['SK', 'DU', 'EN', 'SZ', 'AG', 'RB', 'SC', 'HS', 'RT', 'PC', 'PS', 'EX', 'LD', 'PO', 'ST', 'OV'] as const

type SkaterRatingKey = typeof skaterRatingColumns[number]
type GoalieRatingKey = typeof goalieRatingColumns[number]

const getRating = (ratings: Record<string, number>, key: SkaterRatingKey | GoalieRatingKey) => {
  const value = ratings?.[key] ?? ratings?.[key.toLowerCase()]
  return typeof value === 'number' ? value : null
}

interface RosterTableProps {
  title: string
  players: RosterEntry[]
  onMovePlayer?: (rosterId: string, targetTeamId: string) => void
  targetTeamId?: string
  showMoveButtons?: boolean
  isGoalies?: boolean
}

const RosterTable = ({ title, players, onMovePlayer, targetTeamId, showMoveButtons, isGoalies = false }: RosterTableProps) => {
  const { t } = useTranslation()
  const ratingColumns = isGoalies ? goalieRatingColumns : skaterRatingColumns
  const [sortKey, setSortKey] = useState<SortKey>('OV')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sort players
  const sortedPlayers = useMemo(() => {
    if (!players || players.length === 0) return []

    const sorted = [...players].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortKey === 'name') {
        aValue = a.player.name.toLowerCase()
        bValue = b.player.name.toLowerCase()
      } else {
        // Rating columns
        aValue = getRating(a.player.ratings, sortKey as any) ?? -1
        bValue = getRating(b.player.ratings, sortKey as any) ?? -1
      }

      if (aValue === bValue) return 0

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }, [players, sortKey, sortDirection])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  if (!players || players.length === 0) {
    return (
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
        <p className="mt-2 text-sm text-slate-500">{t('roster.tables.empty')}</p>
      </div>
    )
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) {
      return <span className="ml-1 text-slate-600">⇅</span>
    }
    return sortDirection === 'desc' ?
      <span className="ml-1 text-sky-400">↓</span> :
      <span className="ml-1 text-sky-400">↑</span>
  }

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full table-fixed text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th
                className="w-52 px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-200 cursor-pointer hover:text-sky-400"
                onClick={() => handleSort('name')}
              >
                {t('roster.tables.headers.playerName')}
                <SortIcon column="name" />
              </th>
              {ratingColumns.map((column) => (
                <th
                  key={column}
                  className="px-2 py-2 text-center font-semibold uppercase tracking-wide cursor-pointer hover:text-sky-400"
                  onClick={() => handleSort(column)}
                >
                  {column}
                  <SortIcon column={column} />
                </th>
              ))}
              {showMoveButtons && (
                <th className="w-24 px-2 py-2 text-center font-semibold uppercase tracking-wide">
                  {t('roster.tables.headers.action', 'Action')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {sortedPlayers.map((entry) => (
              <tr key={entry.id}>
                <td className="px-3 py-2 text-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <PlayerLink
                        playerId={entry.player.id}
                        playerName={entry.player.name}
                        nhlId={entry.player.nhl_id}
                        position={entry.player.position}
                        teamName={entry.teamName}
                        overallRating={entry.player.overall_rating}
                        ratings={entry.player.ratings}
                        className="font-medium"
                      />
                      <p className="text-[10px] uppercase text-slate-500">
                        {entry.player.position} • {entry.status.toUpperCase()}
                      </p>
                    </div>
                    {entry.line && (
                      <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300">
                        L{entry.line}
                      </span>
                    )}
                  </div>
                </td>
                {ratingColumns.map((column) => {
                  const value = getRating(entry.player.ratings, column)
                  return (
                    <td key={column} className="px-2 py-2 text-center text-slate-300">
                      {value !== null ? value : '—'}
                    </td>
                  )
                })}
                {showMoveButtons && onMovePlayer && targetTeamId && (
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => onMovePlayer(entry.id, targetTeamId)}
                      className="rounded border border-sky-600 px-2 py-1 text-[10px] font-semibold text-sky-300 hover:border-sky-400"
                      title={entry.teamLevel === 'NHL' ? t('roster.actions.sendToAhl', 'Send to AHL') : t('roster.actions.callUp', 'Call up')}
                    >
                      {entry.teamLevel === 'NHL' ? '→ AHL' : '→ NHL'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const RosterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedLeagueId, setTeams, setRoster } = useLeagueStore()
  const { data: teams = [], isLoading, error, refetch } = useMyAssignedTeamsQuery(selectedLeagueId)
  const nhlTeam = useMemo(() => teams.find((team) => team.level === 'NHL'), [teams])
  const ahlTeam = useMemo(() => teams.find((team) => team.level === 'AHL'), [teams])
  const [moveFeedback, setMoveFeedback] = useState<{ message?: string; error?: string }>({})

  const {
    data: rosterEntries = [],
    isLoading: rosterLoading,
    error: rosterError,
    refetch: refetchRoster,
  } = useRosterQuery(selectedLeagueId)

  const updatePlayerRosterAssignment = useUpdatePlayerRosterAssignment()

  const handleMovePlayer = async (rosterId: string, targetTeamId: string) => {
    if (!selectedLeagueId) return

    try {
      await updatePlayerRosterAssignment.mutateAsync({
        rosterId,
        teamId: targetTeamId,
        leagueId: selectedLeagueId,
      })
      setMoveFeedback({ message: t('roster.feedback.playerMoved', 'Player moved successfully') })
      setTimeout(() => setMoveFeedback({}), 3000)
    } catch (err: any) {
      setMoveFeedback({ error: err.message || 'Failed to move player' })
      setTimeout(() => setMoveFeedback({}), 5000)
    }
  }

  useEffect(() => {
    setTeams(
      teams.map((team) => ({
        id: team.id,
        leagueId: team.leagueId,
        name: team.name,
        level: team.level,
      })),
    )
  }, [setTeams, teams])

  useEffect(() => {
    const grouped = new Map<string, typeof rosterEntries>()
    rosterEntries.forEach((entry) => {
      if (!grouped.has(entry.teamId)) {
        grouped.set(entry.teamId, [])
      }
      grouped.get(entry.teamId)!.push(entry)
    })

    grouped.forEach((players, teamId) => {
      setRoster(teamId, players.map((player) => ({
        id: player.player.id,
        teamId,
        name: player.player.name,
        position: player.player.position,
        ratings: player.player.ratings,
        status: player.status,
        teamLevel: player.teamLevel,
        line: player.line,
      })))
    })
  }, [rosterEntries, setRoster])

  const nhlRoster = useMemo(() => {
    if (!nhlTeam) return []
    return rosterEntries.filter((entry) => entry.teamId === nhlTeam.id)
  }, [nhlTeam, rosterEntries])

  const ahlRoster = useMemo(() => {
    if (!ahlTeam) return []
    return rosterEntries.filter((entry) => entry.teamId === ahlTeam.id)
  }, [ahlTeam, rosterEntries])

  const splitRoster = (entries: typeof rosterEntries) => {
    const goalies = entries.filter((entry) => entry.player.position === 'G')
    const skaters = entries.filter((entry) => entry.player.position !== 'G')
    return {
      goalies: goalies.sort((a, b) => (a.line ?? 99) - (b.line ?? 99)),
      skaters: skaters.sort((a, b) => (a.line ?? 99) - (b.line ?? 99)),
    }
  }

  const nhlGroups = splitRoster(nhlRoster)
  const ahlGroups = splitRoster(ahlRoster)

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('roster.title')}</h2>
          <p className="text-sm text-slate-400">{t('roster.description')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/lineup')}
            className="rounded-md border border-sky-600 bg-sky-600/20 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-600/30"
          >
            🏒 {t('roster.actions.lineup', 'Manage lines')}
          </button>
          <button
            type="button"
            onClick={() => {
              refetch()
              refetchRoster()
            }}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            {t('roster.actions.refresh')}
          </button>
          <button className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:opacity-60">
            {t('roster.actions.optimize')}
          </button>
          <button className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:opacity-60">
            {t('roster.actions.sendToAhl')}
          </button>
        </div>
      </header>

      {!selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
          {t('roster.noLeague')}
        </div>
      )}

      {selectedLeagueId && !isLoading && teams.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
          {t('roster.noTeamAssigned', 'No team assigned')}
        </div>
      )}

      {selectedLeagueId && teams.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('roster.teams.nhlTitle')}
              </h3>
              {isLoading ? (
                <p className="mt-3 text-sm text-slate-500">{t('roster.teams.loading')}</p>
              ) : nhlTeam ? (
                <div className="mt-3 space-y-1 text-sm text-slate-200">
                  <p className="font-medium">{nhlTeam.name}</p>
                  <p className="text-xs text-slate-400">{nhlTeam.city}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">{t('roster.teams.nhlMissing')}</p>
              )}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('roster.teams.ahlTitle')}
              </h3>
              {isLoading ? (
                <p className="mt-3 text-sm text-slate-500">{t('roster.teams.loading')}</p>
              ) : ahlTeam ? (
                <div className="mt-3 space-y-1 text-sm text-slate-200">
                  <p className="font-medium">{ahlTeam.name}</p>
                  <p className="text-xs text-slate-400">{ahlTeam.city}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">{t('roster.teams.ahlMissing')}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {t('roster.errors.teamsLoad', { message: error.message })}
            </div>
          )}
        </>
      )}

      {selectedLeagueId && teams.length > 0 && (
        <div className="space-y-6">
          {/* Roster Count */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('roster.contractStatus', 'Contract Status')}
              </h3>
              <span className={`text-lg font-bold ${nhlRoster.length > 50 ? 'text-red-400' : 'text-slate-200'}`}>
                {nhlRoster.length} / 50
              </span>
            </div>
            {nhlRoster.length > 50 && (
              <p className="mt-2 text-xs text-red-400">
                {t('roster.overLimit', 'Over contract limit! You must reduce your roster.')}
              </p>
            )}
          </div>

          {/* Move Feedback */}
          {moveFeedback.message && (
            <div className="rounded-lg border border-green-600/50 bg-green-900/20 p-3 text-sm text-green-200">
              {moveFeedback.message}
            </div>
          )}
          {moveFeedback.error && (
            <div className="rounded-lg border border-red-600/50 bg-red-900/20 p-3 text-sm text-red-200">
              {moveFeedback.error}
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('roster.rosterSections.nhl')}
              </h3>
              <span className="text-xs text-slate-500">
                {nhlRoster.length} {t('roster.players', 'players')}
              </span>
            </div>
            {rosterLoading ? (
              <p className="mt-3 text-sm text-slate-500">{t('roster.tables.loadingPlayers')}</p>
            ) : nhlRoster.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('roster.tables.nhlEmpty')}</p>
            ) : (
              <div className="space-y-6">
                <RosterTable
                  title={t('roster.tables.forwardsDefense', 'Forwards & Defense')}
                  players={nhlGroups.skaters}
                  onMovePlayer={handleMovePlayer}
                  targetTeamId={ahlTeam?.id}
                  showMoveButtons={!!ahlTeam}
                />
                <RosterTable
                  title={t('roster.tables.goaltenders', 'Gardiens')}
                  players={nhlGroups.goalies}
                  onMovePlayer={handleMovePlayer}
                  targetTeamId={ahlTeam?.id}
                  showMoveButtons={!!ahlTeam}
                  isGoalies={true}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('roster.rosterSections.ahl')}
              </h3>
              <span className="text-xs text-slate-500">
                {ahlRoster.length} {t('roster.players', 'players')}
              </span>
            </div>
            {rosterLoading ? (
              <p className="mt-3 text-sm text-slate-500">{t('roster.tables.loadingPlayers')}</p>
            ) : ahlRoster.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('roster.tables.ahlEmpty')}</p>
            ) : (
              <div className="space-y-6">
                <RosterTable
                  title={t('roster.tables.skaters', 'Skaters')}
                  players={ahlGroups.skaters}
                  onMovePlayer={handleMovePlayer}
                  targetTeamId={nhlTeam?.id}
                  showMoveButtons={!!nhlTeam}
                />
                <RosterTable
                  title={t('roster.tables.goaltenders', 'Gardiens')}
                  players={ahlGroups.goalies}
                  onMovePlayer={handleMovePlayer}
                  targetTeamId={nhlTeam?.id}
                  showMoveButtons={!!nhlTeam}
                  isGoalies={true}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(rosterError || error) && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error && <p>{t('roster.errors.teamsLoad', { message: error.message })}</p>}
          {rosterError && <p>{t('roster.errors.rosterLoad', { message: rosterError.message })}</p>}
        </div>
      )}
    </section>
  )
}
