import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayerSeasonStats, useGoalieSeasonStats } from '../../api/playerSeasonStats'

interface PlayerDetailModalProps {
  playerId: string
  playerName: string
  nhlId?: string | null
  position: string
  teamName?: string
  overallRating?: number
  ratings?: Record<string, number>
  onClose: () => void
}

type TabType = 'stats' | 'finance' | 'season' | 'career'

export const PlayerDetailModal = ({
  playerId,
  playerName,
  nhlId,
  position,
  teamName,
  overallRating,
  ratings,
  onClose,
}: PlayerDetailModalProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [imageError, setImageError] = useState(false)

  const playerPhotoUrl = nhlId && !imageError
    ? `https://assets.nhle.com/mugs/nhl/latest/${nhlId}.png`
    : null

  const isGoalie = position === 'G'

  // Fetch season stats
  const currentSeason = new Date().getFullYear()
  const { data: skaterStats, isLoading: skaterStatsLoading } = usePlayerSeasonStats(
    playerId,
    currentSeason
  )
  const { data: goalieStats, isLoading: goalieStatsLoading } = useGoalieSeasonStats(
    playerId,
    currentSeason
  )

  // Separate ratings by type
  const skaterRatings = ratings && !isGoalie ? [
    { label: 'Checking', key: 'CK' },
    { label: 'Fighting', key: 'FG' },
    { label: 'Discipline', key: 'DI' },
    { label: 'Skating', key: 'SK' },
    { label: 'Strength', key: 'ST' },
    { label: 'Endurance', key: 'EN' },
    { label: 'Durability', key: 'DU' },
    { label: 'Puck Handling', key: 'PH' },
    { label: 'Face-Offs', key: 'FO' },
    { label: 'Passing', key: 'PA' },
    { label: 'Scoring', key: 'SC' },
    { label: 'Defense', key: 'DF' },
    { label: 'Penalty Shots', key: 'PS' },
    { label: 'Experience', key: 'EX' },
    { label: 'Leadership', key: 'LD' },
    { label: 'Potential', key: 'PO' },
  ] : null

  const goalieRatings = ratings && isGoalie ? [
    { label: 'Skating', key: 'SK' },
    { label: 'Durability', key: 'DU' },
    { label: 'Endurance', key: 'EN' },
    { label: 'Size', key: 'SZ' },
    { label: 'Agility', key: 'AG' },
    { label: 'Rebound Control', key: 'RB' },
    { label: 'Style Control', key: 'SC' },
    { label: 'Hand Speed', key: 'HS' },
    { label: 'Reaction Time', key: 'RT' },
    { label: 'Puck Control', key: 'PC' },
    { label: 'Penalty Shots', key: 'PS' },
    { label: 'Experience', key: 'EX' },
    { label: 'Leadership', key: 'LD' },
    { label: 'Potential', key: 'PO' },
    { label: 'Strength', key: 'ST' },
  ] : null

  const currentRatings = isGoalie ? goalieRatings : skaterRatings

  const getRatingValue = (key: string) => {
    return ratings?.[key] ?? ratings?.[key.toLowerCase()] ?? '-'
  }

  const getRatingColor = (value: number | string) => {
    if (typeof value !== 'number') return 'text-slate-400'
    if (value >= 85) return 'text-green-400'
    if (value >= 75) return 'text-sky-400'
    if (value >= 65) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          ✕
        </button>

        {/* Header with Player Photo */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6">
          <div className="flex items-center gap-6">
            {/* Player Photo */}
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-800">
              {playerPhotoUrl ? (
                <img
                  src={playerPhotoUrl}
                  alt={playerName}
                  className="h-full w-full object-cover object-top"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-4xl font-bold text-slate-500">
                    {playerName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">{playerName}</h2>
                <span className="rounded bg-slate-700 px-3 py-1 text-sm font-semibold text-slate-200">
                  {position}
                </span>
                {overallRating !== undefined && (
                  <div className="rounded bg-sky-600 px-3 py-1">
                    <span className="text-xs font-semibold text-sky-100">OVR</span>
                    <span className="ml-1 text-lg font-bold text-white">{overallRating}</span>
                  </div>
                )}
              </div>
              {teamName && (
                <p className="text-lg text-slate-300">{teamName}</p>
              )}
              {nhlId && (
                <p className="mt-1 text-xs text-slate-500">NHL ID: {nhlId}</p>
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
              {t('player.tabs.stats', 'Stats')}
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'finance'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('player.tabs.finance', 'Contract')}
            </button>
            <button
              onClick={() => setActiveTab('season')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'season'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('player.tabs.season', 'This Season')}
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'career'
                  ? 'border-b-2 border-sky-500 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('player.tabs.career', 'Career')}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-h-[50vh] overflow-y-auto p-6">
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                {t('player.ratings.title', 'Player Ratings')}
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {currentRatings?.map((rating) => {
                  const value = getRatingValue(rating.key)
                  return (
                    <div
                      key={rating.key}
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                    >
                      <span className="text-sm text-slate-400">{rating.label}</span>
                      <span className={`text-lg font-bold ${getRatingColor(value)}`}>
                        {value}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                {t('player.contract.title', 'Contract Information')}
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">
                    {t('player.contract.noData', 'Contract information not available yet')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Season Stats Tab */}
          {activeTab === 'season' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                {t('player.seasonStats.title', `${currentSeason} Season Statistics`)}
              </h3>

              {(skaterStatsLoading || goalieStatsLoading) && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">Loading statistics...</p>
                </div>
              )}

              {!skaterStatsLoading && !goalieStatsLoading && !isGoalie && !skaterStats && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">
                    No statistics available for this season yet. Stats will appear after games are simulated.
                  </p>
                </div>
              )}

              {!skaterStatsLoading && !goalieStatsLoading && isGoalie && !goalieStats && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">
                    No statistics available for this season yet. Stats will appear after games are simulated.
                  </p>
                </div>
              )}

              {/* Skater Stats Display */}
              {!isGoalie && skaterStats && (
                <div className="space-y-4">
                  {/* Basic Stats */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-300">Basic Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GP</div>
                        <div className="text-lg font-bold text-white">{skaterStats.games_played}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">G</div>
                        <div className="text-lg font-bold text-white">{skaterStats.goals}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">A</div>
                        <div className="text-lg font-bold text-white">{skaterStats.assists}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">PTS</div>
                        <div className="text-lg font-bold text-sky-400">{skaterStats.points}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">+/-</div>
                        <div className={`text-lg font-bold ${skaterStats.plus_minus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {skaterStats.plus_minus > 0 ? '+' : ''}{skaterStats.plus_minus}
                        </div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">PIM</div>
                        <div className="text-lg font-bold text-white">{skaterStats.penalty_minutes}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">S</div>
                        <div className="text-lg font-bold text-white">{skaterStats.shots}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">S%</div>
                        <div className="text-lg font-bold text-white">{(skaterStats.shooting_percentage || 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Special Teams */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-300">Special Teams</h4>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">EVG</div>
                        <div className="text-lg font-bold text-white">{skaterStats.even_strength_goals}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">PPG</div>
                        <div className="text-lg font-bold text-white">{skaterStats.power_play_goals}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">SHG</div>
                        <div className="text-lg font-bold text-white">{skaterStats.short_handed_goals}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GWG</div>
                        <div className="text-lg font-bold text-white">{skaterStats.game_winning_goals}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">OTG</div>
                        <div className="text-lg font-bold text-white">{skaterStats.overtime_goals}</div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Stats */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-300">Advanced Stats</h4>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">HIT</div>
                        <div className="text-lg font-bold text-white">{skaterStats.hits}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">BLK</div>
                        <div className="text-lg font-bold text-white">{skaterStats.blocks}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">FO%</div>
                        <div className="text-lg font-bold text-white">{(skaterStats.faceoff_percentage || 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Goalie Stats Display */}
              {isGoalie && goalieStats && (
                <div className="space-y-4">
                  {/* Basic Stats */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-300">Basic Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GP</div>
                        <div className="text-lg font-bold text-white">{goalieStats.games_played}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GS</div>
                        <div className="text-lg font-bold text-white">{goalieStats.games_started}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">W</div>
                        <div className="text-lg font-bold text-green-400">{goalieStats.wins}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">L</div>
                        <div className="text-lg font-bold text-red-400">{goalieStats.losses}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">OTL</div>
                        <div className="text-lg font-bold text-white">{goalieStats.ot_losses}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">SO</div>
                        <div className="text-lg font-bold text-white">{goalieStats.shutouts}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">MIN</div>
                        <div className="text-lg font-bold text-white">{goalieStats.minutes_played}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">WIN%</div>
                        <div className="text-lg font-bold text-white">{(goalieStats.win_percentage || 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Goalie Performance */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-300">Performance</h4>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GA</div>
                        <div className="text-lg font-bold text-white">{goalieStats.goals_against}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">SA</div>
                        <div className="text-lg font-bold text-white">{goalieStats.shots_against}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">SV</div>
                        <div className="text-lg font-bold text-white">{goalieStats.saves}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">SV%</div>
                        <div className="text-lg font-bold text-sky-400">{(goalieStats.save_percentage || 0).toFixed(3)}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GAA</div>
                        <div className="text-lg font-bold text-white">{(goalieStats.goals_against_average || 0).toFixed(2)}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">QS</div>
                        <div className="text-lg font-bold text-white">{goalieStats.quality_starts || 0}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">RBS</div>
                        <div className="text-lg font-bold text-white">{goalieStats.really_bad_starts || 0}</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
                        <div className="text-xs text-slate-400">GSAA</div>
                        <div className="text-lg font-bold text-white">{(goalieStats.goals_saved_above_average || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Career Stats Tab */}
          {activeTab === 'career' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                {t('player.careerStats.title', 'Career Statistics')}
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm text-slate-400">
                    {t('player.careerStats.noData', 'Career statistics not available yet')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
