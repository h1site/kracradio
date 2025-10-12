import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { PlayerLink } from '../components/player/PlayerLink'

interface TeamInfo {
  id: string
  name: string
  city: string
  division: string | null
  conference: string | null
}

interface Player {
  id: string
  name: string
  position: string
  jersey_number: number | null
  overall_rating: number | null
  nhl_id: number | null
}

export const TeamRosterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { teamId } = useParams<{ teamId: string }>()

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, city, division, conference')
        .eq('id', teamId)
        .single()

      if (error) throw error
      return data as TeamInfo
    },
    enabled: !!teamId,
  })

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['team-roster', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, position, jersey_number, overall_rating, nhl_id')
        .eq('team_id', teamId)
        .order('jersey_number', { ascending: true, nullsFirst: false })

      if (error) throw error
      return data as Player[]
    },
    enabled: !!teamId,
  })

  const { data: goalies, isLoading: goaliesLoading } = useQuery({
    queryKey: ['team-goalies', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goalies')
        .select('id, name, position, jersey_number, overall_rating, nhl_id')
        .eq('team_id', teamId)
        .order('jersey_number', { ascending: true, nullsFirst: false })

      if (error) throw error
      return data as Player[]
    },
    enabled: !!teamId,
  })

  const isLoading = teamLoading || playersLoading || goaliesLoading

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-400">{t('team.notFound', 'Team not found')}</div>
      </div>
    )
  }

  // Group players by position
  const forwards = players?.filter((p) => ['C', 'LW', 'RW', 'F'].includes(p.position)) || []
  const defensemen = players?.filter((p) => p.position === 'D') || []
  const allGoalies = goalies || []

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'text-slate-400'
    if (rating >= 85) return 'text-green-400'
    if (rating >= 75) return 'text-sky-400'
    if (rating >= 65) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const PositionGroup = ({ title, players }: { title: string; players: Player[] }) => (
    <div className="mb-6">
      <h3 className="mb-3 text-lg font-semibold text-slate-300">{title}</h3>
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <table className="w-full">
          <thead className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">
                {t('roster.player', 'Player')}
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                {t('roster.position', 'Pos')}
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                {t('roster.overall', 'OVR')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-400">
                  {player.jersey_number || '-'}
                </td>
                <td className="px-4 py-3">
                  <PlayerLink
                    playerId={player.id}
                    playerName={player.name}
                    nhlId={player.nhl_id?.toString() || null}
                    position={player.position}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-300">
                    {player.position}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-lg font-bold ${getRatingColor(player.overall_rating)}`}>
                    {player.overall_rating || '-'}
                  </span>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  {t('roster.noPlayers', 'No players in this position')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-2 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back', 'Back')}
          </button>
          <h1 className="text-3xl font-bold text-white">
            {team.city} {team.name}
          </h1>
          {(team.division || team.conference) && (
            <p className="mt-1 text-sm text-slate-400">
              {[team.division, team.conference].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <PositionGroup
          title={t('roster.forwards', 'Forwards')}
          players={forwards}
        />
        <PositionGroup
          title={t('roster.defensemen', 'Defensemen')}
          players={defensemen}
        />
        <PositionGroup
          title={t('roster.goalies', 'Goalies')}
          players={allGoalies}
        />
      </div>
    </div>
  )
}
