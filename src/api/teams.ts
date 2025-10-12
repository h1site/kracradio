import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Team } from '../types'
import { supabase } from './supabaseClient'

const fetchTeamsForLeague = async (leagueId: string): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('teams')
    .select('id, league_id, name, city, level, division, conference')
    .eq('league_id', leagueId)
    .order('level', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return (
    data?.map((team) => ({
      id: team.id,
      leagueId: team.league_id,
      name: team.name,
      city: team.city,
      level: team.level,
      division: team.division,
      conference: team.conference,
    })) ?? []
  )
}

export const useLeagueTeamsQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['teams', leagueId],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<Team[]>([])
      }
      return fetchTeamsForLeague(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 60_000,
  })
}

export interface CreateTeamInput {
  leagueId: string
  name: string
  city: string
  level: 'NHL' | 'AHL'
  abbreviation?: string | null
}

export const useCreateTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId, name, city, level, abbreviation }: CreateTeamInput) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          league_id: leagueId,
          name,
          city,
          level,
          abbreviation: abbreviation ?? null,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      return data?.id as string
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
    },
  })
}

export interface UpdateTeamInput {
  teamId: string
  leagueId: string
  name?: string
  city?: string
  level?: 'NHL' | 'AHL'
  abbreviation?: string
}

export const useUpdateTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, name, city, level, abbreviation }: UpdateTeamInput) => {
      const { data, error } = await supabase.rpc('fn_update_team', {
        p_team_id: teamId,
        p_name: name ?? null,
        p_city: city ?? null,
        p_level: level ?? null,
        p_abbreviation: abbreviation ?? null,
      })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
    },
  })
}

export const useDeleteTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId }: { teamId: string; leagueId: string }) => {
      const { error } = await supabase.rpc('fn_delete_team', {
        p_team_id: teamId,
      })

      if (error) {
        throw error
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
    },
  })
}

export interface AssignTeamMemberInput {
  teamId: string
  memberId: string
  role: 'manager' | 'assistant'
  leagueId: string
}

export const useAssignTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, memberId, role }: AssignTeamMemberInput) => {
      const { data, error } = await supabase.rpc('fn_assign_team_member', {
        p_team_id: teamId,
        p_member_id: memberId,
        p_role: role,
      })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['team-assignments', variables.leagueId] })
    },
  })
}

export const useUnassignTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string; leagueId: string }) => {
      const { error } = await supabase.rpc('fn_unassign_team_member', {
        p_team_id: teamId,
        p_member_id: memberId,
      })

      if (error) {
        throw error
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['team-assignments', variables.leagueId] })
    },
  })
}

export interface TeamAssignment {
  id: string
  teamId: string
  memberId: string
  role: 'manager' | 'assistant'
  member: {
    id: string
    displayName: string
    email: string
  }
}

const fetchTeamAssignments = async (leagueId: string): Promise<TeamAssignment[]> => {
  console.log('[TeamAssignments] Fetching for league:', leagueId)

  // First get all teams for this league
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)

  if (teamsError) {
    console.error('[TeamAssignments] Error fetching teams:', teamsError)
    throw teamsError
  }

  const teamIds = (teamsData || []).map(t => t.id)
  console.log('[TeamAssignments] Team IDs:', teamIds)

  if (teamIds.length === 0) {
    console.log('[TeamAssignments] No teams found')
    return []
  }

  // Then get all assignments for these teams with member info
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('team_assignments')
    .select('id, team_id, member_id, role')
    .in('team_id', teamIds)

  if (assignmentsError) {
    console.error('[TeamAssignments] Error fetching assignments:', assignmentsError)
    throw assignmentsError
  }

  console.log('[TeamAssignments] Assignments data:', assignmentsData)

  // Get member details separately (with user info)
  const memberIds = (assignmentsData || []).map(a => a.member_id)

  if (memberIds.length === 0) {
    return []
  }

  const { data: membersData, error: membersError } = await supabase
    .from('league_members')
    .select(`
      id,
      user:users (
        display_name,
        email
      )
    `)
    .in('id', memberIds)

  if (membersError) {
    console.error('[TeamAssignments] Error fetching members:', membersError)
    throw membersError
  }

  console.log('[TeamAssignments] Members data:', membersData)

  // Combine the data
  const data = (assignmentsData || []).map(assignment => {
    const memberRecord = (membersData || []).find((m: any) => m.id === assignment.member_id)
    const user = Array.isArray(memberRecord?.user) ? memberRecord.user[0] : memberRecord?.user
    return {
      ...assignment,
      member: {
        id: assignment.member_id,
        display_name: user?.display_name || 'Unknown',
        email: user?.email || ''
      }
    }
  })

  const { error } = { error: null }

  if (error) {
    console.error('[TeamAssignments] Error fetching assignments:', error)
    throw error
  }

  console.log('[TeamAssignments] Raw data:', data)

  const result = (data || []).map((assignment: any) => ({
    id: assignment.id,
    teamId: assignment.team_id,
    memberId: assignment.member_id,
    role: assignment.role,
    member: {
      id: assignment.member?.id || assignment.member_id,
      displayName: assignment.member?.display_name || 'Unknown',
      email: assignment.member?.email || '',
    },
  }))

  console.log('[TeamAssignments] Processed result:', result)
  return result
}

export const useTeamAssignmentsQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['team-assignments', leagueId],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<TeamAssignment[]>([])
      }
      return fetchTeamAssignments(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 30_000,
  })
}

// Get the teams assigned to the current user
const fetchMyAssignedTeams = async (leagueId: string): Promise<Team[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get the current user's member ID in this league
  const { data: memberData, error: memberError } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (memberError || !memberData) {
    console.log('[MyTeams] No active membership found for user in league')
    return []
  }

  // Get team assignments for this member
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('team_assignments')
    .select(`
      team:teams (
        id,
        league_id,
        name,
        city,
        level
      )
    `)
    .eq('member_id', memberData.id)

  if (assignmentsError) {
    console.error('[MyTeams] Error fetching team assignments:', assignmentsError)
    throw assignmentsError
  }

  const teams = (assignmentsData || [])
    .map((assignment: any) => assignment.team)
    .filter((team: any) => team !== null)
    .map((team: any) => ({
      id: team.id,
      leagueId: team.league_id,
      name: team.name,
      city: team.city,
      level: team.level,
    }))

  return teams
}

export const useMyAssignedTeamsQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['my-assigned-teams', leagueId],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<Team[]>([])
      }
      return fetchMyAssignedTeams(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 60_000,
  })
}
