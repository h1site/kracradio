import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { GameResult, ScheduleEntry } from '../types'
import { supabase } from './supabaseClient'

export interface ScheduleWithResult {
  schedule: ScheduleEntry
  game: GameResult | null
}

export interface GenerateScheduleOptions {
  season: number
  startDate?: string
  endDate?: string
  gamesPerMatch?: number
  maxBackToBack?: number
}

export const generateSchedule = async (leagueId: string, options: GenerateScheduleOptions) => {
  const { season, startDate, endDate, gamesPerMatch, maxBackToBack } = options
  const { data, error } = await supabase.rpc('fn_generate_schedule', {
    p_league_id: leagueId,
    p_season: season,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
    p_games_per_match: gamesPerMatch ?? 2,
    p_max_back_to_back: maxBackToBack ?? 2,
  })

  if (error) {
    throw error
  }

  return data as ScheduleEntry[]
}

const fetchScheduleWithGames = async (leagueId: string, limit = 25): Promise<ScheduleWithResult[]> => {
  // First get schedule entries
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('schedule')
    .select('id, league_id, season, game_date, home_team_id, away_team_id')
    .eq('league_id', leagueId)
    .order('game_date', { ascending: true })
    .limit(limit)

  if (scheduleError) {
    throw scheduleError
  }

  const scheduleRows = (scheduleData ?? []) as any[]
  if (scheduleRows.length === 0) {
    return []
  }

  // Get all game results for this league
  const { data: gamesData, error: gamesError } = await supabase
    .from('game_results')
    .select('id, schedule_id, status, home_score, away_score')
    .eq('league_id', leagueId)

  if (gamesError) {
    throw gamesError
  }

  // Create a map of schedule_id to game result
  const gamesByScheduleId = new Map<string, any>()
  ;(gamesData ?? []).forEach((game: any) => {
    gamesByScheduleId.set(game.schedule_id, game)
  })

  return scheduleRows.map((row) => {
    const game = gamesByScheduleId.get(row.id)
    return {
      schedule: {
        id: row.id,
        leagueId: row.league_id,
        season: row.season,
        date: row.game_date,
        homeTeamId: row.home_team_id,
        awayTeamId: row.away_team_id,
      },
      game: game
        ? {
            id: game.id,
            scheduleId: game.schedule_id,
            scoreHome: game.home_score ?? 0,
            scoreAway: game.away_score ?? 0,
            status: game.status === 'completed' ? 'final' : 'scheduled',
          }
        : null,
    }
  })
}

export const useLeagueScheduleQuery = (leagueId: string | null, limit = 25) => {
  return useQuery({
    queryKey: ['schedule', leagueId, limit],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<ScheduleWithResult[]>([])
      }
      return fetchScheduleWithGames(leagueId, limit)
    },
    enabled: Boolean(leagueId),
    staleTime: 30_000,
  })
}

export interface ImportNHLScheduleResult {
  imported_count: number
  errors: string[]
}

export const useImportNHLSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      leagueId,
      season,
      scheduleData,
      startDate,
    }: {
      leagueId: string
      season: number
      scheduleData: Array<{ day: number; away: string; home: string }>
      startDate?: string
    }) => {
      const { data, error } = await supabase.rpc('fn_import_nhl_schedule', {
        p_league_id: leagueId,
        p_season: season,
        p_schedule_data: scheduleData,
        p_start_date: startDate ?? '2025-10-01',
      })

      if (error) {
        throw error
      }

      return data as ImportNHLScheduleResult
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', variables.leagueId] })
    },
  })
}

export interface SimulateNextDayResult {
  day_number: number
  games_simulated: number
  errors: string[]
}

export const useSimulateNextDay = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId }: { leagueId: string }) => {
      const { data, error } = await supabase.rpc('fn_simulate_next_day', {
        p_league_id: leagueId,
      })
      if (error) throw error
      return data[0] as SimulateNextDayResult
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['game-results', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['standings', variables.leagueId] })
    },
  })
}

export interface GameDetails {
  id: string
  league_id: string
  schedule_id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  game_date: string
  game_day: number
  winner_team_id: string
  game_type: string
  status: string
  home_team_name: string
  away_team_name: string
  player_stats: PlayerStat[]
}

export interface PlayerStat {
  id: string
  team_id: string
  player_id: string | null
  goalie_id: string | null
  player_name: string
  position: string
  // Skater stats
  goals: number
  assists: number
  points: number
  plus_minus: number
  shots: number
  hits: number
  blocked_shots: number
  takeaways: number
  giveaways: number
  faceoff_wins: number
  faceoff_losses: number
  penalty_minutes: number
  time_on_ice: number
  // Goalie stats
  shots_against: number
  saves: number
  goals_against: number
  save_percentage: number
  shutout: boolean
}

