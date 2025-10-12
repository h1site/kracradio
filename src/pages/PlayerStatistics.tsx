import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdvancedPlayerStats, useAdvancedGoalieStats, formatAvgTOI, type PlayerStatsFilters } from '../api/advancedPlayerStats'
import { useLeagueStore } from '../state/useLeagueStore'
import { useLeagueTeamsQuery } from '../api/teams'
import { useLeagueConferencesAndDivisions } from '../api/divisions'

type StatsView = 'forwards' | 'defense' | 'goalies'

export const PlayerStatisticsPage = () => {
  const navigate = useNavigate()
  const { selectedLeagueId } = useLeagueStore()
  const currentSeason = new Date().getFullYear()

  const [view, setView] = useState<StatsView>('forwards')
  const [filters, setFilters] = useState<PlayerStatsFilters>({
    leagueId: selectedLeagueId || undefined,
    season: currentSeason,
    sortBy: 'points',
    sortOrder: 'desc',
  })

  // Separate filters for goalies (different sort column)
  const goalieFilters: PlayerStatsFilters = {
    ...filters,
    sortBy: filters.sortBy === 'points' ? 'wins' : filters.sortBy,
  }

  const { data: skaterStats, isLoading: loadingSkaters } = useAdvancedPlayerStats(
    view !== 'goalies' ? filters : { leagueId: undefined }
  )
  const { data: goalieStats, isLoading: loadingGoalies } = useAdvancedGoalieStats(
    view === 'goalies' ? goalieFilters : { leagueId: undefined }
  )

  // Filter skaters by view (forwards vs defense)
  const filteredSkaters = skaterStats?.filter((player) => {
    if (view === 'forwards') {
      return ['C', 'LW', 'RW'].includes(player.position)
    } else if (view === 'defense') {
      return player.position === 'D'
    }
    return true
  })

  const { data: teams } = useLeagueTeamsQuery(selectedLeagueId || null)
  const { data: conferencesData } = useLeagueConferencesAndDivisions(selectedLeagueId || undefined)

  const handleFilterChange = (key: keyof PlayerStatsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  }

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }))
  }

  const isLoading = view === 'goalies' ? loadingGoalies : loadingSkaters

  // Get unique conferences and divisions
  const conferences = conferencesData?.map((c) => c.name) || []
  const divisions = conferencesData?.flatMap((c) => c.divisions.map((d) => d.name)) || []

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Statistiques des Joueurs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Statistiques détaillées de tous les joueurs NHL - Saison {currentSeason}
        </p>
      </div>

      {/* View Tabs */}
      <div className="mb-6 border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setView('forwards')
              handleFilterChange('position', undefined)
            }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              view === 'forwards'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            Attaquants
          </button>
          <button
            onClick={() => {
              setView('defense')
              handleFilterChange('position', undefined)
            }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              view === 'defense'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            Défenseurs
          </button>
          <button
            onClick={() => {
              setView('goalies')
              handleFilterChange('position', undefined)
            }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              view === 'goalies'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            Gardiens
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Recherche</label>
            <input
              type="text"
              placeholder="Nom du joueur..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400"
            />
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Équipe</label>
            <select
              value={filters.teamId || ''}
              onChange={(e) => handleFilterChange('teamId', e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Toutes les équipes</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.city} {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conference Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Conférence</label>
            <select
              value={filters.conference || ''}
              onChange={(e) => handleFilterChange('conference', e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Toutes les conférences</option>
              {conferences.map((conf) => (
                <option key={conf} value={conf}>
                  {conf}
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Division</label>
            <select
              value={filters.division || ''}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Toutes les divisions</option>
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>

          {/* Position Filter (Forwards only) */}
          {view === 'forwards' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Position</label>
              <select
                value={filters.position || ''}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
              >
                <option value="">Toutes les positions</option>
                <option value="C">Centre (C)</option>
                <option value="LW">Ailier gauche (LW)</option>
                <option value="RW">Ailier droit (RW)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Chargement des statistiques...</div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50">
          {view !== 'goalies' && filteredSkaters && filteredSkaters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-left font-semibold">#</th>
                    <th className="sticky left-12 z-10 bg-slate-800 px-4 py-3 text-left font-semibold">Joueur</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('games_played')}>GP</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('goals')}>G</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('assists')}>A</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('points')}>PTS</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('plus_minus')}>+/-</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('penalty_minutes')}>PIM</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('power_play_goals')}>PPG</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('short_handed_goals')}>SHG</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('shots')}>S</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('shooting_percentage')}>S%</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('hits')}>HIT</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('blocks')}>BLK</th>
                    <th className="px-2 py-3 text-center font-semibold">TOI/GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredSkaters.map((player, index) => (
                    <tr key={player.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="sticky left-12 z-10 bg-slate-800 px-4 py-3">
                        <button
                          onClick={() => navigate(`/player/${player.player_id}`)}
                          className="text-left hover:underline"
                        >
                          <div className="font-semibold text-sky-400 hover:text-sky-300">{player.player_name}</div>
                          <div className="text-xs text-slate-500">
                            {player.position} | {player.team_city} {player.team_name}
                          </div>
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.games_played || 0}</td>
                      <td className="px-2 py-3 text-center font-semibold text-green-400">{player.goals || 0}</td>
                      <td className="px-2 py-3 text-center font-semibold text-blue-400">{player.assists || 0}</td>
                      <td className="px-2 py-3 text-center font-bold text-white">{player.points || 0}</td>
                      <td className={`px-2 py-3 text-center font-semibold ${(player.plus_minus || 0) > 0 ? 'text-green-400' : (player.plus_minus || 0) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {(player.plus_minus || 0) > 0 ? '+' : ''}{player.plus_minus || 0}
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.penalty_minutes || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.power_play_goals || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.short_handed_goals || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.shots || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{(player.shooting_percentage || 0).toFixed(1)}%</td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.hits || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{player.blocks || 0}</td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">{formatAvgTOI(player.avg_toi_seconds || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view === 'goalies' && goalieStats && goalieStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-left font-semibold">#</th>
                    <th className="sticky left-12 z-10 bg-slate-800 px-4 py-3 text-left font-semibold">Gardien</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('games_played')}>GP</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('wins')}>W</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('losses')}>L</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('overtime_losses')}>OTL</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('save_percentage')}>SV%</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('goals_against_average')}>GAA</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('shutouts')}>SO</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('saves')}>SV</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('shots_against')}>SA</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('goals_against')}>GA</th>
                    <th className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400" onClick={() => handleSort('quality_starts')}>QS</th>
                    <th className="px-2 py-3 text-center font-semibold">MIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {goalieStats.map((goalie, index) => (
                    <tr key={goalie.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="sticky left-12 z-10 bg-slate-800 px-4 py-3">
                        <button
                          onClick={() => navigate(`/player/${goalie.player_id}`)}
                          className="text-left hover:underline"
                        >
                          <div className="font-semibold text-sky-400 hover:text-sky-300">{goalie.player_name}</div>
                          <div className="text-xs text-slate-500">
                            {goalie.team_city} {goalie.team_name}
                          </div>
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.games_played || 0}</td>
                      <td className="px-2 py-3 text-center font-semibold text-green-400">{goalie.wins || 0}</td>
                      <td className="px-2 py-3 text-center font-semibold text-red-400">{goalie.losses || 0}</td>
                      <td className="px-2 py-3 text-center font-semibold text-orange-400">{goalie.overtime_losses || 0}</td>
                      <td className="px-2 py-3 text-center font-bold text-white">{(goalie.save_percentage || 0).toFixed(3)}</td>
                      <td className="px-2 py-3 text-center font-semibold text-slate-300">{(goalie.goals_against_average || 0).toFixed(2)}</td>
                      <td className="px-2 py-3 text-center font-semibold text-sky-400">{goalie.shutouts || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.saves || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.shots_against || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.goals_against || 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.quality_starts || 0}</td>
                      <td className="px-2 py-3 text-center text-xs text-slate-400">{goalie.minutes_played || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view === 'goalies' && goalieStats && goalieStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-left font-semibold">#</th>
                    <th className="sticky left-12 z-10 bg-slate-800 px-4 py-3 text-left font-semibold">Gardien</th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('games_played')}
                    >
                      GP
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('games_started')}
                    >
                      GS
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('wins')}
                    >
                      W
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('losses')}
                    >
                      L
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('overtime_losses')}
                    >
                      OTL
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('save_percentage')}
                    >
                      SV%
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('goals_against_average')}
                    >
                      GAA
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('shutouts')}
                    >
                      SO
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('shots_against')}
                    >
                      SA
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('saves')}
                    >
                      SV
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('goals_against')}
                    >
                      GA
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('quality_starts')}
                    >
                      QS
                    </th>
                    <th
                      className="px-2 py-3 text-center font-semibold cursor-pointer hover:text-sky-400"
                      onClick={() => handleSort('goals_saved_above_average')}
                    >
                      GSAA
                    </th>
                    <th className="px-2 py-3 text-center font-semibold">MIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {goalieStats.map((goalie, index) => (
                    <tr key={goalie.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="sticky left-12 z-10 bg-slate-800 px-4 py-3">
                        <button
                          onClick={() => navigate(`/player/${goalie.player_id}`)}
                          className="text-left hover:underline"
                        >
                          <div className="font-semibold text-sky-400 hover:text-sky-300">{goalie.player_name}</div>
                          <div className="text-xs text-slate-500">
                            {goalie.team_city} {goalie.team_name}
                          </div>
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.games_played ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.games_started ?? 0}</td>
                      <td className="px-2 py-3 text-center font-semibold text-green-400">{goalie.wins ?? 0}</td>
                      <td className="px-2 py-3 text-center text-red-300">{goalie.losses ?? 0}</td>
                      <td className="px-2 py-3 text-center text-amber-300">{goalie.overtime_losses ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-100">
                        {goalie.save_percentage !== null && goalie.save_percentage !== undefined
                          ? Number(goalie.save_percentage).toFixed(3)
                          : '—'}
                      </td>
                      <td className="px-2 py-3 text-center text-slate-100">
                        {goalie.goals_against_average !== null && goalie.goals_against_average !== undefined
                          ? goalie.goals_against_average.toFixed(2)
                          : '—'}
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.shutouts ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.shots_against ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.saves ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.goals_against ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{goalie.quality_starts ?? 0}</td>
                      <td className="px-2 py-3 text-center text-slate-300">
                        {goalie.goals_saved_above_average !== null && goalie.goals_saved_above_average !== undefined
                          ? goalie.goals_saved_above_average.toFixed(1)
                          : '—'}
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">
                        {goalie.minutes_played !== null && goalie.minutes_played !== undefined
                          ? Math.round(goalie.minutes_played)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-slate-400">
                <p>Aucune statistique disponible.</p>
                <p className="mt-2 text-sm">Les statistiques seront générées après la simulation des matchs.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase text-slate-400">Légende</h3>
        {view !== 'goalies' ? (
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 md:grid-cols-4">
            <div><span className="font-semibold text-slate-300">GP:</span> Matchs joués</div>
            <div><span className="font-semibold text-slate-300">G:</span> Buts</div>
            <div><span className="font-semibold text-slate-300">A:</span> Passes</div>
            <div><span className="font-semibold text-slate-300">PTS:</span> Points</div>
            <div><span className="font-semibold text-slate-300">+/-:</span> Plus/Minus</div>
            <div><span className="font-semibold text-slate-300">PIM:</span> Minutes de pénalité</div>
            <div><span className="font-semibold text-slate-300">PPG:</span> Buts en avantage numérique</div>
            <div><span className="font-semibold text-slate-300">SHG:</span> Buts en désavantage</div>
            <div><span className="font-semibold text-slate-300">S:</span> Tirs</div>
            <div><span className="font-semibold text-slate-300">S%:</span> % de tirs</div>
            <div><span className="font-semibold text-slate-300">HIT:</span> Mises en échec</div>
            <div><span className="font-semibold text-slate-300">BLK:</span> Tirs bloqués</div>
            <div><span className="font-semibold text-slate-300">TOI/GP:</span> Temps de jeu moyen</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 md:grid-cols-4">
            <div><span className="font-semibold text-slate-300">GP:</span> Matchs joués</div>
            <div><span className="font-semibold text-slate-300">W:</span> Victoires</div>
            <div><span className="font-semibold text-slate-300">L:</span> Défaites</div>
            <div><span className="font-semibold text-slate-300">OTL:</span> Défaites en prolongation</div>
            <div><span className="font-semibold text-slate-300">SV%:</span> % d'arrêts</div>
            <div><span className="font-semibold text-slate-300">GAA:</span> Moyenne de buts alloués</div>
            <div><span className="font-semibold text-slate-300">SO:</span> Blanchissages</div>
            <div><span className="font-semibold text-slate-300">SV:</span> Arrêts</div>
            <div><span className="font-semibold text-slate-300">SA:</span> Tirs reçus</div>
            <div><span className="font-semibold text-slate-300">GA:</span> Buts accordés</div>
            <div><span className="font-semibold text-slate-300">QS:</span> Départs de qualité</div>
            <div><span className="font-semibold text-slate-300">MIN:</span> Minutes jouées</div>
          </div>
        )}
      </div>
    </div>
  )
}
