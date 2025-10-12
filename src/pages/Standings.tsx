import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStandings, groupByDivision, groupByConference, type StandingsEntry } from '../api/standings'
import { useLeagueStore } from '../state/useLeagueStore'
import { supabase } from '../api/supabaseClient'

type StandingsView = 'division' | 'conference' | 'league'

export const StandingsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedLeagueId } = useLeagueStore()
  const { data: standings, isLoading, error, refetch } = useStandings(selectedLeagueId || undefined)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null)
  const [view, setView] = useState<StandingsView>('division')

  const handleRebuildStandings = async () => {
    if (!selectedLeagueId) return

    setIsRebuilding(true)
    setRebuildMessage(null)

    try {
      const { data, error } = await supabase.rpc('fn_rebuild_standings', {
        p_league_id: selectedLeagueId
      })

      if (error) throw error

      setRebuildMessage(data.message || 'Standings rebuilt successfully')
      // Refetch standings after rebuild
      await refetch()
    } catch (err: any) {
      setRebuildMessage(`Error: ${err.message}`)
    } finally {
      setIsRebuilding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-400">
          {t('standings.error', 'Failed to load standings')}
        </div>
      </div>
    )
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="text-slate-400 text-center">
          {t('standings.noData', 'No standings data available. Games need to be simulated first.')}
        </div>
        <button
          onClick={handleRebuildStandings}
          disabled={isRebuilding}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {isRebuilding ? 'Rebuilding...' : 'Rebuild Standings from Game Results'}
        </button>
        {rebuildMessage && (
          <div className={`text-sm ${rebuildMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {rebuildMessage}
          </div>
        )}
      </div>
    )
  }

  // Group by division or conference
  const divisionGroups = groupByDivision(standings)
  const conferenceGroups = groupByConference(standings)

  const getStreakDisplay = (team: StandingsEntry) => {
    if (!team.streak_type || !team.streak_count) return '-'
    return `${team.streak_type}${team.streak_count}`
  }

  const getHomeRecord = (team: StandingsEntry) => {
    return `${team.home_wins}-${team.home_losses}-${team.home_ot_losses}`
  }

  const getAwayRecord = (team: StandingsEntry) => {
    return `${team.away_wins}-${team.away_losses}-${team.away_ot_losses}`
  }

  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}/roster`)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t('standings.title', 'Classement')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('standings.subtitle', 'Season ' + new Date().getFullYear())}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRebuildStandings}
            disabled={isRebuilding}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {isRebuilding ? 'Rebuilding...' : 'Rebuild Standings'}
          </button>
          {rebuildMessage && (
            <div className={`text-xs ${rebuildMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {rebuildMessage}
            </div>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-6 border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setView('division')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              view === 'division'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            Par Division
          </button>
          <button
            onClick={() => setView('conference')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              view === 'conference'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            Par Conférence
          </button>
          <button
            onClick={() => setView('league')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              view === 'league'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            Ligue
          </button>
        </nav>
      </div>

      {/* Division View */}
      {view === 'division' && (
        <div className="space-y-8">
        {Array.from(divisionGroups.entries()).map(([division, teams]) => {
          const conference = teams[0]?.conference || ''
          return (
          <div key={division} className="rounded-lg border border-slate-700 bg-slate-800/50">
            <div className="border-b border-slate-700 bg-slate-800 px-6 py-3">
              <h2 className="text-xl font-semibold text-slate-200">
                {division}
                {conference && conference !== 'Unassigned' && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({conference} Conference)
                  </span>
                )}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t('standings.team', 'Team')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.gp', 'GP')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.w', 'W')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.l', 'L')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.otl', 'OTL')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.pts', 'PTS')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.pct', 'PTS%')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.row', 'ROW')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.gf', 'GF')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.ga', 'GA')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.diff', 'DIFF')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.home', 'HOME')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.away', 'AWAY')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.l10', 'L10')}
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">
                      {t('standings.strk', 'STRK')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {teams.map((team, index) => (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTeamClick(team.team_id)}
                          className="text-left text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          <div className="font-semibold">{team.team_name}</div>
                          <div className="text-xs text-slate-500">{team.team_city}</div>
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.games_played}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-semibold text-green-400">
                        {team.wins}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-semibold text-red-400">
                        {team.losses}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-semibold text-orange-400">
                        {team.ot_losses}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold text-white">
                        {team.points}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.points_percentage.toFixed(1)}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.row}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.goals_for}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.goals_against}
                      </td>
                      <td
                        className={`px-2 py-3 text-center text-sm font-semibold ${
                          team.goal_differential > 0
                            ? 'text-green-400'
                            : team.goal_differential < 0
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {team.goal_differential > 0 ? '+' : ''}
                        {team.goal_differential}
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">
                        {getHomeRecord(team)}
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">
                        {getAwayRecord(team)}
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">
                        {team.last_10 || '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-xs font-semibold text-slate-300">
                        {getStreakDisplay(team)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        })}
        </div>
      )}

      {/* Conference View */}
      {view === 'conference' && (
        <div className="space-y-8">
        {Array.from(conferenceGroups.entries()).map(([conference, teams]) => (
          <div key={conference} className="rounded-lg border border-slate-700 bg-slate-800/50">
            {/* Conference Header */}
            <div className="border-b border-slate-700 bg-slate-800 px-6 py-3">
              <h2 className="text-xl font-semibold text-slate-200">{conference}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Équipe</th>
                    <th className="px-2 py-3 text-center font-semibold">GP</th>
                    <th className="px-2 py-3 text-center font-semibold">W</th>
                    <th className="px-2 py-3 text-center font-semibold">L</th>
                    <th className="px-2 py-3 text-center font-semibold">OTL</th>
                    <th className="px-2 py-3 text-center font-semibold">PTS</th>
                    <th className="px-2 py-3 text-center font-semibold">PTS%</th>
                    <th className="px-2 py-3 text-center font-semibold">ROW</th>
                    <th className="px-2 py-3 text-center font-semibold">GF</th>
                    <th className="px-2 py-3 text-center font-semibold">GA</th>
                    <th className="px-2 py-3 text-center font-semibold">DIFF</th>
                    <th className="px-2 py-3 text-center font-semibold">HOME</th>
                    <th className="px-2 py-3 text-center font-semibold">AWAY</th>
                    <th className="px-2 py-3 text-center font-semibold">L10</th>
                    <th className="px-2 py-3 text-center font-semibold">STRK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {teams.map((team, index) => (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTeamClick(team.team_id)}
                          className="text-left text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          <div className="font-semibold">{team.team_name}</div>
                          <div className="text-xs text-slate-500">{team.team_city}</div>
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.games_played}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-semibold text-green-400">
                        {team.wins}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-semibold text-red-400">
                        {team.losses}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-semibold text-orange-400">
                        {team.ot_losses}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold text-white">
                        {team.points}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.points_percentage.toFixed(1)}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.row}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.goals_for}
                      </td>
                      <td className="px-2 py-3 text-center text-sm text-slate-300">
                        {team.goals_against}
                      </td>
                      <td
                        className={`px-2 py-3 text-center text-sm font-semibold ${
                          team.goal_differential > 0
                            ? 'text-green-400'
                            : team.goal_differential < 0
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {team.goal_differential > 0 ? '+' : ''}
                        {team.goal_differential}
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">
                        {getHomeRecord(team)}
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">
                        {getAwayRecord(team)}
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">
                        {team.last_10 || '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-xs font-semibold text-slate-300">
                        {getStreakDisplay(team)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* League View */}
      {view === 'league' && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50">
          <div className="border-b border-slate-700 bg-slate-800 px-6 py-3">
            <h2 className="text-xl font-semibold text-slate-200">Classement de la ligue</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Équipe</th>
                  <th className="px-2 py-3 text-center font-semibold">GP</th>
                  <th className="px-2 py-3 text-center font-semibold">W</th>
                  <th className="px-2 py-3 text-center font-semibold">L</th>
                  <th className="px-2 py-3 text-center font-semibold">OTL</th>
                  <th className="px-2 py-3 text-center font-semibold">PTS</th>
                  <th className="px-2 py-3 text-center font-semibold">PTS%</th>
                  <th className="px-2 py-3 text-center font-semibold">ROW</th>
                  <th className="px-2 py-3 text-center font-semibold">GF</th>
                  <th className="px-2 py-3 text-center font-semibold">GA</th>
                  <th className="px-2 py-3 text-center font-semibold">DIFF</th>
                  <th className="px-2 py-3 text-center font-semibold">HOME</th>
                  <th className="px-2 py-3 text-center font-semibold">AWAY</th>
                  <th className="px-2 py-3 text-center font-semibold">L10</th>
                  <th className="px-2 py-3 text-center font-semibold">STRK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {standings.map((team, index) => (
                  <tr
                    key={team.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTeamClick(team.team_id)}
                        className="text-left text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        <div className="font-semibold">{team.team_name}</div>
                        <div className="text-xs text-slate-500">{team.team_city}</div>
                      </button>
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-slate-300">
                      {team.games_played}
                    </td>
                    <td className="px-2 py-3 text-center text-sm font-semibold text-green-400">
                      {team.wins}
                    </td>
                    <td className="px-2 py-3 text-center text-sm font-semibold text-red-400">
                      {team.losses}
                    </td>
                    <td className="px-2 py-3 text-center text-sm font-semibold text-orange-400">
                      {team.ot_losses}
                    </td>
                    <td className="px-2 py-3 text-center text-sm font-bold text-white">
                      {team.points}
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-slate-300">
                      {team.points_percentage.toFixed(1)}
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-slate-300">
                      {team.row}
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-slate-300">
                      {team.goals_for}
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-slate-300">
                      {team.goals_against}
                    </td>
                    <td
                      className={`px-2 py-3 text-center text-sm font-semibold ${
                        team.goal_differential > 0
                          ? 'text-green-400'
                          : team.goal_differential < 0
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {team.goal_differential > 0 ? '+' : ''}
                      {team.goal_differential}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-slate-400">
                      {getHomeRecord(team)}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-slate-400">
                      {getAwayRecord(team)}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-slate-400">
                      {team.last_10 || '-'}
                    </td>
                    <td className="px-2 py-3 text-center text-xs font-semibold text-slate-300">
                      {getStreakDisplay(team)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase text-slate-400">
          {t('standings.legend', 'Legend')}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 md:grid-cols-4">
          <div>
            <span className="font-semibold text-slate-300">GP:</span> {t('standings.gamesPlayed', 'Games Played')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">W:</span> {t('standings.wins', 'Wins')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">L:</span> {t('standings.losses', 'Losses')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">OTL:</span> {t('standings.otLosses', 'Overtime/Shootout Losses')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">PTS:</span> {t('standings.points', 'Points (2 pts victoire, 1 pt DP/TB)')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">PTS%:</span> {t('standings.ptsPercent', 'Points % (utile quand différents matchs joués)')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">ROW:</span> {t('standings.rowDesc', 'Regulation + OT Wins (exclut victoires TB)')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">GF:</span> {t('standings.goalsFor', 'Goals For')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">GA:</span> {t('standings.goalsAgainst', 'Goals Against')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">DIFF:</span> {t('standings.differential', 'Goal Differential')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">L10:</span> {t('standings.last10', 'Last 10 Games')}
          </div>
          <div>
            <span className="font-semibold text-slate-300">STRK:</span> {t('standings.streak', 'Current Streak')}
          </div>
        </div>
      </div>
    </div>
  )
}
