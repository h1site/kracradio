import { useState } from 'react'

interface PlayerAvatarProps {
  nhl_id?: string | number | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PlayerAvatar = ({ nhl_id, name, size = 'md', className = '' }: PlayerAvatarProps) => {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-12 w-12 text-sm'
  }

  const sizeClass = sizeClasses[size]

  // Same URL logic as PlayerDetailModal
  const playerPhotoUrl = nhl_id && !imageError
    ? `https://assets.nhle.com/mugs/nhl/latest/${nhl_id}.png`
    : null

  // If no photo URL, show initial
  if (!playerPhotoUrl) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-semibold ${className}`}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  // Try to load NHL headshot
  return (
    <img
      src={playerPhotoUrl}
      alt={name}
      className={`${sizeClass} rounded-full object-cover bg-slate-700 ${className}`}
      onError={() => setImageError(true)}
      title={name}
    />
  )
}
