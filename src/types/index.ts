import type { LeagueRules } from './leagueRules'

export interface League {
  id: string
  ownerId: string
  name: string
  salaryCap: number
  rules?: LeagueRules
}

export interface Team {
  id: string
  leagueId: string
  name: string
  city: string
  level: 'NHL' | 'AHL'
  division?: string | null
  conference?: string | null
}

export interface Player {
  id: string
  name: string
  position: 'C' | 'LW' | 'RW' | 'D' | 'G'
  ratings: Record<string, number>
  shoots: 'L' | 'R'
  nhl_id?: string | null
  overall_rating?: number
}

export interface Contract {
  id: string
  playerId: string
  teamId: string
  salary: number
  years: number
  structure?: Array<{ season: number; salary: number }>
  effectiveFrom?: number
}

export interface ScheduleEntry {
  id: string
  leagueId: string
  season?: number
  date: string
  homeTeamId: string
  awayTeamId: string
}

export interface GameResult {
  id: string
  scheduleId: string
  scoreHome: number
  scoreAway: number
  status: 'scheduled' | 'in_progress' | 'final'
}

export interface LeagueMember {
  id: string
  leagueId: string
  userId: string
  displayName: string
  email?: string
  role: 'commissioner' | 'gm' | 'assistant'
  status: 'pending' | 'active' | 'inactive'
  invitationToken: string
  createdAt: string
  updatedAt: string
}

export * from './leagueRules'
