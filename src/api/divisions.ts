import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface Conference {
  id: string
  league_id: string
  name: string
  display_order: number
}

export interface Division {
  id: string
  league_id: string
  conference_id: string
  name: string
  display_order: number
}

export interface ConferenceWithDivisions extends Conference {
  divisions: Division[]
}

// Fetch conferences and divisions for a league
export const useLeagueConferencesAndDivisions = (leagueId: string | undefined) => {
  return useQuery({
    queryKey: ['conferences-divisions', leagueId],
    queryFn: async () => {
      if (!leagueId) throw new Error('League ID is required')

      // Fetch conferences
      const { data: conferences, error: confError } = await supabase
        .from('league_conferences')
        .select('*')
        .eq('league_id', leagueId)
        .order('display_order', { ascending: true })

      if (confError) throw confError

      // Fetch divisions
      const { data: divisions, error: divError } = await supabase
        .from('league_divisions')
        .select('*')
        .eq('league_id', leagueId)
        .order('display_order', { ascending: true })

      if (divError) throw divError

      // Group divisions by conference
      const conferencesWithDivisions: ConferenceWithDivisions[] = (conferences || []).map(conf => ({
        ...conf,
        divisions: (divisions || []).filter(div => div.conference_id === conf.id)
      }))

      return conferencesWithDivisions
    },
    enabled: !!leagueId,
  })
}

// Initialize default NHL divisions for a league
export const useInitializeNHLDivisions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId }: { leagueId: string }) => {
      const { data, error } = await supabase.rpc('fn_initialize_nhl_divisions', {
        p_league_id: leagueId
      })

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conferences-divisions', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
    },
  })
}

// Create or update conference
export const useUpsertConference = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conference: Partial<Conference> & { league_id: string }) => {
      const { data, error } = await supabase
        .from('league_conferences')
        .upsert(conference)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conferences-divisions', data.league_id] })
    },
  })
}

// Create or update division
export const useUpsertDivision = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (division: Partial<Division> & { league_id: string }) => {
      const { data, error } = await supabase
        .from('league_divisions')
        .upsert(division)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conferences-divisions', data.league_id] })
    },
  })
}

// Delete conference
export const useDeleteConference = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; leagueId: string }) => {
      const { error } = await supabase
        .from('league_conferences')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conferences-divisions', variables.leagueId] })
    },
  })
}

// Delete division
export const useDeleteDivision = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; leagueId: string }) => {
      const { error } = await supabase
        .from('league_divisions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conferences-divisions', variables.leagueId] })
    },
  })
}

// Update team's division and conference
export const useUpdateTeamDivision = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      teamId,
      division,
      conference,
    }: {
      teamId: string
      leagueId: string
      division: string
      conference: string
    }) => {
      const { data, error } = await supabase
        .from('teams')
        .update({ division, conference })
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['standings', variables.leagueId] })
    },
  })
}
