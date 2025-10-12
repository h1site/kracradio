import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Player } from '../types'
import { supabase } from './supabaseClient'

export type RosterStatus = 'active' | 'scratched' | 'injured' | 'minors' | 'goalie'

export interface RosterEntry {
  id: string
  teamId: string
  player: Player
  status: RosterStatus
  line?: number | null
  teamLevel: 'NHL' | 'AHL'
  teamName: string
  teamAbbreviation?: string
}

interface RawRosterRow {
  id: string
  team_id: string
  player_id: string
  status: string
  line: number | null
  is_scratched: boolean
  team: {
    id: string
    name: string
    level: 'NHL' | 'AHL'
    league_id: string
    abbreviation?: string
  } | null | {
    id: string
    name: string
    level: 'NHL' | 'AHL'
    league_id: string
    abbreviation?: string
  }[]
  player: {
    id: string
    name: string
    position: Player['position']
    ratings: Record<string, number>
    shoots: Player['shoots']
    nhl_id?: string | null
    overall_rating?: number
  } | null | {
    id: string
    name: string
    position: Player['position']
    ratings: Record<string, number>
    shoots: Player['shoots']
    nhl_id?: string | null
    overall_rating?: number
  }[]
}

const fetchRosterForLeague = async (leagueId: string): Promise<RosterEntry[]> => {
  console.log('[Roster] Fetching roster for league:', leagueId)

  // First, get all teams for this league
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)

  if (teamsError) {
    console.error('[Roster] Error fetching teams:', teamsError)
    throw teamsError
  }

  if (!teamsData || teamsData.length === 0) {
    console.log('[Roster] No teams found for league')
    return []
  }

  const teamIds = teamsData.map(t => t.id)
  console.log('[Roster] Found teams:', teamIds.length)

  // Then get all roster entries for these teams
  const { data: rosterData, error: rosterError } = await supabase
    .from('rosters')
    .select(
      `
        id,
        team_id,
        player_id,
        status,
        line,
        is_scratched,
        team:team_id (
          id,
          name,
          level,
          league_id,
          abbreviation
        )
      `,
    )
    .in('team_id', teamIds)

  if (rosterError) {
    console.error('[Roster] Error fetching roster entries:', rosterError)
    throw rosterError
  }

  console.log('[Roster] Found roster entries:', rosterData?.length || 0)

  if (!rosterData || rosterData.length === 0) {
    console.log('[Roster] No roster entries found')
    return []
  }

  // Get player IDs
  const playerIds = rosterData.map((r: any) => r.player_id).filter(Boolean)
  console.log('[Roster] Looking for players:', playerIds.length, 'player IDs')

  // If no player IDs, return empty array
  if (playerIds.length === 0) {
    console.log('[Roster] No player IDs to fetch')
    return []
  }

  // Split playerIds into chunks to avoid URL length limit (max ~2000 chars)
  // Each UUID is ~36 chars, so 100 IDs = ~3600 chars which is safe
  const chunkSize = 100
  const playerIdChunks: string[][] = []
  for (let i = 0; i < playerIds.length; i += chunkSize) {
    playerIdChunks.push(playerIds.slice(i, i + chunkSize))
  }

  console.log(`[Roster] Fetching players in ${playerIdChunks.length} chunks of ${chunkSize}`)

  // Fetch skaters from players table in parallel chunks
  const skatersDataChunks = await Promise.all(
    playerIdChunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .in('id', chunk)
      if (error) {
        console.error('[Roster] Error fetching skaters chunk:', error)
        throw error
      }
      return data || []
    })
  )

  // Flatten all chunks into single array
  const skatersData = skatersDataChunks.flat()

  // Fetch goalies from goalies table in parallel chunks
  const goaliesDataChunks = await Promise.all(
    playerIdChunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from('goalies')
        .select('*')
        .in('id', chunk)
      if (error) {
        console.error('[Roster] Error fetching goalies chunk:', error)
        throw error
      }
      return data || []
    })
  )

  // Flatten all chunks into single array
  const goaliesData = goaliesDataChunks.flat()

  console.log('[Roster] Found skaters:', skatersData?.length || 0)
  console.log('[Roster] Found goalies:', goaliesData?.length || 0)

  // Combine and normalize the data with ratings
  const playersData = [
    ...(skatersData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      nhl_id: p.nhl_id,
      overall_rating: p.overall_rating,
      shoots_catches: p.shoots,
      player_type: 'player',
      ratings: {
        CK: p.checking,
        FG: p.fight,
        DI: p.discipline,
        SK: p.skating,
        ST: p.strength,
        EN: p.endurance,
        DU: p.durability,
        PH: p.puck_handling,
        FO: p.face_offs,
        PA: p.passing,
        SC: p.scoring,
        DF: p.defense,
        PS: p.penalty_shots,
        EX: p.experience,
        LD: p.leadership,
        PO: p.potential,
        OV: p.overall_rating
      }
    })),
    ...(goaliesData || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      position: g.position,
      nhl_id: g.nhl_id,
      overall_rating: g.overall_rating,
      shoots_catches: g.catches,
      player_type: 'goalie',
      ratings: {
        SK: g.skating,
        DU: g.durability,
        EN: g.endurance,
        SZ: g.size,
        AG: g.agility,
        RD: g.rebound_direction,
        SC: g.style_control,
        HS: g.hand_speed,
        RT: g.reaction_time,
        PC: g.puck_control,
        PS: g.penalty_shots,
        EX: g.experience,
        LD: g.leadership,
        PO: g.potential,
        ST: g.strength,
        OV: g.overall_rating
      }
    }))
  ]

  console.log('[Roster] Total players found:', playersData.length)

  // Create a map of player data
  const playerMap = new Map(
    (playersData || []).map((p: any) => [p.id, p])
  )

  const { data, error } = { data: rosterData, error: rosterError }

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as unknown as RawRosterRow[]).map((row) => ({
    ...row,
    team: Array.isArray(row.team) ? row.team[0] ?? null : row.team,
  }))

  const result = rows
    .filter((row) => {
      const hasTeam = !!row.team
      const hasPlayer = playerMap.has(row.player_id)
      if (!hasTeam) console.warn('[Roster] Row missing team:', row)
      if (!hasPlayer) console.warn('[Roster] Row missing player:', row.player_id)
      return hasTeam && hasPlayer
    })
    .map((row) => {
      const playerData = playerMap.get(row.player_id)!
      return {
        id: row.id,
        teamId: row.team_id,
        player: {
          id: playerData.id,
          name: playerData.name,
          position: playerData.position,
          ratings: playerData.ratings ?? {},
          shoots: playerData.shoots_catches ?? 'L',
          nhl_id: playerData.nhl_id,
          overall_rating: playerData.overall_rating,
        },
        status: row.is_scratched ? 'scratched' : ((row.status as RosterStatus) ?? 'active'),
        line: row.line,
        teamLevel: row.team!.level,
        teamName: row.team!.name,
        teamAbbreviation: row.team!.abbreviation,
      }
    })

  console.log('[Roster] Returning roster entries:', result.length, result)
  return result
}