export const useGameDetails = (gameResultId: string | null) => {
  return useQuery({
    queryKey: ['game-details', gameResultId],
    queryFn: async () => {
      if (!gameResultId) return null

      // Fetch game result
      const { data: gameData, error: gameError } = await supabase
        .from('game_results')
        .select(`
          id,
          league_id,
          schedule_id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          game_date,
          game_day,
          winner_team_id,
          game_type,
          status
        `)
        .eq('id', gameResultId)
        .single()

      if (gameError) throw gameError

      // Fetch team names
      const { data: homeTeam } = await supabase
        .from('teams')
        .select('name, city')
        .eq('id', gameData.home_team_id)
        .single()

      const { data: awayTeam } = await supabase
        .from('teams')
        .select('name, city')
        .eq('id', gameData.away_team_id)
        .single()

      // Fetch player stats
      const { data: statsData, error: statsError } = await supabase
        .from('game_player_stats')
        .select('*')
        .eq('game_result_id', gameResultId)
        .order('position', { ascending: true })
        .order('points', { ascending: false })

      if (statsError) throw statsError

      // If no player stats exist, fetch the rosters for both teams
      let playerStats = statsData || []
      console.log('📊 Player stats from game_player_stats:', playerStats.length)
      if (playerStats.length === 0) {
        console.log('🔍 Fetching rosters for teams...')
        console.log('🏠 Home team ID:', gameData.home_team_id)
        console.log('✈️ Away team ID:', gameData.away_team_id)

        // Fetch home team players
        const { data: homePlayers, error: homePlayersError } = await supabase
          .from('players')
          .select('id, name, position, jersey_number')
          .eq('team_id', gameData.home_team_id)

        console.log('🏠 Home players fetched:', homePlayers?.length || 0, homePlayersError || '')

        // Fetch home team goalies
        const { data: homeGoalies, error: homeGoaliesError } = await supabase
          .from('goalies')
          .select('id, name, position, jersey_number')
          .eq('team_id', gameData.home_team_id)

        console.log('🏠 Home goalies fetched:', homeGoalies?.length || 0, homeGoaliesError || '')

        // Fetch away team players
        const { data: awayPlayers, error: awayPlayersError } = await supabase
          .from('players')
          .select('id, name, position, jersey_number')
          .eq('team_id', gameData.away_team_id)

        console.log('✈️ Away players fetched:', awayPlayers?.length || 0, awayPlayersError || '')

        // Fetch away team goalies
        const { data: awayGoalies, error: awayGoaliesError } = await supabase
          .from('goalies')
          .select('id, name, position, jersey_number')
          .eq('team_id', gameData.away_team_id)

        console.log('✈️ Away goalies fetched:', awayGoalies?.length || 0, awayGoaliesError || '')

        // Combine all players with empty stats
        playerStats = [
          ...(homePlayers || []).map(p => ({
            id: p.id,
            player_id: p.id,
            goalie_id: null,
            player_name: p.name,
            position: p.position,
            team_id: gameData.home_team_id,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            shots: 0,
            hits: 0,
            blocked_shots: 0,
            takeaways: 0,
            giveaways: 0,
            faceoff_wins: 0,
            faceoff_losses: 0,
            penalty_minutes: 0,
            time_on_ice: 0,
            shots_against: 0,
            saves: 0,
            goals_against: 0,
            save_percentage: 0,
            shutout: false,
          })),
          ...(homeGoalies || []).map(p => ({
            id: p.id,
            player_id: null,
            goalie_id: p.id,
            player_name: p.name,
            position: p.position,
            team_id: gameData.home_team_id,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            shots: 0,
            hits: 0,
            blocked_shots: 0,
            takeaways: 0,
            giveaways: 0,
            faceoff_wins: 0,
            faceoff_losses: 0,
            penalty_minutes: 0,
            time_on_ice: 0,
            shots_against: 0,
            saves: 0,
            goals_against: 0,
            save_percentage: 0,
            shutout: false,
          })),
          ...(awayPlayers || []).map(p => ({
            id: p.id,
            player_id: p.id,
            goalie_id: null,
            player_name: p.name,
            position: p.position,
            team_id: gameData.away_team_id,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            shots: 0,
            hits: 0,
            blocked_shots: 0,
            takeaways: 0,
            giveaways: 0,
            faceoff_wins: 0,
            faceoff_losses: 0,
            penalty_minutes: 0,
            time_on_ice: 0,
            shots_against: 0,
            saves: 0,
            goals_against: 0,
            save_percentage: 0,
            shutout: false,
          })),
          ...(awayGoalies || []).map(p => ({
            id: p.id,
            player_id: null,
            goalie_id: p.id,
            player_name: p.name,
            position: p.position,
            team_id: gameData.away_team_id,
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            shots: 0,
            hits: 0,
            blocked_shots: 0,
            takeaways: 0,
            giveaways: 0,
            faceoff_wins: 0,
            faceoff_losses: 0,
            penalty_minutes: 0,
            time_on_ice: 0,
            shots_against: 0,
            saves: 0,
            goals_against: 0,
            save_percentage: 0,
            shutout: false,
          })),
        ]
      }

      return {
        ...gameData,
        home_team_name: homeTeam ? `${homeTeam.city} ${homeTeam.name}` : 'Unknown',
        away_team_name: awayTeam ? `${awayTeam.city} ${awayTeam.name}` : 'Unknown',
        player_stats: playerStats,
      } as GameDetails
    },
    enabled: Boolean(gameResultId),
  })
}
