import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface SeasonStats {
  id: string
  league_id: string
  season: number
  team_id: string | null
  games_played: number
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
  wins: number
  losses: number
  ot_losses: number
  shots_against: number
  saves: number
  goals_against: number
  shutouts: number
}

export interface CareerStats {
  id: string
  games_played: number
  seasons_played: number
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
  wins: number
  losses: number
  ot_losses: number
  shots_against: number
  saves: number
  goals_against: number
  shutouts: number
}

export interface PlayerInfo {
  id: string
  name: string
  position: string
  age: number | null
  jersey_number: number | null
  overall_rating: number | null
  team_name: string | null
  team_city: string | null
  nhl_id: number | null
  // Skater ratings
  checking?: number | null
  fight?: number | null
  discipline?: number | null
  skating?: number | null
  strength?: number | null
  endurance?: number | null
  durability?: number | null
  puck_handling?: number | null
  face_offs?: number | null
  passing?: number | null
  scoring?: number | null
  defense?: number | null
  penalty_shots?: number | null
  experience?: number | null
  leadership?: number | null
  potential?: number | null
  // Goalie ratings
  size?: number | null
  agility?: number | null
  rebound_direction?: number | null
  style_control?: number | null
  hand_speed?: number | null
  reaction_time?: number | null
  puck_control?: number | null
}

export interface PlayerStatsData {
  player: PlayerInfo
  seasonStats: SeasonStats[]
  careerStats: CareerStats | null
}

// Hook to get player stats (skater)
export const usePlayerStats = (playerId: string | null, leagueId: string | null) => {
  return useQuery({
    queryKey: ['player-stats', playerId, leagueId],
    queryFn: async () => {
      if (!playerId) return null

      // Fetch player info with ALL ratings
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select(`
          id,
          nhl_id,
          name,
          position,
          age,
          jersey_number,
          overall_rating,
          team_id,
          checking,
          fight,
          discipline,
          skating,
          strength,
          endurance,
          durability,
          puck_handling,
          face_offs,
          passing,
          scoring,
          defense,
          penalty_shots,
          experience,
          leadership,
          potential
        `)
        .eq('id', playerId)
        .single()

      if (playerError) throw playerError

      // Fetch team info if player has a team
      let teamName = null
      let teamCity = null
      if (playerData.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name, city')
          .eq('id', playerData.team_id)
          .single()

        if (teamData) {
          teamName = teamData.name
          teamCity = teamData.city
        }
      }

      // Fetch season stats
      let seasonQuery = supabase
        .from('player_season_stats')
        .select('*')
        .eq('player_id', playerId)
        .order('season', { ascending: false })

      if (leagueId) {
        seasonQuery = seasonQuery.eq('league_id', leagueId)
      }

      const { data: seasonData, error: seasonError } = await seasonQuery

      if (seasonError) throw seasonError

      // Fetch career stats
      const { data: careerData, error: careerError } = await supabase
        .from('player_career_stats')
        .select('*')
        .eq('player_id', playerId)
        .single()

      if (careerError && careerError.code !== 'PGRST116') throw careerError

      return {
        player: {
          ...playerData,
          team_name: teamName,
          team_city: teamCity,
        },
        seasonStats: seasonData || [],
        careerStats: careerData || null,
      } as PlayerStatsData
    },
    enabled: Boolean(playerId),
  })
}

// Hook to get goalie stats
export const useGoalieStats = (goalieId: string | null, leagueId: string | null) => {
  return useQuery({
    queryKey: ['goalie-stats', goalieId, leagueId],
    queryFn: async () => {
      if (!goalieId) return null

      // Fetch goalie info with ALL ratings
      const { data: goalieData, error: goalieError } = await supabase
        .from('goalies')
        .select(`
          id,
          nhl_id,
          name,
          position,
          age,
          jersey_number,
          overall_rating,
          team_id,
          skating,
          durability,
          endurance,
          size,
          agility,
          rebound_direction,
          style_control,
          hand_speed,
          reaction_time,
          puck_control,
          penalty_shots,
          experience,
          leadership,
          potential,
          strength
        `)
        .eq('id', goalieId)
        .single()

      if (goalieError) throw goalieError

      // Fetch team info if goalie has a team
      let teamName = null
      let teamCity = null
      if (goalieData.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name, city')
          .eq('id', goalieData.team_id)
          .single()

        if (teamData) {
          teamName = teamData.name
          teamCity = teamData.city
        }
      }

      // Fetch season stats
      let seasonQuery = supabase
        .from('player_season_stats')
        .select('*')
        .eq('goalie_id', goalieId)
        .order('season', { ascending: false })

      if (leagueId) {
        seasonQuery = seasonQuery.eq('league_id', leagueId)
      }

      const { data: seasonData, error: seasonError } = await seasonQuery

      if (seasonError) throw seasonError

      // Fetch career stats
      const { data: careerData, error: careerError } = await supabase
        .from('player_career_stats')
        .select('*')
        .eq('goalie_id', goalieId)
        .single()

      if (careerError && careerError.code !== 'PGRST116') throw careerError

      return {
        player: {
          ...goalieData,
          team_name: teamName,
          team_city: teamCity,
        },
        seasonStats: seasonData || [],
        careerStats: careerData || null,
      } as PlayerStatsData
    },
    enabled: Boolean(goalieId),
  })
}
