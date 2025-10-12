import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import type { LeagueMember } from '../types'

interface RawLeagueMember {
  id: string
  league_id: string
  user_id: string
  role: LeagueMember['role']
  status: LeagueMember['status']
  invitation_token: string
  created_at: string
  updated_at: string
  user: {
    id: string
    display_name: string
    email?: string | null
  } | null
}

const mapMember = (row: RawLeagueMember): LeagueMember => ({
  id: row.id,
  leagueId: row.league_id,
  userId: row.user_id,
  displayName: row.user?.display_name ?? 'Unknown GM',
  email: row.user?.email ?? undefined,
  role: row.role,
  status: row.status,
  invitationToken: row.invitation_token,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const fetchLeagueMembers = async (leagueId: string): Promise<LeagueMember[]> => {
  const { data, error } = await supabase
    .from('league_members')
    .select(
      `
        id,
        league_id,
        user_id,
        role,
        status,
        invitation_token,
        created_at,
        updated_at,
        user:users (
          id,
          display_name,
          email
        )
      `,
    )
    .eq('league_id', leagueId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as unknown as RawLeagueMember[]).map((row) => ({
    ...row,
    user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
  }))

  return rows.map(mapMember)
}

export const useLeagueMembersQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['league_members', leagueId],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<LeagueMember[]>([])
      }
      return fetchLeagueMembers(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 30_000,
  })
}

interface UpdateMemberArgs {
  memberId: string
  leagueId: string
  role?: LeagueMember['role']
  status?: LeagueMember['status']
}

export const useUpdateLeagueMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, leagueId, role, status }: UpdateMemberArgs) => {
      const updates: Partial<RawLeagueMember> = {}
      if (role) updates.role = role
      if (status) updates.status = status

      const { data, error } = await supabase
        .from('league_members')
        .update(updates)
        .eq('id', memberId)
        .eq('league_id', leagueId)
        .select(
          `
            id,
            league_id,
            user_id,
            role,
            status,
            invitation_token,
            created_at,
            updated_at,
            user:users (
              id,
              display_name,
              email
            )
          `,
        )
        .single()

      if (error) {
        throw error
      }

      const row = {
        ...(data as unknown as RawLeagueMember),
        user: Array.isArray((data as any).user) ? ((data as any).user[0] ?? null) : (data as any).user,
      }
      return mapMember(row)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league_members', variables.leagueId] })
    },
  })
}

export const useDeleteLeagueMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, leagueId }: { memberId: string; leagueId: string }) => {
      const { error } = await supabase.from('league_members').delete().eq('id', memberId).eq('league_id', leagueId)

      if (error) {
        throw error
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league_members', variables.leagueId] })
    },
  })
}

interface InviteMemberArgs {
  leagueId: string
  userId: string
  role?: LeagueMember['role']
}

export const useInviteLeagueMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId, userId, role = 'gm' }: InviteMemberArgs) => {
      const { data, error } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueId,
          user_id: userId,
          role,
          status: 'pending',
        })
        .select(
          `
            id,
            league_id,
            user_id,
            role,
            status,
            invitation_token,
            created_at,
            updated_at,
            user:users (
              id,
              display_name,
              email
            )
          `,
        )
        .single()

      if (error) {
        throw error
      }

      const row = {
        ...(data as unknown as RawLeagueMember),
        user: Array.isArray((data as any).user) ? ((data as any).user[0] ?? null) : (data as any).user,
      }
      return mapMember(row)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league_members', variables.leagueId] })
    },
  })
}

export interface UserSearchResult {
  id: string
  displayName: string
  email: string
}

const searchUsers = async (leagueId: string, query: string): Promise<UserSearchResult[]> => {
  const { data, error } = await supabase.rpc('fn_search_users', {
    p_league_id: leagueId,
    p_query: query,
    p_limit: 10,
  })

  if (error) {
    throw error
  }

  return (
    (data as Array<{ id: string; display_name: string; email: string }> | null)?.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      email: row.email,
    })) ?? []
  )
}

export const useLeagueUserSearch = (leagueId: string | null, query: string) => {
  return useQuery({
    queryKey: ['league_user_search', leagueId, query],
    queryFn: () => {
      if (!leagueId || query.trim().length < 2) {
        return Promise.resolve<UserSearchResult[]>([])
      }
      return searchUsers(leagueId, query.trim())
    },
    enabled: Boolean(leagueId) && query.trim().length >= 2,
    staleTime: 30_000,
  })
}
