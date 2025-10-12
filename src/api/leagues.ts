import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSessionContext } from '../providers/SessionProvider'
import type { League } from '../types'
import { supabase } from './supabaseClient'

export interface LeagueMembership extends League {
  membershipId: string
  role: string
  status: string
}

interface LeagueMemberRow {
  id: string
  league_id: string
  role: string
  status: string
  league: {
    id: string
    owner_id: string
    name: string
    salary_cap: number
  } | null | {
    id: string
    owner_id: string
    name: string
    salary_cap: number
  }[]
}

const fetchLeaguesForUser = async (userId: string): Promise<LeagueMembership[]> => {
  const { data, error } = await supabase
    .from('league_members')
    .select(
      `
        id,
        league_id,
        role,
        status,
        league:league_id (
          id,
          owner_id,
          name,
          salary_cap
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as unknown as LeagueMemberRow[]

  return rows.map((row) => {
    const league = Array.isArray(row.league) ? row.league[0] : row.league
    return {
      id: league?.id ?? row.league_id,
      ownerId: league?.owner_id ?? '',
      name: league?.name ?? 'Unnamed League',
      salaryCap: league?.salary_cap ?? 0,
      membershipId: row.id,
      role: row.role,
      status: row.status,
    }
  })
}

export const useLeaguesQuery = () => {
  const { session } = useSessionContext()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['leagues', userId],
    queryFn: async () => {
      if (!userId) {
        return []
      }
      const leagues = await fetchLeaguesForUser(userId)
      // Optionally prime cache for individual leagues
      leagues.forEach((league) => {
        queryClient.setQueryData(['league', league.id], league)
      })
      return leagues
    },
    staleTime: 60_000,
    enabled: Boolean(userId),
  })
}

export const createLeague = async ({ name, salaryCap, displayName }: { name: string; salaryCap?: number; displayName?: string }) => {
  const { data, error } = await supabase.rpc('fn_create_league', {
    p_name: name,
    p_salary_cap: salaryCap ?? 82_500_000,
    p_display_name: displayName ?? null,
  })

  if (error) {
    throw error
  }

  return data as string
}
