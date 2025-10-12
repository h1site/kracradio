import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Contract } from '../types'
import { supabase } from './supabaseClient'

export interface ContractWithPlayer extends Contract {
  playerName: string
  position: string
  shoots?: string
  capHit: number
}

export interface CreateContractInput {
  playerId: string
  teamId: string
  salary: number
  years: number
  effectiveFrom: number
  structure?: Array<{ season: number; salary: number }>
}

interface RawContract {
  id: string
  player_id: string
  team_id: string
  salary: number
  years: number
  structure: unknown
  effective_from: number
  player: {
    id: string
    name: string
    position: string
    handedness?: string
  } | null | {
    id: string
    name: string
    position: string
    handedness?: string
  }[]
}

const fetchContractsForTeam = async (teamId: string): Promise<ContractWithPlayer[]> => {
  const { data, error } = await supabase
    .from('contracts')
    .select(
      `
        id,
        player_id,
        team_id,
        salary,
        years,
        structure,
        effective_from,
        player:player_id (
          id,
          name,
          position,
          handedness
        )
      `,
    )
    .eq('team_id', teamId)
    .order('effective_from', { ascending: true })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as unknown as RawContract[]).map((row) => ({
    ...row,
    player: Array.isArray(row.player) ? row.player[0] ?? null : row.player,
  }))

  const mapped = rows.map((row) => ({
    id: row.id,
    playerId: row.player_id,
    teamId: row.team_id,
    salary: row.salary ?? 0,
    years: row.years ?? 0,
    structure: Array.isArray(row.structure) ? (row.structure as Array<{ season: number; salary: number }>) : undefined,
    effectiveFrom: row.effective_from,
    playerName: row.player?.name ?? 'Unknown Player',
    position: row.player?.position ?? 'N/A',
    shoots: row.player?.handedness,
    capHit: row.salary ?? 0,
  }))

  const contractsWithCapHit = await Promise.all(
    mapped.map(async (contract) => {
      const { data: capHit, error: capError } = await supabase.rpc('fn_calculate_cap_hit', {
        p_contract_id: contract.id,
      })

      if (capError) {
        console.warn('Unable to calculate cap hit for contract', contract.id, capError)
        return contract
      }

      return {
        ...contract,
        capHit: typeof capHit === 'number' ? capHit : contract.salary ?? 0,
      }
    }),
  )

  return contractsWithCapHit
}

export const useContractsQuery = (teamId: string | null) => {
  return useQuery({
    queryKey: ['contracts', teamId],
    queryFn: () => {
      if (!teamId) {
        return Promise.resolve<ContractWithPlayer[]>([])
      }
      return fetchContractsForTeam(teamId)
    },
    enabled: Boolean(teamId),
    staleTime: 60_000,
  })
}

export const useLeagueContractsSummary = (teamId: string | null) => {
  return useQuery({
    queryKey: ['contracts', teamId, 'summary'],
    queryFn: async () => {
      if (!teamId) {
        return {
          totalSalary: 0,
          count: 0,
        }
      }
      const contracts = await fetchContractsForTeam(teamId)
      const totalSalary = contracts.reduce((acc, contract) => acc + (contract.capHit ?? contract.salary ?? 0), 0)
      return {
        totalSalary,
        count: contracts.length,
      }
    },
    enabled: Boolean(teamId),
    staleTime: 60_000,
  })
}

export const useCreateContract = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ playerId, teamId, salary, years, effectiveFrom, structure }: CreateContractInput) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          player_id: playerId,
          team_id: teamId,
          salary,
          years,
          effective_from: effectiveFrom,
          structure: structure ?? null,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      return data?.id as string
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.teamId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.teamId, 'summary'] })
    },
  })
}
