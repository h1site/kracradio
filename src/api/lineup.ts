import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface LineupData {
  id?: string
  league_id: string
  team_id: string

  // Forward lines
  line1_lw: string | null
  line1_c: string | null
  line1_rw: string | null

  line2_lw: string | null
  line2_c: string | null
  line2_rw: string | null

  line3_lw: string | null
  line3_c: string | null
  line3_rw: string | null

  line4_lw: string | null
  line4_c: string | null
  line4_rw: string | null

  // Defense pairs
  pair1_ld: string | null
  pair1_rd: string | null

  pair2_ld: string | null
  pair2_rd: string | null

  pair3_ld: string | null
  pair3_rd: string | null

  // Goalies
  starter: string | null
  backup: string | null

  // Special teams
  pp1: string[]
  pp2: string[]
  pk1: string[]
  pk2: string[]

  created_at?: string
  updated_at?: string
}

/**
 * Fetch lineup for a specific team in a league
 */
export const useLineupQuery = (leagueId: string | null, teamId: string | null) => {
  return useQuery({
    queryKey: ['lineup', leagueId, teamId],
    queryFn: async () => {
      if (!leagueId || !teamId) return null

      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('team_id', teamId)
        .maybeSingle()

      if (error) throw error
      return data as LineupData | null
    },
    enabled: !!leagueId && !!teamId,
  })
}

/**
 * Save or update lineup for a team
 */
export const useSaveLineupMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lineup: LineupData) => {
      const { league_id, team_id } = lineup

      // Check if lineup exists
      const { data: existing } = await supabase
        .from('lineups')
        .select('id')
        .eq('league_id', league_id)
        .eq('team_id', team_id)
        .maybeSingle()

      if (existing) {
        // Update existing lineup
        const { data, error } = await supabase
          .from('lineups')
          .update({
            line1_lw: lineup.line1_lw,
            line1_c: lineup.line1_c,
            line1_rw: lineup.line1_rw,
            line2_lw: lineup.line2_lw,
            line2_c: lineup.line2_c,
            line2_rw: lineup.line2_rw,
            line3_lw: lineup.line3_lw,
            line3_c: lineup.line3_c,
            line3_rw: lineup.line3_rw,
            line4_lw: lineup.line4_lw,
            line4_c: lineup.line4_c,
            line4_rw: lineup.line4_rw,
            pair1_ld: lineup.pair1_ld,
            pair1_rd: lineup.pair1_rd,
            pair2_ld: lineup.pair2_ld,
            pair2_rd: lineup.pair2_rd,
            pair3_ld: lineup.pair3_ld,
            pair3_rd: lineup.pair3_rd,
            starter: lineup.starter,
            backup: lineup.backup,
            pp1: lineup.pp1,
            pp2: lineup.pp2,
            pk1: lineup.pk1,
            pk2: lineup.pk2,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert new lineup
        const { data, error } = await supabase
          .from('lineups')
          .insert({
            league_id: lineup.league_id,
            team_id: lineup.team_id,
            line1_lw: lineup.line1_lw,
            line1_c: lineup.line1_c,
            line1_rw: lineup.line1_rw,
            line2_lw: lineup.line2_lw,
            line2_c: lineup.line2_c,
            line2_rw: lineup.line2_rw,
            line3_lw: lineup.line3_lw,
            line3_c: lineup.line3_c,
            line3_rw: lineup.line3_rw,
            line4_lw: lineup.line4_lw,
            line4_c: lineup.line4_c,
            line4_rw: lineup.line4_rw,
            pair1_ld: lineup.pair1_ld,
            pair1_rd: lineup.pair1_rd,
            pair2_ld: lineup.pair2_ld,
            pair2_rd: lineup.pair2_rd,
            pair3_ld: lineup.pair3_ld,
            pair3_rd: lineup.pair3_rd,
            starter: lineup.starter,
            backup: lineup.backup,
            pp1: lineup.pp1,
            pp2: lineup.pp2,
            pk1: lineup.pk1,
            pk2: lineup.pk2,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch lineup query
      queryClient.invalidateQueries({ queryKey: ['lineup', data.league_id, data.team_id] })
    },
  })
}

/**
 * Delete lineup for a team
 */
export const useDeleteLineupMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId, teamId }: { leagueId: string; teamId: string }) => {
      const { error } = await supabase
        .from('lineups')
        .delete()
        .eq('league_id', leagueId)
        .eq('team_id', teamId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineup', variables.leagueId, variables.teamId] })
    },
  })
}

export interface AILineupResult {
  team_id: string
  team_name: string
  success: boolean
  message: string
}

/**
 * Generate lineups for all AI-controlled teams in game mode
 */
export const useGenerateAILineups = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId }: { leagueId: string }) => {
      const { data, error } = await supabase.rpc('fn_generate_ai_lineups', {
        p_league_id: leagueId,
      })

      if (error) {
        throw error
      }

      return data as AILineupResult[]
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineup', variables.leagueId] })
    },
  })
}
