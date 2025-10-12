import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LeagueRules } from '../types'
import { supabase } from './supabaseClient'

/**
 * Récupère les règles d'une ligue
 */
export const fetchLeagueRules = async (leagueId: string): Promise<LeagueRules | null> => {
  const { data, error } = await supabase.rpc('get_league_rules', {
    p_league_id: leagueId,
  })

  if (error) {
    throw error
  }

  return data as LeagueRules | null
}

/**
 * Hook pour récupérer les règles d'une ligue
 */
export const useLeagueRules = (leagueId: string | undefined) => {
  return useQuery({
    queryKey: ['league-rules', leagueId],
    queryFn: () => {
      if (!leagueId) {
        throw new Error('League ID is required')
      }
      return fetchLeagueRules(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Met à jour les règles d'une ligue
 */
export const updateLeagueRules = async (leagueId: string, rules: Partial<LeagueRules>): Promise<LeagueRules> => {
  console.log('📤 Calling update_league_rules RPC with:', { leagueId, rules })

  const { data, error } = await supabase.rpc('update_league_rules', {
    p_league_id: leagueId,
    p_rules: rules,
  })

  if (error) {
    console.error('❌ Supabase RPC Error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  console.log('✅ Update successful, response:', data)
  return data as LeagueRules
}

/**
 * Hook pour mettre à jour les règles d'une ligue
 */
export const useUpdateLeagueRules = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, rules }: { leagueId: string; rules: Partial<LeagueRules> }) =>
      updateLeagueRules(leagueId, rules),
    onSuccess: (_data, variables) => {
      // Invalider le cache pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['league-rules', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
    },
  })
}

/**
 * Réinitialise les règles d'une ligue aux valeurs par défaut
 */
export const resetLeagueRules = async (leagueId: string): Promise<void> => {
  const { error } = await supabase.rpc('reset_league_rules', {
    p_league_id: leagueId,
  })

  if (error) {
    throw error
  }
}

/**
 * Hook pour réinitialiser les règles d'une ligue
 */
export const useResetLeagueRules = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leagueId: string) => resetLeagueRules(leagueId),
    onSuccess: (_data, leagueId) => {
      // Invalider le cache pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['league-rules', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
    },
  })
}

/**
 * Met à jour seulement les règles d'IA
 */
export const useUpdateAIRules = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, aiRules }: { leagueId: string; aiRules: LeagueRules['aiRules'] }) =>
      updateLeagueRules(leagueId, { aiRules }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-rules', variables.leagueId] })
    },
  })
}

/**
 * Met à jour seulement les règles de gameplay
 */
export const useUpdateGameplayRules = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, gameplayRules }: { leagueId: string; gameplayRules: LeagueRules['gameplayRules'] }) =>
      updateLeagueRules(leagueId, { gameplayRules }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-rules', variables.leagueId] })
    },
  })
}

/**
 * Met à jour seulement les options de ligue
 */
export const useUpdateLeagueOptions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leagueId, leagueOptions }: { leagueId: string; leagueOptions: LeagueRules['leagueOptions'] }) =>
      updateLeagueRules(leagueId, { leagueOptions }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-rules', variables.leagueId] })
    },
  })
}
