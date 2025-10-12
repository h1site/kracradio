import { create } from 'zustand'

export interface ActiveLeague {
  id: string
  name: string
  seasonYear: number
  membershipId?: string
  role?: string
  status?: string
}

export interface ActiveTeam {
  id: string
  leagueId: string
  name: string
  level: 'NHL' | 'AHL'
}

interface LeagueState {
  leagues: ActiveLeague[]
  selectedLeagueId: string | null
  teams: ActiveTeam[]
  roster: Record<string, RosterPlayer[]>
  setLeagues: (payload: ActiveLeague[]) => void
  setTeams: (payload: ActiveTeam[]) => void
  setRoster: (teamId: string, players: RosterPlayer[]) => void
  selectLeague: (leagueId: string | null) => void
}

export interface RosterPlayer {
  id: string
  teamId: string
  name: string
  position: 'C' | 'LW' | 'RW' | 'D' | 'G'
  ratings: Record<string, number>
  status: string
  teamLevel: 'NHL' | 'AHL'
  line?: number | null
}

const shallowCompareTeams = (a: ActiveTeam[], b: ActiveTeam[]) =>
  a.length === b.length && a.every((team, index) => {
    const other = b[index]
    return (
      other &&
      other.id === team.id &&
      other.leagueId === team.leagueId &&
      other.name === team.name &&
      other.level === team.level
    )
  })

const shallowCompareLeagues = (a: ActiveLeague[], b: ActiveLeague[]) =>
  a.length === b.length && a.every((league, index) => {
    const other = b[index]
    return (
      other &&
      other.id === league.id &&
      other.name === league.name &&
      other.seasonYear === league.seasonYear &&
      other.membershipId === league.membershipId &&
      other.role === league.role &&
      other.status === league.status
    )
  })

export const useLeagueStore = create<LeagueState>((set) => ({
  leagues: [],
  selectedLeagueId: null,
  teams: [],
  roster: {},
  setLeagues: (payload) =>
    set((state) => {
      if (shallowCompareLeagues(state.leagues, payload)) {
        return state
      }
      return { leagues: payload }
    }),
  setTeams: (payload) =>
    set((state) => {
      if (shallowCompareTeams(state.teams, payload)) {
        return state
      }
      return { teams: payload }
    }),
  setRoster: (teamId, players) =>
    set((state) => ({
      roster: {
        ...state.roster,
        [teamId]: players,
      },
    })),
  selectLeague: (leagueId) => set({ selectedLeagueId: leagueId }),
}))
