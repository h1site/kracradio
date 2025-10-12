import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlayerStats, useGoalieStats } from '../api/playerStats'
import { useLeagueStore } from '../state/useLeagueStore'

type TabType = 'stats' | 'finance' | 'season' | 'career'

export const PlayerStatsPage = () => {
  const { playerId } = useParams<{ playerId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { selectedLeagueId } = useLeagueStore()
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [imageError, setImageError] = useState(false)

  const isGoalie = searchParams.get('type') === 'goalie'

  const { data: playerData, isLoading: playerLoading } = usePlayerStats(
    !isGoalie && playerId ? playerId : null,
    selectedLeagueId
  )

  const { data: goalieData, isLoading: goalieLoading } = useGoalieStats(
    isGoalie && playerId ? playerId : null,
    selectedLeagueId
  )

  const data = isGoalie ? goalieData : playerData
  const isLoading = isGoalie ? goalieLoading : playerLoading

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">Joueur introuvable</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  const { player, seasonStats, careerStats } = data

  // Get player's NHL ID for photo
  const playerPhotoUrl = player.nhl_id && !imageError
    ? `https://assets.nhle.com/mugs/nhl/latest/${player.nhl_id}.png`
    : null

  // Rating color helper
  const getRatingColor = (value: number | null | undefined) => {
    if (typeof value !== 'number') return 'text-slate-400'
    if (value >= 85) return 'text-green-400'
    if (value >= 75) return 'text-sky-400'
    if (value >= 65) return 'text-yellow-400'
    return 'text-orange-400'
  }

  // Real ratings from database
  const skaterRatings = !isGoalie ? [
    { label: 'Checking', value: player.checking },
    { label: 'Fighting', value: player.fight },
    { label: 'Discipline', value: player.discipline },
    { label: 'Skating', value: player.skating },
    { label: 'Strength', value: player.strength },
    { label: 'Endurance', value: player.endurance },
    { label: 'Durability', value: player.durability },
    { label: 'Puck Handling', value: player.puck_handling },
    { label: 'Face-Offs', value: player.face_offs },
    { label: 'Passing', value: player.passing },
    { label: 'Scoring', value: player.scoring },
    { label: 'Defense', value: player.defense },
    { label: 'Penalty Shots', value: player.penalty_shots },
    { label: 'Experience', value: player.experience },
    { label: 'Leadership', value: player.leadership },
    { label: 'Potential', value: player.potential },
  ] : []

  const goalieRatings = isGoalie ? [
    { label: 'Skating', value: player.skating },
    { label: 'Durability', value: player.durability },
    { label: 'Endurance', value: player.endurance },
    { label: 'Size', value: player.size },
    { label: 'Agility', value: player.agility },
    { label: 'Rebound Control', value: player.rebound_direction },
    { label: 'Style Control', value: player.style_control },
    { label: 'Hand Speed', value: player.hand_speed },
    { label: 'Reaction Time', value: player.reaction_time },
    { label: 'Puck Control', value: player.puck_control },
    { label: 'Penalty Shots', value: player.penalty_shots },
    { label: 'Experience', value: player.experience },
    { label: 'Leadership', value: player.leadership },
    { label: 'Potential', value: player.potential },
    { label: 'Strength', value: player.strength },
  ] : []

  const currentRatings = isGoalie ? goalieRatings : skaterRatings

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 transition-colors"
          >
            <span>←</span>
            <span>Retour</span>
          </button>
        </div>

        {/* Player Header Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700">
          <div className="flex items-center gap-6">
            {/* Player Photo */}
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-800">
              {playerPhotoUrl ? (
                <img
                  src={playerPhotoUrl}
                  alt={player.name}
                  className="h-full w-full object-cover object-top"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-4xl font-bold text-slate-500">
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{player.name}</h1>
                <span className="rounded bg-slate-700 px-3 py-1 text-sm font-semibold text-slate-200">
                  {player.position}
                </span>
                {player.overall_rating && (
                  <div className="rounded bg-sky-600 px-3 py-1">
                    <span className="text-xs font-semibold text-sky-100">OVR</span>
                    <span className="ml-1 text-lg font-bold text-white">{player.overall_rating}</span>
                  </div>
                )}
              </div>
              {player.team_name && (
                <p className="text-lg text-slate-300">
                  {player.team_city} {player.team_name}
                </p>
              )}
              {player.age && (
                <p className="mt-1 text-sm text-slate-400">Âge: {player.age}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 bg-slate-800/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'finance'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Contract
            </button>
            <button
              onClick={() => setActiveTab('season')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'season'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              This Season
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'career'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Career
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Stats Tab - Player Ratings */}
          {activeTab === 'stats' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">Player Ratings</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {currentRatings.map((rating) => (
                  <div
                    key={rating.label}
                    className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                  >
                    <span className="text-sm text-slate-400">{rating.label}</span>
                    <span className={`text-lg font-bold ${getRatingColor(rating.value)}`}>
                      {rating.value ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">Contract Information</h3>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">
                  Contract information not available yet
                </p>
              </div>
            </div>
          )}

          {/* This Season Tab */}
          {activeTab === 'season' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-200">This Season Statistics</h3>

              {seasonStats.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">No season statistics available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {seasonStats[0] && (
                    <>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Matchs</div>
                        <div className="text-2xl font-bold text-slate-100">{seasonStats[0].games_played}</div>
                      </div>

                      {!isGoalie ? (
                        <>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">Buts</div>
                            <div className="text-2xl font-bold text-emerald-400">{seasonStats[0].goals}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">Passes</div>
                            <div className="text-2xl font-bold text-sky-400">{seasonStats[0].assists}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">Points</div>
                            <div className="text-2xl font-bold text-amber-400">{seasonStats[0].points}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">+/-</div>
                            <div className={`text-2xl font-bold ${seasonStats[0].plus_minus > 0 ? 'text-emerald-400' : seasonStats[0].plus_minus < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                              {seasonStats[0].plus_minus > 0 ? '+' : ''}{seasonStats[0].plus_minus}
                            </div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">Tirs</div>
                            <div className="text-2xl font-bold text-slate-100">{seasonStats[0].shots}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">Victoires</div>
                            <div className="text-2xl font-bold text-emerald-400">{seasonStats[0].wins}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">Défaites</div>
                            <div className="text-2xl font-bold text-red-400">{seasonStats[0].losses}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">%Arrêts</div>
                            <div className="text-2xl font-bold text-sky-400">
                              {seasonStats[0].shots_against > 0
                                ? ((seasonStats[0].saves / seasonStats[0].shots_against) * 100).toFixed(1)
                                : '0.0'}%
                            </div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-4">
                            <div className="text-xs uppercase text-slate-400 mb-1">MOY</div>
                            <div className="text-2xl font-bold text-slate-100">
                              {seasonStats[0].games_played > 0
                                ? (seasonStats[0].goals_against / seasonStats[0].games_played).toFixed(2)
                                : '0.00'}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Career Tab */}
          {activeTab === 'career' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-200">Career Statistics</h3>

              {!careerStats ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">No career statistics available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="bg-slate-800/40 rounded-lg p-4">
                    <div className="text-xs uppercase text-slate-400 mb-1">Matchs</div>
                    <div className="text-2xl font-bold text-slate-100">{careerStats.games_played}</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-lg p-4">
                    <div className="text-xs uppercase text-slate-400 mb-1">Saisons</div>
                    <div className="text-2xl font-bold text-slate-100">{careerStats.seasons_played}</div>
                  </div>

                  {!isGoalie ? (
                    <>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Buts</div>
                        <div className="text-2xl font-bold text-emerald-400">{careerStats.goals}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Passes</div>
                        <div className="text-2xl font-bold text-sky-400">{careerStats.assists}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Points</div>
                        <div className="text-2xl font-bold text-amber-400">{careerStats.points}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">+/-</div>
                        <div className={`text-2xl font-bold ${careerStats.plus_minus > 0 ? 'text-emerald-400' : careerStats.plus_minus < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {careerStats.plus_minus > 0 ? '+' : ''}{careerStats.plus_minus}
                        </div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Tirs</div>
                        <div className="text-2xl font-bold text-slate-100">{careerStats.shots}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Mises</div>
                        <div className="text-2xl font-bold text-slate-100">{careerStats.hits}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Punitions</div>
                        <div className="text-2xl font-bold text-slate-100">{careerStats.penalty_minutes}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Temps de glace</div>
                        <div className="text-lg font-bold text-slate-100">{formatTime(careerStats.time_on_ice)}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Victoires</div>
                        <div className="text-2xl font-bold text-emerald-400">{careerStats.wins}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Défaites</div>
                        <div className="text-2xl font-bold text-red-400">{careerStats.losses}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">DP</div>
                        <div className="text-2xl font-bold text-slate-100">{careerStats.ot_losses}</div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">%Arrêts</div>
                        <div className="text-2xl font-bold text-sky-400">
                          {careerStats.shots_against > 0
                            ? ((careerStats.saves / careerStats.shots_against) * 100).toFixed(1)
                            : '0.0'}%
                        </div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">MOY</div>
                        <div className="text-2xl font-bold text-slate-100">
                          {careerStats.games_played > 0
                            ? (careerStats.goals_against / careerStats.games_played).toFixed(2)
                            : '0.00'}
                        </div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="text-xs uppercase text-slate-400 mb-1">Blanchissages</div>
                        <div className="text-2xl font-bold text-emerald-400">{careerStats.shutouts}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
