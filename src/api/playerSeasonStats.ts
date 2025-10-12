import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface PlayerSeasonStatsData {
  // Player info
  player_id: string
  player_name: string
  position: string
  jersey_number: number | null
  team_name: string
  team_city: string
  season: number

  // Basic stats
  games_played: number
  goals: number
  assists: number
  points: number
  plus_minus: number
  penalty_minutes: number

  // Special teams
  even_strength_goals: number
  power_play_goals: number
  short_handed_goals: number
  game_winning_goals: number
  overtime_goals: number

  // Shooting
  shots: number
  shooting_percentage: number

  // Ice time
  time_on_ice_seconds: number
  avg_toi_seconds: number

  // Advanced stats
  faceoff_wins: number
  faceoff_losses: number
  faceoff_percentage: number
  hits: number
  blocks: number

  // Per 60 stats
  goals_per_60: number
  assists_per_60: number
  points_per_60: number

  // Advanced metrics
  expected_goals: number
  corsi_for: number
  corsi_against: number
  corsi_for_percentage: number
  offensive_zone_start_percentage: number
}

export interface GoalieSeasonStatsData {
  // Player info
  player_id: string
  player_name: string
  position: string
  jersey_number: number | null
  team_name: string
  team_city: string
  season: number

  // Basic stats
  games_played: number
  games_started: number
  wins: number
  losses: number
  ot_losses: number

  // Goalie stats
  goals_against: number
  shots_against: number
  saves: number
  save_percentage: number
  goals_against_average: number
  shutouts: number
  minutes_played: number

  // Advanced goalie stats
  quality_starts: number
  really_bad_starts: number
  goals_saved_above_average: number
  expected_goals_against: number
  high_danger_goals_saved_above_average: number
  penalty_kill_save_percentage: number
  power_play_save_percentage: number
  win_percentage: number
}

/**
 * Fetch player season stats for a specific player
 */
export const usePlayerSeasonStats = (playerId: string, season?: number) => {
  const currentSeason = season || new Date().getFullYear()

  return useQuery({
    queryKey: ['player-season-stats', playerId, currentSeason],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_stats_view')
        .select('*')
        .eq('player_id', playerId)
        .eq('season', currentSeason)
        .single()

      if (error) {
        // Return null if no stats found (not an error, just no data yet)
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data as PlayerSeasonStatsData
    },
    enabled: !!playerId,
  })
}

/**
 * Fetch goalie season stats for a specific goalie
 */
export const useGoalieSeasonStats = (playerId: string, season?: number) => {
  const currentSeason = season || new Date().getFullYear()

  return useQuery({
    queryKey: ['goalie-season-stats', playerId, currentSeason],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goalie_stats_view')
        .select('*')
        .eq('player_id', playerId)
        .eq('season', currentSeason)
        .single()

      if (error) {
        // Return null if no stats found (not an error, just no data yet)
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data as GoalieSeasonStatsData
    },
    enabled: !!playerId,
  })
}
