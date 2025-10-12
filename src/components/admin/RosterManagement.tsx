import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RosterManagementProps {
  rosterEntries: any[]
  freeAgents: any[]
  teams: any[]
  selectedLeagueId: string | null
  onAssignPlayer: (playerId: string, teamId: string) => Promise<void>
  onRemovePlayer: (rosterId: string) => Promise<void>
  onUpdateAssignment: (rosterId: string, teamId: string) => Promise<void>
  onDistributePlayers?: () => Promise<void>
  feedback: { message?: string; error?: string }
}

export const RosterManagement = ({
  rosterEntries,
  freeAgents,
  teams,
  selectedLeagueId,
  onAssignPlayer,
  onRemovePlayer,
  onUpdateAssignment,
  onDistributePlayers,
  feedback,
}: RosterManagementProps) => {
  const { t } = useTranslation()
  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(null)
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'roster' | 'free-agents'>('roster')
  const [isDistributing, setIsDistributing] = useState(false)

  if (!selectedLeagueId) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
        {t('admin.roster.selectLeague', 'Please select a league first')}
      </div>
    )
  }

  const handleDistributePlayers = async () => {
    if (!onDistributePlayers) return

    const confirmed = confirm(t('admin.roster.distribute.confirm'))

    if (!confirmed) return

    setIsDistributing(true)
    try {
      await onDistributePlayers()
    } finally {
      setIsDistributing(false)
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {t('admin.roster.title', 'Roster Management')}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {t('admin.roster.description', 'Assign players to teams, modify assignments, or release to free agency')}
          </p>
        </div>

        {onDistributePlayers && teams.length > 0 && (
          <button
            onClick={handleDistributePlayers}
            disabled={isDistributing}
            className="rounded-md border border-purple-600/50 bg-purple-900/20 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-900/30 disabled:opacity-50"
          >
            {isDistributing ? t('admin.roster.distribute.working') : t('admin.roster.distribute.button')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setSelectedTab('roster')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'roster'
              ? 'border-b-2 border-sky-500 text-sky-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          {t('admin.roster.tabs.roster', 'Team Rosters')} ({rosterEntries.length})
        </button>
        <button
          onClick={() => setSelectedTab('free-agents')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'free-agents'
              ? 'border-b-2 border-sky-500 text-sky-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          {t('admin.roster.tabs.freeAgents', 'Free Agents')} ({freeAgents.length})
        </button>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className="rounded-md border border-green-600/50 bg-green-900/20 p-3 text-sm text-green-200">
          {feedback.message}
        </div>
      )}
      {feedback.error && (
        <div className="rounded-md border border-red-600/50 bg-red-900/20 p-3 text-sm text-red-200">
          {feedback.error}
        </div>
      )}

      {/* Team Rosters Tab */}
      {selectedTab === 'roster' && (
        <div className="space-y-4">
          {rosterEntries.length === 0 ? (
            <p className="text-sm text-slate-500">{t('admin.roster.noPlayers', 'No players assigned to teams yet')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.player', 'Player')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.position', 'Pos')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.overall', 'OVR')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.team', 'Team')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rosterEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2 text-slate-100">{entry.player.name}</td>
                      <td className="px-3 py-2 text-slate-300">{entry.player.position}</td>
                      <td className="px-3 py-2 text-slate-300">{entry.player.ratings?.OV || '-'}</td>
                      <td className="px-3 py-2 text-slate-300">{entry.teamName}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRosterId(entry.id)}
                            className="rounded border border-slate-600 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-400"
                          >
                            {t('admin.roster.actions.move', 'Move')}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(t('admin.roster.confirmRelease', { player: entry.player.name }))) {
                                await onRemovePlayer(entry.id)
                              }
                            }}
                            className="rounded border border-red-600 px-2 py-1 text-[11px] font-semibold text-red-300 hover:border-red-400"
                          >
                            {t('admin.roster.actions.release', 'Release')}
                          </button>
                        </div>

                        {/* Move Modal */}
                        {editingRosterId === entry.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
                              <h3 className="mb-4 text-lg font-semibold text-slate-100">
                                {t('admin.roster.moveModal.title', { player: entry.player.name })}
                              </h3>
                              <div className="space-y-3">
                                {teams.map((team) => (
                                  <button
                                    key={team.id}
                                    onClick={async () => {
                                      await onUpdateAssignment(entry.id, team.id)
                                      setEditingRosterId(null)
                                    }}
                                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700"
                                  >
                                    {team.name} ({team.level})
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
          {freeAgents.length === 0 ? (
            <p className="text-sm text-slate-500">{t('admin.roster.noFreeAgents', 'All players are assigned to teams')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.player', 'Player')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.position', 'Pos')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.overall', 'OVR')}</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase">{t('admin.roster.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {freeAgents.map((player: any) => (
                    <tr key={player.id}>
                      <td className="px-3 py-2 text-slate-100">{player.name}</td>
                      <td className="px-3 py-2 text-slate-300">{player.position}</td>
                      <td className="px-3 py-2 text-slate-300">{player.overall_rating || '-'}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setAssigningPlayerId(player.id)}
                          className="rounded border border-sky-600 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:border-sky-400"
                        >
                          {t('admin.roster.actions.assign', 'Assign to Team')}
                        </button>

                        {/* Assign Modal */}
                        {assigningPlayerId === player.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
                              <h3 className="mb-4 text-lg font-semibold text-slate-100">
                                {t('admin.roster.assignModal.title', { player: player.name })}
                              </h3>
                              <div className="space-y-3">
                                {teams.map((team) => (
                                  <button
                                    key={team.id}
                                    onClick={async () => {
                                      await onAssignPlayer(player.id, team.id)
                                      setAssigningPlayerId(null)
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
  )
}
