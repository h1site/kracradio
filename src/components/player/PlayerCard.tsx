import { useState } from 'react'

interface PlayerCardProps {
  playerId: string
  playerName: string
  nhlId?: string | null
  position: string
  teamName?: string
  teamLogoUrl?: string
  overallRating?: number
  onClick?: () => void
}

export const PlayerCard = ({
  playerName,
  nhlId,
  position,
  teamName,
  teamLogoUrl,
  overallRating,
  onClick,
}: PlayerCardProps) => {
  const [imageError, setImageError] = useState(false)

  // Construct NHL player mugshot URL
  const playerPhotoUrl = nhlId && !imageError
    ? `https://assets.nhle.com/mugs/nhl/latest/${nhlId}.png`
    : null

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 transition-all ${
        onClick ? 'cursor-pointer hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/20' : ''
      }`}
    >
      {/* Header with team logo */}
      {teamLogoUrl && (
        <div className="absolute right-2 top-2 z-10">
          <img
            src={teamLogoUrl}
            alt={teamName || 'Team'}
            className="h-8 w-8 opacity-50"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Player Photo */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-b from-slate-700 to-slate-800">
        {playerPhotoUrl ? (
          <img
            src={playerPhotoUrl}
            alt={playerName}
            className="h-full w-full object-cover object-top"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-700 text-4xl font-bold text-slate-400">
              {playerName.charAt(0)}
            </div>
          </div>
        )}

        {/* Overall Rating Badge */}
        {overallRating !== undefined && (
          <div className="absolute bottom-2 left-2 rounded bg-slate-900/80 px-3 py-1 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400">OVR</span>
            <span className="ml-1 text-lg font-bold text-sky-400">{overallRating}</span>
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-sky-400">
            {playerName}
          </h3>
          <span className="rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-300">
            {position}
          </span>
        </div>
        {teamName && (
          <p className="text-sm text-slate-400">{teamName}</p>
        )}
      </div>

      {/* Hover effect overlay */}
      {onClick && (
        <div className="absolute inset-0 bg-sky-500/0 transition-colors group-hover:bg-sky-500/5" />
      )}
    </div>
  )
}