export const useRosterQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['roster', leagueId],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<RosterEntry[]>([])
      }
      return fetchRosterForLeague(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 30_000,
  })
}

// Assign player to team roster
export const useAssignPlayerToRoster = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, playerId, leagueId }: { teamId: string; playerId: string; leagueId: string }) => {
      console.log('[AssignPlayer] Assigning player to roster:', { teamId, playerId, leagueId })

      const { data, error } = await supabase
        .from('rosters')
        .insert({
          team_id: teamId,
          player_id: playerId,
          league_id: leagueId,  // Explicitly set league_id
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error('[AssignPlayer] Error:', error)
        throw error
      }

      console.log('[AssignPlayer] Success:', data)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roster', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['free-agents', variables.leagueId] })
    },
  })
}

// Remove player from roster (make free agent)
export const useRemovePlayerFromRoster = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rosterId }: { rosterId: string; leagueId: string }) => {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', rosterId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roster', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['free-agents', variables.leagueId] })
    },
  })
}

// Update player's team assignment
export const useUpdatePlayerRosterAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rosterId, teamId }: { rosterId: string; teamId: string; leagueId: string }) => {
      const { data, error } = await supabase
        .from('rosters')
        .update({ team_id: teamId })
        .eq('id', rosterId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roster', variables.leagueId] })
    },
  })
}

// Get free agents (players/goalies not assigned to any team)
const fetchFreeAgents = async (leagueId: string) => {
  console.log('[FreeAgents] Fetching free agents for league:', leagueId)

  // Get all players for this league
  const { data: playersData, error: playersError } = await supabase
    .from('all_players')
    .select('id, name, position, ratings, overall_rating, shoots_catches, player_type, nhl_id')
    .eq('league_id', leagueId)

  if (playersError) {
    console.error('[FreeAgents] Error fetching players:', playersError)
    throw playersError
  }

  console.log('[FreeAgents] Found players in league:', playersData?.length || 0)

  // Get all roster assignments FOR THIS LEAGUE ONLY
  // This is critical: we must filter by league_id to avoid conflicts between leagues
  const { data: rostersData, error: rostersError } = await supabase
    .from('rosters')
    .select('player_id')
    .eq('league_id', leagueId)

  if (rostersError) {
    console.error('[FreeAgents] Error fetching rosters:', rostersError)
    throw rostersError
  }

  console.log('[FreeAgents] Found roster assignments in league:', rostersData?.length || 0)

  const assignedPlayerIds = new Set((rostersData || []).map(r => r.player_id))

  // Filter out assigned players
  // FREE AGENT = Player exists in league BUT is NOT in rosters table for this league
  const freeAgents = (playersData || []).filter(p => !assignedPlayerIds.has(p.id))

  console.log('[FreeAgents] Free agents found:', freeAgents.length)

  return freeAgents
}

