import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export type AiJobStatus = 'queued' | 'running' | 'failed' | 'completed'

export interface AiJob {
  id: string
  leagueId: string | null
  type: string
  status: AiJobStatus
  createdAt: string
  updatedAt: string | null
  payload: Record<string, unknown>
  result?: Record<string, unknown> | null
}

interface RawAiJob {
  id: string
  league_id: string | null
  type: string
  status: AiJobStatus
  created_at: string
  updated_at: string | null
  payload: Record<string, unknown> | null
  result: Record<string, unknown> | null
}

const fetchAiJobsForLeague = async (leagueId: string): Promise<AiJob[]> => {
  const { data, error } = await supabase
    .from('ai_jobs')
    .select('id, league_id, type, status, created_at, updated_at, payload, result')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  return (
    (data as RawAiJob[] | null)?.map((row) => ({
      id: row.id,
      leagueId: row.league_id,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      payload: row.payload ?? {},
      result: row.result,
    })) ?? []
  )
}

export const useAiJobsQuery = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['ai_jobs', leagueId],
    queryFn: () => {
      if (!leagueId) {
        return Promise.resolve<AiJob[]>([])
      }
      return fetchAiJobsForLeague(leagueId)
    },
    enabled: Boolean(leagueId),
    staleTime: 15_000,
  })
}
