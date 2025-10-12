import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface TeamPlayer {
  id: string
  name: string
  position: string
  shoots: string
  status: string
  teamId: string
}

interface RawRosterPlayer {
  player: {
    id: string
    name: string
    position: string
    shoots: string | null
  } | null
  status: string
  team_id: string
}

const fetchTeamPlayers = async (teamId: string): Promise<TeamPlayer[]> => {
  const { data, error } = await supabase
    .from('rosters')
    .select(
      `status, team_id, player:player_id (
        id,
        name,
        position,
        shoots
      )`
    )
    .eq('team_id', teamId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as unknown as RawRosterPlayer[]).map((row) => ({
    ...row,
    player: Array.isArray(row.player) ? row.player[0] ?? null : row.player,
  }))

  return rows
    .map((row) => ({
      id: row.player?.id ?? '',
      name: row.player?.name ?? 'Unknown Player',
      position: row.player?.position ?? 'N/A',
      shoots: row.player?.shoots ?? 'L',
      status: row.status,
      teamId: row.team_id,
    }))
    .filter((player) => player.id !== '')
}

export const useTeamPlayersQuery = (teamId: string | null) => {
  return useQuery({
    queryKey: ['team_players', teamId],
    queryFn: () => {
      if (!teamId) {
        return Promise.resolve<TeamPlayer[]>([])
      }
      return fetchTeamPlayers(teamId)
    },
    enabled: Boolean(teamId),
    staleTime: 30_000,
  })
}
