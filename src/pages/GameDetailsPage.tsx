import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useGameDetails } from '../api/schedule'
import {
  useGameEventsQuery,
  getGoalsByPeriod,
  getPenaltiesByPeriod,
  formatGameTime,
  type GameEvent
} from '../api/gameEvents'

export const GameDetailsPage = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'stats' | 'summary' | 'playbyplay'>('summary')

  const { data: game, isLoading, error } = useGameDetails(gameId || null)
  const { data: events = [] } = useGameEventsQuery(gameId || null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement...</p>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erreur lors du chargement du match</p>
          <button
            onClick={() => navigate('/schedule')}
            className="px-4 py-2 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700"
          >
            Retour au calendrier
          </button>
        </div>
      </div>
    )
  }

  const homeStats = game.player_stats.filter((s) => s.team_id === game.home_team_id)
  const awayStats = game.player_stats.filter((s) => s.team_id === game.away_team_id)

  const homeSkaters = homeStats.filter((s) => s.position !== 'G')
  const homeGoalie = homeStats.find((s) => s.position === 'G')

  const awaySkaters = awayStats.filter((s) => s.position !== 'G')
  const awayGoalie = awayStats.find((s) => s.position === 'G')

  const gameTypeLabel =
    game.game_type === 'overtime' ? 'Prolongation' : game.game_type === 'shootout' ? 'Fusillade' : 'Temps réglementaire'

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/schedule')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 transition-colors"
          >
            <span>←</span>
            <span>Retour au calendrier</span>
          </button>
          <div className="text-sm text-slate-400">
            Jour {game.game_day} • {new Date(game.game_date).toLocaleDateString('fr-CA')}
          </div>
        </div>

        {/* Game Score Header */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Away Team */}
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-slate-100">{game.away_team_name}</h2>
              <div className="text-6xl font-bold text-slate-50 mt-4">{game.away_score}</div>
            </div>

            {/* VS and game type */}
            <div className="px-8 text-center">
              <div className="text-slate-500 text-sm mb-2">{gameTypeLabel}</div>
              <div className="text-3xl font-bold text-slate-600">VS</div>
              <div className="text-xs text-slate-500 mt-2 uppercase">{game.status}</div>
            </div>

            {/* Home Team */}
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-slate-100">{game.home_team_name}</h2>
              <div className="text-6xl font-bold text-slate-50 mt-4">{game.home_score}</div>
            </div>
          </div>

          {/* Winner indicator */}
          {game.winner_team_id && (
            <div className="text-center mt-6">
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold">
                🏆 Vainqueur:{' '}
                {game.winner_team_id === game.home_team_id ? game.home_team_name : game.away_team_name}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'summary'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Résumé
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('playbyplay')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'playbyplay'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Jeu par jeu
            </button>
          </div>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {events.length > 0 ? (
              <GameSummary events={events} />
            ) : (
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 text-center text-slate-400">
                Aucun événement de match disponible
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <>
            {/* Player Stats - Away Team */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-xl font-bold text-slate-100 mb-4">{game.away_team_name} - Joueurs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-800">
                      <th className="pb-3 pr-4">Joueur</th>
                      <th className="pb-3 pr-4">Pos</th>
                      <th className="pb-3 pr-4 text-center">B</th>
                      <th className="pb-3 pr-4 text-center">P</th>
                      <th className="pb-3 pr-4 text-center">Pts</th>
                      <th className="pb-3 pr-4 text-center">+/-</th>
                      <th className="pb-3 pr-4 text-center">Tirs</th>
                      <th className="pb-3 pr-4 text-center">Mises</th>
                      <th className="pb-3 pr-4 text-center">TG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {awaySkaters.map((stat) => (
                      <tr key={stat.id} className="text-slate-300 hover:bg-slate-800/40">
                        <td className="py-3 pr-4 font-medium">
                          <button
                            onClick={() => navigate(`/player/${stat.player_id}`)}
                            className="text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            {stat.player_name}
                          </button>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{stat.position}</td>
                        <td className="py-3 pr-4 text-center">{stat.goals}</td>
                        <td className="py-3 pr-4 text-center">{stat.assists}</td>
                        <td className="py-3 pr-4 text-center font-semibold">{stat.points}</td>
                        <td className={`py-3 pr-4 text-center ${stat.plus_minus > 0 ? 'text-emerald-400' : stat.plus_minus < 0 ? 'text-red-400' : ''}`}>
                          {stat.plus_minus > 0 ? '+' : ''}{stat.plus_minus}
                        </td>
                        <td className="py-3 pr-4 text-center">{stat.shots}</td>
                        <td className="py-3 pr-4 text-center">{stat.hits}</td>
                        <td className="py-3 pr-4 text-center text-slate-400">{formatTime(stat.time_on_ice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Goalie stats */}
              {awayGoalie && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h4 className="text-sm font-semibold uppercase text-slate-400 mb-3">Gardien</h4>
                  <div className="bg-slate-800/40 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/player/${awayGoalie.goalie_id}?type=goalie`)}
                        className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        {awayGoalie.player_name}
                      </button>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-slate-400">Arrêts: </span>
                          <span className="text-slate-200 font-semibold">{awayGoalie.saves}/{awayGoalie.shots_against}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">%Arr: </span>
                          <span className="text-slate-200 font-semibold">{(awayGoalie.save_percentage * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">BC: </span>
                          <span className="text-slate-200 font-semibold">{awayGoalie.goals_against}</span>
                        </div>
                        {awayGoalie.shutout && (
                          <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                            BLANCHISSAGE
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Player Stats - Home Team */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-xl font-bold text-slate-100 mb-4">{game.home_team_name} - Joueurs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-800">
                  <th className="pb-3 pr-4">Joueur</th>
                  <th className="pb-3 pr-4">Pos</th>
                  <th className="pb-3 pr-4 text-center">B</th>
                  <th className="pb-3 pr-4 text-center">P</th>
                  <th className="pb-3 pr-4 text-center">Pts</th>
                  <th className="pb-3 pr-4 text-center">+/-</th>
                  <th className="pb-3 pr-4 text-center">Tirs</th>
                  <th className="pb-3 pr-4 text-center">Mises</th>
                  <th className="pb-3 pr-4 text-center">TG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {homeSkaters.map((stat) => (
                  <tr key={stat.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-3 pr-4 font-medium">
                      <button
                        onClick={() => navigate(`/player/${stat.player_id}`)}
                        className="text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        {stat.player_name}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{stat.position}</td>
                    <td className="py-3 pr-4 text-center">{stat.goals}</td>
                    <td className="py-3 pr-4 text-center">{stat.assists}</td>
                    <td className="py-3 pr-4 text-center font-semibold">{stat.points}</td>
                    <td className={`py-3 pr-4 text-center ${stat.plus_minus > 0 ? 'text-emerald-400' : stat.plus_minus < 0 ? 'text-red-400' : ''}`}>
                      {stat.plus_minus > 0 ? '+' : ''}{stat.plus_minus}
                    </td>
                    <td className="py-3 pr-4 text-center">{stat.shots}</td>
                    <td className="py-3 pr-4 text-center">{stat.hits}</td>
                    <td className="py-3 pr-4 text-center text-slate-400">{formatTime(stat.time_on_ice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Goalie stats */}
          {homeGoalie && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-sm font-semibold uppercase text-slate-400 mb-3">Gardien</h4>
              <div className="bg-slate-800/40 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/player/${homeGoalie.goalie_id}?type=goalie`)}
                    className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    {homeGoalie.player_name}
                  </button>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-slate-400">Arrêts: </span>
                      <span className="text-slate-200 font-semibold">{homeGoalie.saves}/{homeGoalie.shots_against}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">%Arr: </span>
                      <span className="text-slate-200 font-semibold">{(homeGoalie.save_percentage * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">BC: </span>
                      <span className="text-slate-200 font-semibold">{homeGoalie.goals_against}</span>
                    </div>
                    {homeGoalie.shutout && (
                      <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                        BLANCHISSAGE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Play-by-Play Tab */}
        {activeTab === 'playbyplay' && (
          <div className="space-y-6">
            {events.length > 0 ? (
              <PlayByPlay events={events} />
            ) : (
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 text-center text-slate-400">
                Aucun événement de match disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// GameSummary component - shows period-by-period goals and penalties
const GameSummary = ({ events }: { events: GameEvent[] }) => {
  const goalsByPeriod = getGoalsByPeriod(events)
  const penaltiesByPeriod = getPenaltiesByPeriod(events)
  const periods = Array.from(new Set([...Object.keys(goalsByPeriod), ...Object.keys(penaltiesByPeriod)])).map(Number).sort()

  return (
    <div className="space-y-6">
      {periods.map((period) => {
        const goals = goalsByPeriod[period] || []
        const penalties = penaltiesByPeriod[period] || []

        if (goals.length === 0 && penalties.length === 0) return null

        return (
          <div key={period} className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              {period <= 3 ? `Période ${period}` : period === 4 ? 'Prolongation' : 'Fusillade'}
            </h3>

            {/* Goals */}
            {goals.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold uppercase text-slate-400 mb-3">Buts</h4>
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-slate-800/40 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 font-mono text-sm">
                          {formatGameTime(goal.game_time_seconds)}
                        </span>
                        <div>
                          <div className="text-slate-200">
                            <span className="font-semibold">{goal.player_name}</span>
                            {goal.player_number && (
                              <span className="text-slate-400"> #{goal.player_number}</span>
                            )}
                          </div>
                          {(goal.secondary_player_name || goal.tertiary_player_name) && (
                            <div className="text-sm text-slate-400">
                              Passes:{' '}
                              {[goal.secondary_player_name, goal.tertiary_player_name]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">{goal.team_name}</div>
                        {goal.zone && (
                          <div className="text-xs text-slate-500 capitalize">{goal.zone}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Penalties */}
            {penalties.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold uppercase text-slate-400 mb-3">Pénalités</h4>
                <div className="space-y-2">
                  {penalties.map((penalty) => (
                    <div key={penalty.id} className="bg-slate-800/40 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 font-mono text-sm">
                          {formatGameTime(penalty.game_time_seconds)}
                        </span>
                        <div>
                          <div className="text-slate-200">
                            <span className="font-semibold">{penalty.player_name}</span>
                            {penalty.player_number && (
                              <span className="text-slate-400"> #{penalty.player_number}</span>
                            )}
                          </div>
                          {penalty.details?.penalty_type && (
                            <div className="text-sm text-slate-400">
                              {penalty.details.penalty_type}
                              {penalty.details.penalty_minutes && ` (${penalty.details.penalty_minutes} min)`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">{penalty.team_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// PlayByPlay component - shows all events chronologically
const PlayByPlay = ({ events }: { events: GameEvent[] }) => {
  const eventsByPeriod = events.reduce((acc, event) => {
    if (!acc[event.period]) {
      acc[event.period] = []
    }
    acc[event.period].push(event)
    return acc
  }, {} as Record<number, GameEvent[]>)

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      // Goals
      case 'goal': return '🚨'
      case 'goal_disallowed': return '❌'

      // Saves
      case 'save':
      case 'save_spectacular': return '🛡️'
      case 'goalie_save_glove':
      case 'goalie_save_pad':
      case 'goalie_save_blocker':
      case 'goalie_poke_check':
      case 'goalie_freeze': return '🧤'

      // Shots
      case 'shot':
      case 'shot_blocked':
      case 'shot_missed':
      case 'shot_deflected':
      case 'missed_shot': return '🏒'

      // Hits
      case 'hit':
      case 'hit_big':
      case 'hit_illegal': return '💥'

      // Blocked shots
      case 'blocked_shot':
      case 'blocked_shot_heroic': return '🚫'

      // Faceoffs
      case 'faceoff':
      case 'faceoff_won':
      case 'faceoff_lost':
      case 'faceoff_violation': return '⚡'

      // Penalties & Fights
      case 'penalty':
      case 'penalty_double_minor':
      case 'penalty_major':
      case 'penalty_misconduct':
      case 'penalty_bench':
      case 'delayed_penalty': return '⚠️'
      case 'fight':
      case 'fight_instigator': return '🥊'

      // Special situations
      case 'icing':
      case 'icing_waved_off': return '🧊'
      case 'offside':
      case 'offside_delayed': return '🚩'
      case 'too_many_men': return '👥'

      // Zone entry & transition
      case 'zone_entry_controlled':
      case 'zone_entry_dump':
      case 'zone_entry_failed':
      case 'breakout':
      case 'breakout_failed': return '➡️'

      // Special plays
      case 'breakaway':
      case 'shorthanded_breakaway': return '💨'
      case 'wraparound_attempt': return '🔄'
      case 'rush_2on1':
      case 'rush_3on2':
      case 'rush_odd_man': return '⚡'

      // Turnovers
      case 'takeaway': return '✅'
      case 'giveaway':
      case 'turnover': return '⚠️'
      case 'pass_intercepted': return '🚫'

      // Equipment & injuries
      case 'stick_broken':
      case 'equipment_issue': return '🔧'
      case 'injury': return '🚑'
      case 'injury_serious': return '🚨'
      case 'glass_broken': return '💥'
      case 'net_dislodged': return '🥅'

      // Special teams
      case 'powerplay_setup':
      case 'powerplay_shot': return '⚡'
      case 'shorthanded_goal': return '🚨'

      // Goalie management
      case 'goalie_pulled':
      case 'goalie_returned': return '🥅'

      // Game flow
      case 'period_start':
      case 'game_start': return '▶️'
      case 'period_end':
      case 'game_end': return '⏸️'
      case 'timeout':
      case 'tv_timeout': return '⏱️'
      case 'momentum_shift': return '🔄'

      // Shootout
      case 'shootout_attempt':
      case 'shootout_miss': return '🏒'
      case 'shootout_goal': return '🚨'

      default: return '•'
    }
  }

  const getEventDescription = (event: GameEvent) => {
    switch (event.event_type) {
      // Basic events
      case 'game_start':
        return <span className="font-semibold">Début du match</span>
      case 'game_end':
        return <span className="font-semibold">Fin du match</span>
      case 'period_start':
        return <span className="font-semibold">Début de période</span>
      case 'period_end':
        return <span className="font-semibold">Fin de période</span>

      // Goals
      case 'goal':
        return (
          <span>
            <span className="font-semibold text-emerald-400">{event.player_name}</span> marque!
            {event.secondary_player_name && (
              <span className="text-slate-400"> (Passe: {event.secondary_player_name})</span>
            )}
            {event.details?.goal_type && (
              <span className="text-slate-500 text-xs"> [{event.details.goal_type}]</span>
            )}
          </span>
        )
      case 'goal_disallowed':
        return <span>But refusé de <span className="font-semibold">{event.player_name}</span></span>

      // Saves (use goalie_name)
      case 'save':
        return (
          <span>
            Arrêt de <span className="font-semibold">{event.goalie_name || event.player_name}</span>
            {event.details?.save_type && (
              <span className="text-slate-500 text-xs"> [{event.details.save_type}]</span>
            )}
          </span>
        )
      case 'save_spectacular':
        return (
          <span>
            <span className="font-semibold text-sky-400">Arrêt spectaculaire</span> de <span className="font-semibold">{event.goalie_name || event.player_name}</span>!
            {event.details?.save_type && (
              <span className="text-slate-500 text-xs"> [{event.details.save_type}]</span>
            )}
          </span>
        )

      // Shots
      case 'shot':
        return (
          <span>
            Tir de <span className="font-semibold">{event.player_name}</span>
            {event.details?.shot_type && (
              <span className="text-slate-500 text-xs"> [{event.details.shot_type}]</span>
            )}
          </span>
        )
      case 'shot_blocked':
        return <span>Tir bloqué par <span className="font-semibold">{event.player_name}</span></span>
      case 'shot_missed':
      case 'missed_shot':
        return <span>Tir raté de <span className="font-semibold">{event.player_name}</span></span>
      case 'shot_deflected':
        return <span>Tir dévié par <span className="font-semibold">{event.player_name}</span></span>

      // Faceoffs
      case 'faceoff':
        return <span>Mise au jeu</span>
      case 'faceoff_won':
        return <span>Mise au jeu gagnée par <span className="font-semibold">{event.player_name}</span></span>
      case 'faceoff_lost':
        return <span>Mise au jeu perdue par <span className="font-semibold">{event.player_name}</span></span>
      case 'faceoff_violation':
        return <span>Violation lors de la mise au jeu</span>

      // Zone entry
      case 'zone_entry_controlled':
        return <span>Entrée de zone contrôlée par <span className="font-semibold">{event.player_name}</span></span>
      case 'zone_entry_dump':
        return <span>Dégagement en zone adverse par {event.team_name}</span>
      case 'zone_entry_failed':
        return <span>Entrée de zone ratée</span>

      // Offensive plays
      case 'wraparound_attempt':
        return <span>Tentative de wraparound par <span className="font-semibold">{event.player_name}</span></span>
      case 'breakaway':
        return <span><span className="font-semibold text-amber-400">Échappée</span> de <span className="font-semibold">{event.player_name}</span>!</span>
      case 'rebound':
        return <span>Retour de lancer</span>
      case 'screen':
        return <span>Écran devant le filet par <span className="font-semibold">{event.player_name}</span></span>
      case 'pass':
        return <span>Passe de <span className="font-semibold">{event.player_name}</span></span>
      case 'pass_intercepted':
        return <span>Passe interceptée par <span className="font-semibold">{event.player_name}</span></span>
      case 'stick_broken':
        return <span>Bâton brisé - <span className="font-semibold">{event.player_name}</span></span>

      // Hits
      case 'hit':
        return (
          <span>
            Mise en échec par <span className="font-semibold">{event.player_name}</span>
            {event.secondary_player_name && (
              <span className="text-slate-400"> sur {event.secondary_player_name}</span>
            )}
          </span>
        )
      case 'hit_big':
        return (
          <span>
            <span className="font-semibold text-orange-400">Grosse mise en échec</span> par <span className="font-semibold">{event.player_name}</span>
            {event.secondary_player_name && (
              <span className="text-slate-400"> sur {event.secondary_player_name}</span>
            )}
          </span>
        )
      case 'hit_illegal':
        return <span>Mise en échec illégale par <span className="font-semibold">{event.player_name}</span></span>

      // Blocked shots
      case 'blocked_shot':
        return (
          <span>
            Tir bloqué par <span className="font-semibold">{event.player_name}</span>
            {event.secondary_player_name && (
              <span className="text-slate-400"> (Tireur: {event.secondary_player_name})</span>
            )}
          </span>
        )
      case 'blocked_shot_heroic':
        return (
          <span>
            <span className="font-semibold text-purple-400">Tir bloqué héroïque</span> par <span className="font-semibold">{event.player_name}</span>!
          </span>
        )

      // Defensive plays
      case 'takeaway':
        return <span>Revirement provoqué par <span className="font-semibold">{event.player_name}</span></span>
      case 'giveaway':
        return <span>Revirement de <span className="font-semibold">{event.player_name}</span></span>
      case 'poke_check':
        return <span>Poke check par <span className="font-semibold">{event.player_name}</span></span>
      case 'stick_lift':
        return <span>Soulèvement de bâton par <span className="font-semibold">{event.player_name}</span></span>
      case 'clearance':
        return <span>Dégagement par <span className="font-semibold">{event.player_name}</span></span>
      case 'clearance_failed':
        return <span>Dégagement raté</span>

      // Transition
      case 'breakout':
        return <span>Sortie de zone par {event.team_name}</span>
      case 'breakout_failed':
        return <span>Sortie de zone ratée</span>
      case 'rush_2on1':
        return <span><span className="font-semibold text-cyan-400">Attaque 2 contre 1</span> par {event.team_name}</span>
      case 'rush_3on2':
        return <span><span className="font-semibold text-cyan-400">Attaque 3 contre 2</span> par {event.team_name}</span>
      case 'rush_odd_man':
        return <span><span className="font-semibold text-cyan-400">Attaque à l'avantage numérique</span> par {event.team_name}</span>
      case 'turnover':
        return <span>Revirement dans la zone de {event.team_name}</span>

      // Special teams
      case 'powerplay_setup':
        return <span>Installation en avantage numérique</span>
      case 'powerplay_shot':
        return <span>Tir en avantage numérique par <span className="font-semibold">{event.player_name}</span></span>
      case 'shorthanded_breakaway':
        return <span><span className="font-semibold text-amber-400">Échappée en désavantage numérique</span> par <span className="font-semibold">{event.player_name}</span>!</span>
      case 'shorthanded_goal':
        return <span><span className="font-semibold text-emerald-400">But en désavantage numérique</span> par <span className="font-semibold">{event.player_name}</span>!</span>
      case 'penalty_kill_clear':
        return <span>Dégagement en désavantage numérique</span>

      // Penalties
      case 'penalty':
        return (
          <span>
            Pénalité à <span className="font-semibold text-yellow-400">{event.player_name}</span>
            {event.details?.infraction && ` - ${event.details.infraction}`}
            {event.details?.minutes && ` (${event.details.minutes} min)`}
          </span>
        )
      case 'penalty_double_minor':
        return <span>Pénalité double mineure à <span className="font-semibold text-yellow-400">{event.player_name}</span></span>
      case 'penalty_major':
        return <span>Pénalité majeure à <span className="font-semibold text-red-400">{event.player_name}</span></span>
      case 'penalty_misconduct':
        return <span>Inconduite à <span className="font-semibold text-red-400">{event.player_name}</span></span>
      case 'penalty_bench':
        return <span>Pénalité au banc de {event.team_name}</span>
      case 'delayed_penalty':
        return <span>Pénalité différée contre {event.team_name}</span>

      // Fights
      case 'fight':
        return (
          <span>
            <span className="font-semibold text-red-400">Bagarre</span> entre <span className="font-semibold">{event.player_name}</span>
            {event.secondary_player_name && (
              <span> et <span className="font-semibold">{event.secondary_player_name}</span></span>
            )}
          </span>
        )
      case 'fight_instigator':
        return <span>Bagarre instigatrice par <span className="font-semibold text-red-400">{event.player_name}</span></span>

      // Goalie specific
      case 'goalie_freeze':
        return <span>Arrêt de jeu par <span className="font-semibold">{event.goalie_name || event.player_name}</span></span>
      case 'goalie_save_glove':
        return <span>Arrêt du gant par <span className="font-semibold">{event.goalie_name || event.player_name}</span></span>
      case 'goalie_save_pad':
        return <span>Arrêt du patin par <span className="font-semibold">{event.goalie_name || event.player_name}</span></span>
      case 'goalie_save_blocker':
        return <span>Arrêt du bouclier par <span className="font-semibold">{event.goalie_name || event.player_name}</span></span>
      case 'goalie_poke_check':
        return <span>Poke check du gardien <span className="font-semibold">{event.goalie_name || event.player_name}</span></span>
      case 'goalie_pulled':
        return <span>Gardien retiré - {event.team_name}</span>
      case 'goalie_returned':
        return <span>Gardien de retour au jeu - {event.team_name}</span>
      case 'goalie_trapezoid_violation':
        return <span>Violation du trapèze par <span className="font-semibold">{event.goalie_name || event.player_name}</span></span>

      // Special situations
      case 'icing':
        return <span>Dégagement refusé contre {event.team_name}</span>
      case 'icing_waved_off':
        return <span>Dégagement annulé</span>
      case 'offside':
        return <span>Hors-jeu contre {event.team_name}</span>
      case 'offside_delayed':
        return <span>Hors-jeu différé contre {event.team_name}</span>
      case 'too_many_men':
        return <span>Trop de joueurs sur la glace - {event.team_name}</span>
      case 'hand_pass':
        return <span>Passe à la main</span>
      case 'high_stick_puck':
        return <span>Rondelle frappée avec un bâton élevé</span>
      case 'net_dislodged':
        return <span>Filet déplacé</span>
      case 'equipment_issue':
        return (
          <span>
            Problème d'équipement
            {event.player_name && <span> - <span className="font-semibold">{event.player_name}</span></span>}
            {event.details?.issue && <span className="text-slate-500 text-xs"> [{event.details.issue}]</span>}
          </span>
        )
      case 'timeout':
        return <span>Temps d'arrêt demandé par {event.team_name}</span>
      case 'tv_timeout':
        return <span>Temps d'arrêt télévisé</span>

      // Rare events
      case 'glass_broken':
        return <span className="font-semibold text-red-400">Vitre brisée - Arrêt de jeu</span>
      case 'delay_of_game':
        return <span>Retardement du jeu</span>
      case 'injury':
        return (
          <span>
            Blessure
            {event.player_name && <span> - <span className="font-semibold">{event.player_name}</span></span>}
          </span>
        )
      case 'injury_serious':
        return (
          <span className="font-semibold text-red-400">
            Blessure sérieuse
            {event.player_name && <span> - {event.player_name}</span>}
          </span>
        )
      case 'momentum_shift':
        return <span className="font-semibold text-purple-400">Changement d'élan dans le match</span>

      // Shootout
      case 'shootout_attempt':
        return <span>Tentative en fusillade par <span className="font-semibold">{event.player_name}</span></span>
      case 'shootout_goal':
        return <span>But en fusillade par <span className="font-semibold text-emerald-400">{event.player_name}</span>!</span>
      case 'shootout_miss':
        return <span>Tentative ratée en fusillade par <span className="font-semibold">{event.player_name}</span></span>

      default:
        return <span>{event.event_type}</span>
    }
  }

  return (
    <div className="space-y-6">
      {Object.keys(eventsByPeriod).sort((a, b) => Number(a) - Number(b)).map((period) => {
        const periodEvents = eventsByPeriod[Number(period)]

        return (
          <div key={period} className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              {Number(period) <= 3 ? `Période ${period}` : Number(period) === 4 ? 'Prolongation' : 'Fusillade'}
            </h3>
            <div className="space-y-1">
              {periodEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-2 px-3 rounded hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-slate-400 font-mono text-sm min-w-[50px]">
                    {formatGameTime(event.game_time_seconds)}
                  </span>
                  <span className="text-lg">{getEventIcon(event.event_type)}</span>
                  <div className="flex-1 text-slate-300 text-sm">
                    {getEventDescription(event)}
                    {event.zone && (
                      <span className="ml-2 text-xs text-slate-500 capitalize">
                        ({event.zone})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 min-w-[100px] text-right">
                    {event.team_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
