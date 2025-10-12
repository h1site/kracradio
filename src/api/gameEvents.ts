import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface GameEvent {
  id: string
  game_id: string
  period: number
  game_time_seconds: number
  sequence_number: number
  event_type:
    // Basic events
    | 'game_start' | 'game_end' | 'period_start' | 'period_end'
    // Faceoffs
    | 'faceoff' | 'faceoff_won' | 'faceoff_lost' | 'faceoff_violation'
    // Zone entry
    | 'zone_entry_controlled' | 'zone_entry_dump' | 'zone_entry_failed'
    | 'offside' | 'offside_delayed'
    // Offensive plays
    | 'shot' | 'shot_blocked' | 'shot_missed' | 'shot_deflected'
    | 'goal' | 'goal_disallowed'
    | 'wraparound_attempt' | 'breakaway'
    | 'rebound' | 'screen'
    | 'pass' | 'pass_intercepted'
    | 'stick_broken'
    // Defensive plays
    | 'save' | 'save_spectacular'
    | 'hit' | 'hit_big' | 'hit_illegal'
    | 'blocked_shot' | 'blocked_shot_heroic'
    | 'takeaway' | 'giveaway'
    | 'poke_check' | 'stick_lift'
    | 'clearance' | 'clearance_failed'
    // Transition
    | 'breakout' | 'breakout_failed'
    | 'rush_2on1' | 'rush_3on2' | 'rush_odd_man'
    | 'turnover'
    // Special teams
    | 'powerplay_setup' | 'powerplay_shot'
    | 'shorthanded_breakaway' | 'shorthanded_goal'
    | 'penalty_kill_clear'
    // Penalties & discipline
    | 'penalty' | 'penalty_double_minor' | 'penalty_major'
    | 'penalty_misconduct' | 'penalty_bench'
    | 'fight' | 'fight_instigator'
    | 'delayed_penalty'
    // Goalie specific
    | 'goalie_freeze' | 'goalie_save_glove' | 'goalie_save_pad'
    | 'goalie_save_blocker' | 'goalie_poke_check'
    | 'goalie_pulled' | 'goalie_returned'
    | 'goalie_trapezoid_violation'
    // Special situations
    | 'icing' | 'icing_waved_off'
    | 'too_many_men' | 'hand_pass' | 'high_stick_puck'
    | 'net_dislodged' | 'equipment_issue'
    | 'timeout' | 'tv_timeout'
    // Rare/exceptional
    | 'glass_broken' | 'delay_of_game'
    | 'injury' | 'injury_serious'
    | 'momentum_shift'
    // Shootout
    | 'shootout_attempt' | 'shootout_goal' | 'shootout_miss'
    // Legacy/backward compatibility
    | 'missed_shot'
  zone: string | null
  team_name: string | null
  team_city: string | null
  player_name: string | null
  player_position: string | null
  player_number: number | null
  goalie_name: string | null
  secondary_player_name: string | null
  secondary_player_position: string | null
  secondary_player_number: number | null
  tertiary_player_name: string | null
  tertiary_player_position: string | null
  tertiary_player_number: number | null
  details: any
}

export interface PlayerGameStat {
  id: string
  game_id: string
  player_id: string
  team_id: string
  toi_total: number
  toi_ev: number
  toi_pp: number
  toi_sh: number
  goals: number
  assists: number
  shots: number
  hits: number
  blocked_shots: number
  giveaways: number
  takeaways: number
  faceoff_wins: number
  faceoff_losses: number
  penalty_minutes: number
  plus_minus: number
  shots_against: number
  saves: number
  goals_against: number
}

const fetchGameEvents = async (gameId: string): Promise<GameEvent[]> => {
  const { data, error } = await supabase
    .from('game_events_view')
    .select('*')
    .eq('game_id', gameId)
    .order('period', { ascending: true })
    .order('game_time_seconds', { ascending: true })
    .order('sequence_number', { ascending: true })

  if (error) {
    throw error
  }

  return (data as GameEvent[]) ?? []
}

export const useGameEventsQuery = (gameId: string | null) => {
  return useQuery({
    queryKey: ['game_events', gameId],
    queryFn: () => {
      if (!gameId) {
        return Promise.resolve<GameEvent[]>([])
      }
      return fetchGameEvents(gameId)
    },
    enabled: Boolean(gameId),
    staleTime: 5_000,
  })
}

export const usePlayerGameStats = (gameId: string | null) => {
  return useQuery({
    queryKey: ['player-game-stats', gameId],
    queryFn: async () => {
      if (!gameId) return []

      const { data, error } = await supabase
        .from('player_game_stats')
        .select('*')
        .eq('game_id', gameId)

      if (error) throw error
      return (data || []) as PlayerGameStat[]
    },
    enabled: !!gameId,
  })
}

/**
 * Helper to format time from seconds to MM:SS
 */
export const formatGameTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get goals by period from events
 */
export const getGoalsByPeriod = (events: GameEvent[]) => {
  return events
    .filter(e => e.event_type === 'goal')
    .reduce((acc, goal) => {
      if (!acc[goal.period]) {
        acc[goal.period] = []
      }
      acc[goal.period].push(goal)
      return acc
    }, {} as Record<number, GameEvent[]>)
}

/**
 * Get penalties by period from events
 */
export const getPenaltiesByPeriod = (events: GameEvent[]) => {
  return events
    .filter(e => e.event_type === 'penalty')
    .reduce((acc, penalty) => {
      if (!acc[penalty.period]) {
        acc[penalty.period] = []
      }
      acc[penalty.period].push(penalty)
      return acc
    }, {} as Record<number, GameEvent[]>)
}
