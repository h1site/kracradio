import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export interface StandingsEntry {
  id: string
  team_id: string
  team_name: string
  team_city: string
  division: string | null
  conference: string | null
  games_played: number
  wins: number
  losses: number
  ot_losses: number
  points: number
  points_percentage: number // Added PTS%
  row: number
  goals_for: number
  goals_against: number
  goal_differential: number
  home_wins: number
  home_losses: number
  home_ot_losses: number
  away_wins: number
  away_losses: number
  away_ot_losses: number
  streak_type: string | null
  streak_count: number
  last_10: string | null
}

export const useStandings = (leagueId: string | undefined, season?: number) => {
  return useQuery({
    queryKey: ['standings', leagueId, season],
    queryFn: async () => {
      if (!leagueId) throw new Error('League ID is required')

      // If no season specified, use current year
      const currentSeason = season || new Date().getFullYear()

      const { data, error } = await supabase
        .from('standings')
        .select(`
          id,
          team_id,
          games_played,
          wins,
          losses,
          ot_losses,
          points,
          row,
          goals_for,
          goals_against,
          goal_differential,
          home_wins,
          home_losses,
          home_ot_losses,
          away_wins,
          away_losses,
          away_ot_losses,
          streak_type,
          streak_count,
          last_10,
          teams (
            id,
            name,
            city,
            division,
            conference
          )
        `)
        .eq('league_id', leagueId)
        .eq('season', currentSeason)

      if (error) {
        console.error('Standings query error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        return []
      }

      // Transform and sort the data to flatten team info
      const standings: StandingsEntry[] = data
        .filter((entry: any) => entry.teams) // Filter out entries without team data
        .map((entry: any) => {
          // Calculate Points % = Points / (Games Played × 2)
          const pointsPercentage = entry.games_played > 0
            ? (entry.points / (entry.games_played * 2)) * 100
            : 0

          return {
            id: entry.id,
            team_id: entry.team_id,
            team_name: entry.teams?.name || 'Unknown',
            team_city: entry.teams?.city || '',
            division: entry.teams?.division || null,
            conference: entry.teams?.conference || null,
            games_played: entry.games_played,
            wins: entry.wins,
            losses: entry.losses,
            ot_losses: entry.ot_losses,
            points: entry.points,
            points_percentage: Math.round(pointsPercentage * 10) / 10, // Round to 1 decimal
            row: entry.row,
            goals_for: entry.goals_for,
            goals_against: entry.goals_against,
            goal_differential: entry.goal_differential,
            home_wins: entry.home_wins,
            home_losses: entry.home_losses,
            home_ot_losses: entry.home_ot_losses,
            away_wins: entry.away_wins,
            away_losses: entry.away_losses,
            away_ot_losses: entry.away_ot_losses,
            streak_type: entry.streak_type,
            streak_count: entry.streak_count,
            last_10: entry.last_10,
          }
        })
        .sort((a, b) => {
          // NHL tie-breaking rules:
          // 1. Points (descending)
          if (b.points !== a.points) return b.points - a.points

          // 2. ROW - Regulation + Overtime Wins (descending)
          if (b.row !== a.row) return b.row - a.row

          // 3. Games played (ascending - fewer games is better)
          if (a.games_played !== b.games_played) return a.games_played - b.games_played

          // 4. Goal differential (descending)
          if (b.goal_differential !== a.goal_differential) return b.goal_differential - a.goal_differential

          // 5. Goals for (descending)
          return b.goals_for - a.goals_for
        })

      return standings
    },
    enabled: !!leagueId,
  })
}

// Group standings by division, sorted by conference (East first, then West)
export const groupByDivision = (standings: StandingsEntry[]) => {
  const divisions = new Map<string, StandingsEntry[]>()

  standings.forEach((team) => {
    const divisionName = team.division || 'No Division'
    if (!divisions.has(divisionName)) {
      divisions.set(divisionName, [])
    }
    divisions.get(divisionName)!.push(team)
  })

  // Sort divisions by conference: Eastern conferences first, then Western
  const sortedDivisions = new Map<string, StandingsEntry[]>()

  // First add all Eastern conference divisions
  Array.from(divisions.entries())
    .filter(([_, teams]) => {
      const conference = teams[0]?.conference || ''
      return conference.toLowerCase().includes('est') || conference.toLowerCase().includes('eastern')
    })
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically within conference
    .forEach(([division, teams]) => {
      sortedDivisions.set(division, teams)
    })

  // Then add all Western conference divisions
  Array.from(divisions.entries())
    .filter(([_, teams]) => {
      const conference = teams[0]?.conference || ''
      return conference.toLowerCase().includes('ouest') || conference.toLowerCase().includes('western')
    })
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically within conference
    .forEach(([division, teams]) => {
      sortedDivisions.set(division, teams)
    })

  // Add any remaining divisions (unassigned, etc.)
  Array.from(divisions.entries())
    .filter(([_, teams]) => {
      const conference = teams[0]?.conference || ''
      return !conference.toLowerCase().includes('est') &&
             !conference.toLowerCase().includes('eastern') &&
             !conference.toLowerCase().includes('ouest') &&
             !conference.toLowerCase().includes('western')
    })
    .forEach(([division, teams]) => {
      sortedDivisions.set(division, teams)
    })

  return sortedDivisions
}

// Group standings by conference
export const groupByConference = (standings: StandingsEntry[]) => {
  const conferences = new Map<string, StandingsEntry[]>()

  standings.forEach((team) => {
    const conferenceName = team.conference || 'No Conference'
    if (!conferences.has(conferenceName)) {
      conferences.set(conferenceName, [])
    }
    conferences.get(conferenceName)!.push(team)
  })

  return conferences
}