export const useFreeAgentsQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['free-agents', leagueId],
    queryFn: () => {
      if (!leagueId) return Promise.resolve([])
      return fetchFreeAgents(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 30_000,
  })
}

// Auto-distribute all players randomly across teams (for Game Mode testing)
export const useDistributePlayersRandomly = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId }: { leagueId: string }) => {
      console.log('[DistributePlayers] Starting auto-distribution for league:', leagueId)

      // 1. Get all teams for this league
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('league_id', leagueId)
        .order('name')

      if (teamsError) throw teamsError
      if (!teams || teams.length === 0) {
        throw new Error('No teams found in this league')
      }

      console.log('[DistributePlayers] Found teams:', teams.length)

      // 2. Get all players (skaters and goalies) for this league
      const { data: allPlayers, error: playersError } = await supabase
        .from('all_players')
        .select('id, name, position, player_type')
        .eq('league_id', leagueId)

      if (playersError) throw playersError
      if (!allPlayers || allPlayers.length === 0) {
        throw new Error('No players found in this league')
      }

      console.log('[DistributePlayers] Found players:', allPlayers.length)

      // 3. Separate goalies from skaters
      const goalies = allPlayers.filter(p => p.position === 'G' || p.player_type === 'goalie')
      const skaters = allPlayers.filter(p => p.position !== 'G' && p.player_type !== 'goalie')

      console.log('[DistributePlayers] Goalies:', goalies.length, 'Skaters:', skaters.length)

      // 4. Delete all existing roster assignments for this league
      const { error: deleteError } = await supabase
        .from('rosters')
        .delete()
        .in('team_id', teams.map(t => t.id))

      if (deleteError) throw deleteError

      console.log('[DistributePlayers] Cleared existing rosters')

      // 5. Shuffle arrays for random distribution
      const shuffled = <T,>(array: T[]): T[] => {
        const arr = [...array]
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
      }

      const shuffledGoalies = shuffled(goalies)
      const shuffledSkaters = shuffled(skaters)

      // 6. Distribution based on realistic 50-contract roster
      // NHL Teams typically have: 60% forwards (30), 30% defense (15), 10% goalies (5)
      const GOALIES_PER_TEAM = 5  // 10%
      const DEFENSE_PER_TEAM = 15  // 30%
      const FORWARDS_PER_TEAM = 30 // 60%

      // Separate skaters into forwards and defense
      const forwards = shuffledSkaters.filter(p => ['C', 'LW', 'RW'].includes(p.position))
      const defense = shuffledSkaters.filter(p => p.position === 'D')

      console.log('[DistributePlayers] Forwards:', forwards.length, 'Defense:', defense.length, 'Goalies:', shuffledGoalies.length)

      // Calculate how many players per team we can actually distribute
      const actualGoaliesPerTeam = Math.floor(shuffledGoalies.length / teams.length)
      const actualDefensePerTeam = Math.floor(defense.length / teams.length)
      const actualForwardsPerTeam = Math.floor(forwards.length / teams.length)

      // Use minimum of desired and actual available
      const goaliesPerTeam = Math.min(GOALIES_PER_TEAM, Math.max(3, actualGoaliesPerTeam)) // min 3 goalies
      const defensePerTeam = Math.min(DEFENSE_PER_TEAM, Math.max(6, actualDefensePerTeam)) // min 6 defense
      const forwardsPerTeam = Math.min(FORWARDS_PER_TEAM, Math.max(12, actualForwardsPerTeam)) // min 12 forwards

      console.log('[DistributePlayers] Allocating per team - Goalies:', goaliesPerTeam, 'Defense:', defensePerTeam, 'Forwards:', forwardsPerTeam)

      const goalieAssignments: any[] = []
      const defenseAssignments: any[] = []
      const forwardAssignments: any[] = []

      let goalieIndex = 0
      let defenseIndex = 0
      let forwardIndex = 0

      // 7. Distribute players per team following calculated allocation
      for (const team of teams) {
        // Assign goalies
        for (let i = 0; i < goaliesPerTeam && goalieIndex < shuffledGoalies.length; i++) {
          goalieAssignments.push({
            team_id: team.id,
            player_id: shuffledGoalies[goalieIndex].id,
            status: 'active'
          })
          goalieIndex++
        }

        // Assign defense
        for (let i = 0; i < defensePerTeam && defenseIndex < defense.length; i++) {
          defenseAssignments.push({
            team_id: team.id,
            player_id: defense[defenseIndex].id,
            status: 'active'
          })
          defenseIndex++
        }

        // Assign forwards
        for (let i = 0; i < forwardsPerTeam && forwardIndex < forwards.length; i++) {
          forwardAssignments.push({
            team_id: team.id,
            player_id: forwards[forwardIndex].id,
            status: 'active'
          })
          forwardIndex++
        }
      }

      // 7b. Distribute remaining players round-robin to ensure all teams get roughly equal rosters
      // This ensures no team is left empty if there are leftover players
      let teamIndex = 0
      while (goalieIndex < shuffledGoalies.length) {
        const team = teams[teamIndex % teams.length]
        goalieAssignments.push({
          team_id: team.id,
          player_id: shuffledGoalies[goalieIndex].id,
          status: 'active'
        })
        goalieIndex++
        teamIndex++
      }

      teamIndex = 0
      while (defenseIndex < defense.length) {
        const team = teams[teamIndex % teams.length]
        defenseAssignments.push({
          team_id: team.id,
          player_id: defense[defenseIndex].id,
          status: 'active'
        })
        defenseIndex++
        teamIndex++
      }

      teamIndex = 0
      while (forwardIndex < forwards.length) {
        const team = teams[teamIndex % teams.length]
        forwardAssignments.push({
          team_id: team.id,
          player_id: forwards[forwardIndex].id,
          status: 'active'
        })
        forwardIndex++
        teamIndex++
      }

      console.log('[DistributePlayers] Assignments - Goalies:', goalieAssignments.length,
                  'Defense:', defenseAssignments.length, 'Forwards:', forwardAssignments.length)

      const skaterAssignments = [...defenseAssignments, ...forwardAssignments]

      console.log('[DistributePlayers] Created skater assignments:', skaterAssignments.length)

      // 8. Insert all assignments
      const allAssignments = [...goalieAssignments, ...skaterAssignments]

      if (allAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from('rosters')
          .insert(allAssignments)

        if (insertError) throw insertError
      }

      console.log('[DistributePlayers] Distribution complete!', {
        teams: teams.length,
        totalPlayers: allAssignments.length,
        goalies: goalieAssignments.length,
        skaters: skaterAssignments.length
      })

      return {
        teams: teams.length,
        totalPlayers: allAssignments.length,
        goalies: goalieAssignments.length,
        skaters: skaterAssignments.length
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roster', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['free-agents', variables.leagueId] })
    },
  })
}


