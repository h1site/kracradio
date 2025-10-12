import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLeagueTeamsQuery } from '../api/teams'
import { useTeamPlayersQuery } from '../api/players'
import { useContractsQuery, useLeagueContractsSummary, useCreateContract } from '../api/contracts'
import { useLeagueStore } from '../state/useLeagueStore'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(value)

export const ContractsPage = () => {
  const { t } = useTranslation()
  const { selectedLeagueId } = useLeagueStore()
  const { data: teams = [], isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } =
    useLeagueTeamsQuery(selectedLeagueId)
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [contractSalary, setContractSalary] = useState(750000)
  const [contractYears, setContractYears] = useState(1)
  const [contractSeason, setContractSeason] = useState(new Date().getFullYear())
  const [contractMessage, setContractMessage] = useState<string | null>(null)
  const [contractError, setContractError] = useState<string | null>(null)

  const activeTeams = useMemo(() => teams.filter((team) => team.level === 'NHL'), [teams])

  const trackedTeamId = teamFilter ?? activeTeams[0]?.id ?? null
  const { data: contracts = [], isLoading: contractsLoading, error: contractsError, refetch: refetchContracts } =
    useContractsQuery(trackedTeamId)
  const { data: summary } = useLeagueContractsSummary(trackedTeamId)
  const { data: teamPlayers = [], isLoading: playersLoading } = useTeamPlayersQuery(trackedTeamId)
  const createContract = useCreateContract()

  useEffect(() => {
    if (!selectedPlayerId && teamPlayers.length > 0) {
      setSelectedPlayerId(teamPlayers[0].id)
    }
  }, [teamPlayers, selectedPlayerId])

  const resetContractForm = () => {
    setSelectedPlayerId(teamPlayers[0]?.id ?? '')
    setContractSalary(750000)
    setContractYears(1)
    setContractSeason(new Date().getFullYear())
    setContractMessage(null)
    setContractError(null)
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('contracts.title')}</h2>
          <p className="text-sm text-slate-400">{t('contracts.description')}</p>
        </div>
        {selectedLeagueId && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                refetchTeams()
                refetchContracts()
              }}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500"
            >
              {t('contracts.actions.refresh')}
            </button>
            <button
              className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 disabled:opacity-60"
              onClick={() => {
                resetContractForm()
                setIsModalOpen(true)
              }}
            >
              {t('contracts.actions.addContract')}
            </button>
          </div>
        )}
      </header>

      {!selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
          {t('contracts.noLeagueSelected')}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t('contracts.cards.capSpace.title')}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {summary ? formatCurrency(Math.max(0, 82_500_000 - summary.totalSalary)) : '$0'}
          </p>
          <p className="text-xs text-slate-500">{t('contracts.cards.capSpace.note')}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {t('contracts.cards.activeContracts.title')}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{summary?.count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t('contracts.cards.deadCap.title')}</p>
          <p className="mt-2 text-3xl font-bold text-red-400">$0.0M</p>
        </div>
      </div>

      {selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t('contracts.teamCoverage.title')}
          </h3>
          {teamsLoading ? (
            <p className="mt-2 text-sm text-slate-500">{t('contracts.teamCoverage.loading')}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-300">
              {teams.length > 0
                ? t('contracts.teamCoverage.summary', { total: teams.length, active: activeTeams.length })
                : t('contracts.teamCoverage.empty')}
            </p>
          )}
          {teamsError && (
            <p className="mt-2 text-xs text-red-400">
              {t('contracts.contractList.errorPrefix', { message: teamsError.message })}
            </p>
          )}
        </div>
      )}

      {selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('contracts.contractList.title')}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{t('contracts.contractList.description')}</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="team-filter" className="text-xs uppercase tracking-wide text-slate-400">
                {t('contracts.contractList.teamLabel')}
              </label>
              <select
                id="team-filter"
                value={trackedTeamId ?? ''}
                onChange={(event) => setTeamFilter(event.target.value || null)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
              >
                <option value="">{t('contracts.contractList.allTeams')}</option>
                {activeTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.city} {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {contractsLoading ? (
            <p className="mt-3 text-sm text-slate-500">{t('contracts.contractList.loading')}</p>
          ) : contracts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t('contracts.contractList.empty')}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4 font-semibold">{t('contracts.table.player')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('contracts.table.position')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('contracts.table.years')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('contracts.table.salary')}</th>
                    <th className="pb-2 pr-4 font-semibold">{t('contracts.table.capHit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {contracts.map((contract) => {
                    const years = contract.years ?? 0
                    const effectiveEnd =
                      contract.effectiveFrom !== null && contract.effectiveFrom !== undefined
                        ? contract.effectiveFrom + Math.max(years - 1, 0)
                        : null

                    return (
                      <tr key={contract.id}>
                        <td className="py-3 pr-4 text-slate-200">
                          <p className="font-medium text-slate-100">{contract.playerName}</p>
                          <p className="text-xs text-slate-500">
                            {contract.effectiveFrom !== null && contract.effectiveFrom !== undefined
                              ? t('contracts.table.effectiveRange', {
                                  start: contract.effectiveFrom,
                                  end: effectiveEnd ?? contract.effectiveFrom,
                                })
                              : t('contracts.table.effectiveUnknown')}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{contract.position}</td>
                        <td className="py-3 pr-4 text-slate-300">{contract.years ?? '—'}</td>
                        <td className="py-3 pr-4 text-slate-200">{formatCurrency(contract.salary ?? 0)}</td>
                        <td className="py-3 pr-4 text-slate-200">
                          {formatCurrency(contract.capHit ?? contract.salary ?? 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {contractsError && (
            <p className="mt-3 text-xs text-red-400">
              {t('contracts.contractList.errorPrefix', { message: contractsError.message })}
            </p>
          )}
        </div>
      )}

      {!selectedLeagueId && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t('contracts.contractList.title')}
          </h3>
          <p className="mt-3 text-sm text-slate-400">{t('contracts.infoBox')}</p>
        </div>
      )}

      {isModalOpen && selectedLeagueId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur">
          <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">{t('contracts.modal.title')}</h3>
            <p className="mt-1 text-xs text-slate-500">{t('contracts.modal.description')}</p>

            <form
              className="mt-4 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!trackedTeamId) {
                  setContractError(t('contracts.modal.errors.noTeam'))
                  return
                }
                if (!selectedPlayerId) {
                  setContractError(t('contracts.modal.errors.noPlayer'))
                  return
                }
                setContractError(null)
                setContractMessage(null)
                try {
                  const structure = Array.from({ length: Math.max(1, contractYears) }).map((_, index) => ({
                    season: contractSeason + index,
                    salary: contractSalary,
                  }))

                  await createContract.mutateAsync({
                    playerId: selectedPlayerId,
                    teamId: trackedTeamId,
                    salary: contractSalary,
                    years: contractYears,
                    effectiveFrom: contractSeason,
                    structure,
                  })

                  setContractMessage(t('contracts.modal.success'))
                  resetContractForm()
                  setIsModalOpen(false)
                  refetchContracts()
                } catch (mutationError: any) {
                  setContractError(mutationError.message ?? t('contracts.modal.errors.default'))
                }
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t('contracts.modal.playerLabel')}
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(event) => setSelectedPlayerId(event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    disabled={playersLoading || teamPlayers.length === 0}
                  >
                    <option value="">
                      {playersLoading ? t('common.loading') : t('contracts.modal.playerPlaceholder')}
                    </option>
                    {teamPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t('contracts.modal.seasonLabel')}
                  </label>
                  <input
                    type="number"
                    value={contractSeason}
                    onChange={(event) => setContractSeason(Number(event.target.value))}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    min={1900}
                    max={3000}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t('contracts.modal.yearsLabel')}
                  </label>
                  <input
                    type="number"
                    value={contractYears}
                    onChange={(event) => setContractYears(Math.max(1, Number(event.target.value)))}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    min={1}
                    max={8}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t('contracts.modal.salaryLabel')}
                  </label>
                  <input
                    type="number"
                    value={contractSalary}
                    onChange={(event) => setContractSalary(Math.max(0, Number(event.target.value)))}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                    min={0}
                    step={1000}
                  />
                </div>
              </div>

              {contractError && <p className="text-xs text-red-400">{contractError}</p>}
              {contractMessage && <p className="text-xs text-emerald-400">{contractMessage}</p>}

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500"
                  onClick={() => {
                    setIsModalOpen(false)
                    setContractError(null)
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sky-500 px-3 py-2 text-white hover:bg-sky-400 disabled:opacity-60"
                  disabled={createContract.isPending}
                >
                  {createContract.isPending ? t('contracts.modal.submitting') : t('contracts.modal.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
