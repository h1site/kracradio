import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLeaguesQuery } from '../api/leagues'
import { useLeagueTeamsQuery } from '../api/teams'
import { useRosterQuery, useFreeAgentsQuery, useAssignPlayerToRoster, useRemovePlayerFromRoster, useUpdatePlayerRosterAssignment, useDistributePlayersRandomly, useDeleteAllPlayersFromLeague } from '../api/roster'
import { useLeagueRules } from '../api/leagueRules'
import { PlayerAvatar } from '../components/common/PlayerAvatar'
import { PlayerImport } from '../components/admin/PlayerImport'
import { useGenerateAILineups } from '../api/lineup'

export const RosterManagementPage = () => {
  const { t } = useTranslation()
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [playerNameFilter, setPlayerNameFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(null)
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null)
  const [mainTab, setMainTab] = useState<'team-management' | 'import-players'>('team-management')
  const [selectedTab, setSelectedTab] = useState<'roster' | 'free-agents'>('roster')
  const [feedback, setFeedback] = useState<{ message?: string; error?: string }>({})
  const [isDistributing, setIsDistributing] = useState(false)

  const { data: leagues = [] } = useLeaguesQuery()
  const { data: leagueRules } = useLeagueRules(selectedLeagueId || undefined)
  const { data: teams = [] } = useLeagueTeamsQuery(selectedLeagueId)
  const { data: rosterEntries = [] } = useRosterQuery(selectedLeagueId)
  const { data: freeAgents = [] } = useFreeAgentsQuery(selectedLeagueId)
  const assignPlayerToRoster = useAssignPlayerToRoster()
  const removePlayerFromRoster = useRemovePlayerFromRoster()
  const updatePlayerRosterAssignment = useUpdatePlayerRosterAssignment()
  const distributePlayersRandomly = useDistributePlayersRandomly()
  const deleteAllPlayersFromLeague = useDeleteAllPlayersFromLeague()
  const generateAILineups = useGenerateAILineups()

  // Auto-detect game mode and set the league/team automatically
  useEffect(() => {
    if (!leagues || leagues.length === 0) return

    // Find a league with game mode enabled
    for (const league of leagues) {
      if (league.rules?.leagueOptions?.gameMode && league.rules?.leagueOptions?.gameModeTeamId) {
        setSelectedLeagueId(league.id)
        console.log('🎮 Game mode detected, auto-selected league:', league.name)
        return
      }
    }

    // If no game mode league, select the first league if none is selected
    if (!selectedLeagueId && leagues.length > 0) {
      setSelectedLeagueId(leagues[0].id)
    }
  }, [leagues, selectedLeagueId])

  // Check if current league is in game mode
  const isGameMode = leagueRules?.leagueOptions?.gameMode === true
  const gameModeTeamId = leagueRules?.leagueOptions?.gameModeTeamId

  // Filter rosters based on filters
  const filteredRosterEntries = rosterEntries.filter((entry) => {
    const matchesName = entry.player.name.toLowerCase().includes(playerNameFilter.toLowerCase())
    const matchesTeam = teamFilter === 'all' || entry.teamId === teamFilter
    return matchesName && matchesTeam
  })

  // Filter free agents based on name filter
  const filteredFreeAgents = freeAgents.filter((player) => {
    return player.name.toLowerCase().includes(playerNameFilter.toLowerCase())
  })

  const handleDistributePlayers = async () => {
    if (!selectedLeagueId) return

    const confirmed = confirm(t('rosterManagement.bulk.distribute.confirm'))

    if (!confirmed) return

    setIsDistributing(true)
    setFeedback({})

    try {
      const result = await distributePlayersRandomly.mutateAsync({ leagueId: selectedLeagueId })
      setFeedback({
        message: t('rosterManagement.feedback.distributionSuccess', {
          teams: result.teams,
          total: result.totalPlayers,
          goalies: result.goalies,
          goaliesPerTeam: Math.ceil(result.goalies / result.teams),
          skaters: result.skaters,
        }),
      })
    } catch (err: any) {
      setFeedback({ error: t('rosterManagement.feedback.errorPrefix', { message: err.message }) })
    } finally {
      setIsDistributing(false)
    }
  }

  const handleDeleteAllPlayers = async () => {
    if (!selectedLeagueId) return

    const confirmWord = t('rosterManagement.bulk.delete.confirmWord', 'SUPPRIMER')
    const confirmed = confirm(t('rosterManagement.bulk.delete.confirm', { confirmWord }))

    if (!confirmed) return

    const doubleConfirm = prompt(t('rosterManagement.bulk.delete.prompt', { confirmWord }))
    if (doubleConfirm !== confirmWord) {
      alert(t('rosterManagement.bulk.delete.cancelled'))
      return
    }

    setIsDistributing(true)
    setFeedback({})

    try {
      await deleteAllPlayersFromLeague.mutateAsync({ leagueId: selectedLeagueId })
      setFeedback({
        message: t('rosterManagement.feedback.deleteSuccess'),
      })
    } catch (err: any) {
      setFeedback({ error: t('rosterManagement.feedback.errorPrefix', { message: err.message }) })
    } finally {
      setIsDistributing(false)
    }
  }

  const handleGenerateAILineups = async () => {
    if (!selectedLeagueId) return

    const confirmed = confirm(t('rosterManagement.bulk.ai.confirm'))

    if (!confirmed) return

    setIsDistributing(true)
    setFeedback({})

    try {
      const results = await generateAILineups.mutateAsync({ leagueId: selectedLeagueId })

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      const errors = results.filter(r => !r.success).map(r => `${r.team_name}: ${r.message}`)

      if (failCount > 0) {
        setFeedback({
          message: t('rosterManagement.feedback.aiPartial', { success: successCount, failed: failCount }),
          error: errors.join('\n')
        })
      } else {
        setFeedback({
          message: t('rosterManagement.feedback.aiSuccess', { count: successCount }),
        })
      }
    } catch (err: any) {
      setFeedback({ error: t('rosterManagement.feedback.errorPrefix', { message: err.message }) })
    } finally {
      setIsDistributing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {t('rosterManagement.title', 'Roster Management')}
                {isGameMode && (
                  <span className="ml-3 inline-flex items-center rounded-full bg-green-900/30 px-3 py-1 text-sm font-medium text-green-300 border border-green-600/50">
                    {t('rosterManagement.gameMode.badge', '🎮 Game Mode Active')}
                  </span>
                )}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isGameMode
                  ? t('rosterManagement.gameMode.description', 'You control your team. All other teams are managed by the AI.')
                  : t('rosterManagement.description', 'Manage player and goalie assignments to teams')}
              </p>
              {isGameMode && gameModeTeamId && (
                <p className="mt-1 text-xs text-green-400">
                  {t('rosterManagement.gameMode.assignedTeam', {
                    team: teams.find((team) => team.id === gameModeTeamId)?.name ?? t('common.loading'),
                  })}
                </p>
              )}
            </div>

            {selectedLeagueId && teams.length > 0 && (
              <div className="flex gap-2">
                {isGameMode && (
                  <button
                    onClick={handleGenerateAILineups}
                    disabled={isDistributing}
                    className="rounded-md border border-green-600/50 bg-green-900/20 px-4 py-2 text-sm font-medium text-green-200 hover:bg-green-900/30 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isDistributing
                      ? t('rosterManagement.buttons.generateAiWorking', 'Generating...')
                      : t('rosterManagement.buttons.generateAi', '🤖 Generate AI Lineups')}
                  </button>
                )}
                <button
                  onClick={handleDistributePlayers}
                  disabled={isDistributing}
                  className="rounded-md border border-purple-600/50 bg-purple-900/20 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-900/30 disabled:opacity-50 whitespace-nowrap"
                >
                  {isDistributing
                    ? t('rosterManagement.buttons.distributeWorking', 'Distributing players...')
                    : t('rosterManagement.buttons.distribute', 'Auto-distribute players')}
                </button>
                <button
                  onClick={handleDeleteAllPlayers}
                  disabled={isDistributing}
                  className="rounded-md border border-red-600/50 bg-red-900/20 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-900/30 disabled:opacity-50 whitespace-nowrap"
                >
                  {isDistributing
                    ? t('rosterManagement.buttons.deleteAllWorking', 'Deleting...')
                    : t('rosterManagement.buttons.deleteAll', '🗑️ Delete all players')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* League Selector - Hidden in game mode */}
        {!isGameMode && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              {t('rosterManagement.selectLeague', 'Select League')}
            </label>
            <select
              value={selectedLeagueId || ''}
              onChange={(e) => {
                setSelectedLeagueId(e.target.value || null)
                setTeamFilter('all')
                setPlayerNameFilter('')
              }}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">{t('rosterManagement.selectLeaguePlaceholder', 'Choose a league...')}</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedLeagueId && (
          <>
            {/* Main Tabs */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50">
              <div className="flex gap-4 border-b border-slate-700 p-4">
                <button
                  onClick={() => setMainTab('team-management')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors rounded-md ${
                    mainTab === 'team-management'
                      ? 'bg-sky-500/20 text-sky-300 border-2 border-sky-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('rosterManagement.mainTabs.teamManagement', 'Team Management')}
                </button>
                <button
                  onClick={() => setMainTab('import-players')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors rounded-md ${
                    mainTab === 'import-players'
                      ? 'bg-sky-500/20 text-sky-300 border-2 border-sky-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('rosterManagement.mainTabs.importPlayers', 'Import Players')}
                </button>
              </div>
            </div>

            {mainTab === 'team-management' && (
              <>
                {/* Filters */}
                <div className="grid gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  {t('rosterManagement.filterByName', 'Filter by Player Name')}
                </label>
                <input
                  type="text"
                  value={playerNameFilter}
                  onChange={(e) => setPlayerNameFilter(e.target.value)}
                  placeholder={t('rosterManagement.searchPlaceholder', 'Search player...')}
                  className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  {t('rosterManagement.filterByTeam', 'Filter by Team')}
                </label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="all">{t('rosterManagement.allTeams', 'All Teams')}</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50">
              <div className="flex gap-2 border-b border-slate-700 p-4">
                <button
                  onClick={() => setSelectedTab('roster')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTab === 'roster'
                      ? 'border-b-2 border-sky-500 text-sky-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('rosterManagement.tabs.roster', 'Team Rosters')} ({filteredRosterEntries.length})
                </button>
                <button
                  onClick={() => setSelectedTab('free-agents')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTab === 'free-agents'
                      ? 'border-b-2 border-sky-500 text-sky-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('rosterManagement.tabs.freeAgents', 'Free Agents')} ({filteredFreeAgents.length})
                </button>
              </div>

              {/* Feedback */}
              <div className="p-4">
                {feedback.message && (
                  <div className="mb-4 rounded-md border border-green-600/50 bg-green-900/20 p-3 text-sm text-green-200">
                    {feedback.message}
                  </div>
                )}
                {feedback.error && (
                  <div className="mb-4 rounded-md border border-red-600/50 bg-red-900/20 p-3 text-sm text-red-200">
                    {feedback.error}
                  </div>
                )}

                {/* Team Rosters Tab */}
                {selectedTab === 'roster' && (
                  <div className="space-y-4">
                    {filteredRosterEntries.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        {playerNameFilter || teamFilter !== 'all'
                          ? t('rosterManagement.noResults', 'No players match your filters')
                          : t('rosterManagement.noPlayers', 'No players assigned to teams yet')}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto text-xs">
                          <thead className="bg-slate-900 text-slate-300">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.player', 'Player')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.position', 'Pos')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.overall', 'OVR')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.team', 'Team')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.actions', 'Actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {filteredRosterEntries.map((entry) => (
                              <tr key={entry.id}>
                                <td className="px-3 py-2 text-slate-100">
                                  <div className="flex items-center gap-2">
                                    <PlayerAvatar
                                      nhl_id={entry.player.nhl_id}
                                      name={entry.player.name}
                                      size="md"
                                    />
                                    <span>{entry.player.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-slate-300">{entry.player.position}</td>
                                <td className="px-3 py-2 text-slate-300">{entry.player.ratings?.OV || '-'}</td>
                                <td className="px-3 py-2 text-slate-300">{entry.teamName}</td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setEditingRosterId(entry.id)}
                                      className="rounded border border-slate-600 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-400"
                                    >
                                      {t('rosterManagement.actions.move', 'Move')}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm(t('rosterManagement.confirmRelease', { player: entry.player.name }))) {
                                          try {
                                            await removePlayerFromRoster.mutateAsync({ rosterId: entry.id, leagueId: selectedLeagueId })
                                            setFeedback({ message: t('rosterManagement.feedback.playerReleased', 'Player released to free agency') })
                                          } catch (err: any) {
                                            setFeedback({ error: t('rosterManagement.feedback.errorPrefix', { message: err.message }) })
                                          }
                                        }
                                      }}
                                      className="rounded border border-red-600 px-2 py-1 text-[11px] font-semibold text-red-300 hover:border-red-400"
                                    >
                                      {t('rosterManagement.actions.release', 'Release')}
                                    </button>
                                  </div>

                                  {/* Move Modal */}
                                  {editingRosterId === entry.id && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
                                        <h3 className="mb-4 text-lg font-semibold text-slate-100">
                                          {t('rosterManagement.moveModal.title', { player: entry.player.name })}
                                        </h3>
                                        <div className="max-h-96 space-y-3 overflow-y-auto">
                                          {teams.map((team) => (
                                            <button
                                              key={team.id}
                                              onClick={async () => {
                                                try {
                                                  await updatePlayerRosterAssignment.mutateAsync({
                                                    rosterId: entry.id,
                                                    teamId: team.id,
                                                    leagueId: selectedLeagueId,
                                                  })
                                                  setEditingRosterId(null)
                                                  setFeedback({ message: t('rosterManagement.feedback.playerMoved', 'Player moved successfully') })
                                                } catch (err: any) {
                                                  setFeedback({ error: t('rosterManagement.feedback.errorPrefix', { message: err.message }) })
                                                  setEditingRosterId(null)
                                                }
                                              }}
                                              disabled={team.id === entry.teamId}
                                              className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {team.name} ({team.level})
                                              {team.id === entry.teamId && (
                                                <span className="ml-2 text-xs text-slate-500">(current)</span>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                        <button
                                          onClick={() => setEditingRosterId(null)}
                                          className="mt-4 w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
                                        >
                                          {t('common.cancel', 'Cancel')}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Free Agents Tab */}
                {selectedTab === 'free-agents' && (
                  <div className="space-y-4">
                    {filteredFreeAgents.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        {playerNameFilter
                          ? t('rosterManagement.noResults', 'No players match your filters')
                          : t('rosterManagement.noFreeAgents', 'All players are assigned to teams')}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto text-xs">
                          <thead className="bg-slate-900 text-slate-300">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.player', 'Player')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.position', 'Pos')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.overall', 'OVR')}
                              </th>
                              <th className="px-3 py-2 text-left font-semibold uppercase">
                                {t('rosterManagement.table.actions', 'Actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {filteredFreeAgents.map((player: any) => (
                              <tr key={player.id}>
                                <td className="px-3 py-2 text-slate-100">
                                  <div className="flex items-center gap-2">
                                    <PlayerAvatar
                                      nhl_id={player.nhl_id}
                                      name={player.name}
                                      size="md"
                                    />
                                    <span>{player.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-slate-300">{player.position}</td>
                                <td className="px-3 py-2 text-slate-300">{player.overall_rating || '-'}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => setAssigningPlayerId(player.id)}
                                    className="rounded border border-sky-600 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:border-sky-400"
                                  >
                                    {t('rosterManagement.actions.assign', 'Assign to Team')}
                                  </button>

                                  {/* Assign Modal */}
                                  {assigningPlayerId === player.id && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
                                        <h3 className="mb-4 text-lg font-semibold text-slate-100">
                                          {t('rosterManagement.assignModal.title', { player: player.name })}
                                        </h3>
                                        <div className="max-h-96 space-y-3 overflow-y-auto">
                                          {teams.map((team) => (
                                            <button
                                              key={team.id}
                                              onClick={async () => {
                                                try {
                                                  await assignPlayerToRoster.mutateAsync({
                                                    playerId: player.id,
                                                    teamId: team.id,
                                                    leagueId: selectedLeagueId,
                                                  })
                                                  setAssigningPlayerId(null)
                                                  setFeedback({ message: t('rosterManagement.feedback.playerAssigned', 'Player assigned successfully') })
                                                } catch (err: any) {
                                                  setFeedback({ error: t('rosterManagement.feedback.errorPrefix', { message: err.message }) })
                                                  setAssigningPlayerId(null)
                                                }
                                              }}
                                              className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700"
                                            >
                                              {team.name} ({team.level})
                                            </button>
                                          ))}
                                        </div>
                                        <button
                                          onClick={() => setAssigningPlayerId(null)}
                                          className="mt-4 w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
                                        >
                                          {t('common.cancel', 'Cancel')}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
              </>
            )}

            {/* Import Players Tab */}
            {mainTab === 'import-players' && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <PlayerImport />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