export const useDeleteAllPlayersFromLeague = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leagueId }: { leagueId: string }) => {
      console.log('[DeleteAllPlayers] Starting deletion for league:', leagueId)

      // Delete all skaters (players table)
      const { error: skatersError } = await supabase
        .from('players')
        .delete()
        .eq('league_id', leagueId)

      if (skatersError) {
        console.error('[DeleteAllPlayers] Error deleting skaters:', skatersError)
        throw skatersError
      }

      console.log('[DeleteAllPlayers] Skaters deleted')

      // Delete all goalies (goalies table)
      const { error: goaliesError } = await supabase
        .from('goalies')
        .delete()
        .eq('league_id', leagueId)

      if (goaliesError) {
        console.error('[DeleteAllPlayers] Error deleting goalies:', goaliesError)
        throw goaliesError
      }

      console.log('[DeleteAllPlayers] Goalies deleted')

      // Delete all roster assignments (rosters table)
      // First, get all teams in this league
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)

      if (teamsError) {
        console.error('[DeleteAllPlayers] Error fetching teams:', teamsError)
        throw teamsError
      }

      if (teams && teams.length > 0) {
        const teamIds = teams.map(t => t.id)

        const { error: rostersError } = await supabase
          .from('rosters')
          .delete()
          .in('team_id', teamIds)

        if (rostersError) {
          console.error('[DeleteAllPlayers] Error deleting roster assignments:', rostersError)
          throw rostersError
        }

        console.log('[DeleteAllPlayers] Roster assignments deleted')
      }

      console.log('[DeleteAllPlayers] All players and rosters deleted successfully')

      return { success: true }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roster', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['free-agents', variables.leagueId] })
    },
  })
}

