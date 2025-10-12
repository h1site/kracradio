import { useNavigate } from 'react-router-dom'
import { PlayerAvatar } from '../common/PlayerAvatar'

interface PlayerLinkProps {
  playerId: string
  playerName: string
  nhlId?: string | null
  position: string
  teamName?: string
  overallRating?: number
  ratings?: Record<string, number>
  className?: string
  children?: React.ReactNode
}

export const PlayerLink = ({
  playerId,
  playerName,
  nhlId,
  position,
  className = '',
  children,
}: PlayerLinkProps) => {
  const navigate = useNavigate()
  const isGoalie = position === 'G'

  const handleClick = () => {
    navigate(`/player/${playerId}${isGoalie ? '?type=goalie' : ''}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-sky-400 hover:text-sky-300 hover:underline ${className}`}
    >
      <PlayerAvatar
        nhl_id={nhlId}
        name={playerName}
        size="md"
      />
      <span>{children || playerName}</span>
    </button>
  )
}
