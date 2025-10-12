import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface PlayerSeasonStats {
  id: string
  player_id: string
  team_id: string
  league_id: string
  season: number
  player_name: string
  position: string
  jersey_number: number
  team_name: string
  team_city: string
  division: string | null
  conference: string | null
  league_name: string

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

export interface GoalieSeasonStats {
  id: string
  player_id: string
  team_id: string
  league_id: string
  season: number
  player_name: string
  position: string
  jersey_number: number
  team_name: string
  team_city: string
  division: string | null
  conference: string | null
  league_name: string

  // Basic stats
  games_played: number
  games_started: number
  wins: number
  losses: number
  overtime_losses: number

  // Goals and shots
  goals_against: number
  shots_against: number
  saves: number
  save_percentage: number
  goals_against_average: number

  // Special achievements
  shutouts: number

  // Time
  minutes_played: number
  time_on_ice_seconds: number

  // Quality metrics
  quality_starts: number
  really_bad_starts: number
  goals_saved_above_average: number

  // Advanced stats
  expected_goals_against: number
  high_danger_saves: number
  high_danger_shots_against: number
  high_danger_save_percentage: number

  // Special teams
  pk_saves: number
  pk_shots_against: number
  pk_save_percentage: number
  pp_saves: number
  pp_shots_against: number
  pp_save_percentage: number

  // Win percentage
  win_percentage: number
}

export interface PlayerStatsFilters {
  leagueId?: string
  season?: number
  teamId?: string
  conference?: string
  division?: string
  position?: string
  searchQuery?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

// Fetch skater statistics
export const useAdvancedPlayerStats = (filters: PlayerStatsFilters) => {
  return useQuery({
    queryKey: ['advanced-player-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('player_stats_view')
        .select('*')

      if (filters.leagueId) {
        query = query.eq('league_id', filters.leagueId)
      }

      if (filters.season) {
        query = query.eq('season', filters.season)
      }

      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId)
      }

      if (filters.conference) {
        query = query.eq('conference', filters.conference)
      }

      if (filters.division) {
        query = query.eq('division', filters.division)
      }

      if (filters.position) {
        query = query.eq('position', filters.position)
      }

      if (filters.searchQuery) {
        query = query.ilike('player_name', `%${filters.searchQuery}%`)
      }

      // Default sort by points
      const sortBy = filters.sortBy || 'points'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as PlayerSeasonStats[]
    },
    enabled: true,
  })
}

// Fetch goalie statistics
export const useAdvancedGoalieStats = (filters: PlayerStatsFilters) => {
  return useQuery({
    queryKey: ['advanced-goalie-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('goalie_stats_view')
        .select('*')

      if (filters.leagueId) {
        query = query.eq('league_id', filters.leagueId)
      }

      if (filters.season) {
        query = query.eq('season', filters.season)
      }

      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId)
      }

      if (filters.conference) {
        query = query.eq('conference', filters.conference)
      }

      if (filters.division) {
        query = query.eq('division', filters.division)
      }

      if (filters.searchQuery) {
        query = query.ilike('player_name', `%${filters.searchQuery}%`)
      }

      // Default sort by wins
      const sortBy = filters.sortBy || 'wins'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as GoalieSeasonStats[]
    },
    enabled: true,
  })
}

// Helper to format TOI (seconds to MM:SS)
export const formatTOI = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper to format average TOI per game
export const formatAvgTOI = (seconds: number): string => {
  return formatTOI(seconds)
}
