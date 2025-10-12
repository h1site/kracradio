import { useState, useEffect } from 'react'
import type { LeagueOptions } from '../../../types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../api/supabaseClient'

interface LeagueOptionsPanelProps {
  leagueId: string
  options: LeagueOptions
  onUpdate: (options: LeagueOptions) => void
  isUpdating: boolean
}

export const LeagueOptionsPanel = ({ leagueId, options, onUpdate, isUpdating }: LeagueOptionsPanelProps) => {
  const [localOptions, setLocalOptions] = useState<LeagueOptions>(options || {} as LeagueOptions)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (options) {
      setLocalOptions(options)
    }
  }, [options])

  // League reset mutation
  const resetLeagueMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('fn_reset_league_data', {
        p_league_id: leagueId
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      console.log('✅ League reset successful:', data)
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['players'] })
      queryClient.invalidateQueries({ queryKey: ['rosters'] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['standings'] })
      queryClient.invalidateQueries({ queryKey: ['game_events'] })
      setShowResetConfirm(false)
      alert(`✅ Nettoyage réussi!\n\n${data.deleted.players} joueurs supprimés\n${data.deleted.games} matchs supprimés\n${data.deleted.game_events} événements supprimés\n\nVous pouvez maintenant ré-importer vos joueurs.`)
    },
    onError: (error) => {
      console.error('❌ League reset failed:', error)
      alert('❌ Erreur lors du nettoyage: ' + (error as Error).message)
    }
  })

  // Fetch teams for Game Mode dropdown - only from the current league
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', leagueId],
    queryFn: async () => {
      const { data, error} = await supabase
        .from('teams')
        .select('id, name, city, abbreviation, level')
        .eq('league_id', leagueId)
        .eq('level', 'NHL')  // Only show NHL teams for game mode
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: Boolean(leagueId)
  })

  const handleChange = (field: keyof LeagueOptions, value: string | number | boolean | null) => {
    setLocalOptions((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log('💾 Saving League Options:', localOptions)
    console.log('gameMode:', localOptions.gameMode)
    console.log('gameModeTeamId:', localOptions.gameModeTeamId, 'type:', typeof localOptions.gameModeTeamId)
    onUpdate(localOptions)
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Options de ligue</h2>
        <p className="text-slate-400 mb-6">
          Configurez le format, les règles administratives et les options avancées de votre ligue.
        </p>
      </div>

      {/* Format de la ligue */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Format de la ligue</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Nombre d'équipes
            </label>
            <input
              type="number"
              min="2"
              max="64"
              value={localOptions.numberOfTeams}
              onChange={(e) => handleChange('numberOfTeams', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="conferenceEnabled"
              checked={localOptions.conferenceEnabled}
              onChange={(e) => handleChange('conferenceEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="conferenceEnabled" className="ml-2 text-sm text-slate-200">
              Conférences activées
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="divisionEnabled"
              checked={localOptions.divisionEnabled}
              onChange={(e) => handleChange('divisionEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="divisionEnabled" className="ml-2 text-sm text-slate-200">
              Divisions activées
            </label>
          </div>
        </div>
      </section>

      {/* Saison régulière */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Saison régulière</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Nombre de matchs par saison
            </label>
            <input
              type="number"
              min="10"
              max="164"
              value={localOptions.regularSeasonGames}
              onChange={(e) => handleChange('regularSeasonGames', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Points victoire
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={localOptions.pointsForWin}
                onChange={(e) => handleChange('pointsForWin', Number(e.target.value))}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Points défaite OT
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={localOptions.pointsForOTLoss}
                onChange={(e) => handleChange('pointsForOTLoss', Number(e.target.value))}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Séries éliminatoires */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Séries éliminatoires</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="playoffsEnabled"
              checked={localOptions.playoffsEnabled}
              onChange={(e) => handleChange('playoffsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="playoffsEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Séries activées
            </label>
          </div>

          {localOptions.playoffsEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Équipes qualifiées
                </label>
                <input
                  type="number"
                  min="2"
                  max="32"
                  value={localOptions.playoffTeams}
                  onChange={(e) => handleChange('playoffTeams', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Format
                </label>
                <select
                  value={localOptions.playoffFormat}
                  onChange={(e) => handleChange('playoffFormat', e.target.value)}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                >
                  <option className="bg-slate-900 text-slate-100" value="standard">Standard</option>
                  <option className="bg-slate-900 text-slate-100" value="divisional">Par division</option>
                  <option className="bg-slate-900 text-slate-100" value="wildcard">Avec wildcards</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Matchs par série (best of)
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  step="2"
                  value={localOptions.playoffSeriesLength}
                  onChange={(e) => handleChange('playoffSeriesLength', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Format prolongation
                </label>
                <select
                  value={localOptions.playoffOvertimeFormat}
                  onChange={(e) => handleChange('playoffOvertimeFormat', e.target.value)}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                >
                  <option className="bg-slate-900 text-slate-100" value="5v5">5 contre 5</option>
                  <option className="bg-slate-900 text-slate-100" value="4v4">4 contre 4</option>
                  <option className="bg-slate-900 text-slate-100" value="3v3">3 contre 3</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="playoffReseed"
                  checked={localOptions.playoffReseed}
                  onChange={(e) => handleChange('playoffReseed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="playoffReseed" className="ml-2 text-sm text-slate-200">
                  Reclasser après chaque ronde
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Plafond salarial */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Plafond salarial</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="salaryCapEnabled"
              checked={localOptions.salaryCapEnabled}
              onChange={(e) => handleChange('salaryCapEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="salaryCapEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Plafond salarial activé
            </label>
          </div>

          {localOptions.salaryCapEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Montant du plafond ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={localOptions.salaryCapAmount}
                  onChange={(e) => handleChange('salaryCapAmount', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Plancher salarial ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={localOptions.salaryFloor}
                  onChange={(e) => handleChange('salaryFloor', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="luxuryTaxEnabled"
                  checked={localOptions.luxuryTaxEnabled}
                  onChange={(e) => handleChange('luxuryTaxEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="luxuryTaxEnabled" className="ml-2 text-sm text-slate-200">
                  Taxe de luxe
                </label>
              </div>

              {localOptions.luxuryTaxEnabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Taux de taxe (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localOptions.luxuryTaxRate}
                    onChange={(e) => handleChange('luxuryTaxRate', Number(e.target.value))}
                    className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contrats */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Contrats</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Durée maximale (années)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={localOptions.maxContractYears}
              onChange={(e) => handleChange('maxContractYears', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Durée minimale (années)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={localOptions.minContractYears}
              onChange={(e) => handleChange('minContractYears', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { key: 'contractExtensionEnabled', label: 'Extensions autorisées' },
            { key: 'frontLoadingAllowed', label: 'Front-loading autorisé' },
            { key: 'backDivingAllowed', label: 'Back-diving autorisé' },
            { key: 'noMoveClauses', label: 'Clauses de non-échange' },
            { key: 'noTradeClauses', label: 'Clauses de non-transaction' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center">
              <input
                type="checkbox"
                id={key}
                checked={localOptions[key as keyof LeagueOptions] as boolean}
                onChange={(e) => handleChange(key as keyof LeagueOptions, e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor={key} className="ml-2 text-sm text-slate-200">
                {label}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Échanges */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Échanges</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="tradeDeadlineEnabled"
              checked={localOptions.tradeDeadlineEnabled}
              onChange={(e) => handleChange('tradeDeadlineEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="tradeDeadlineEnabled" className="ml-2 text-sm text-slate-200">
              Date limite des transactions
            </label>
          </div>

          {localOptions.tradeDeadlineEnabled && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Date (MM-JJ)
              </label>
              <input
                type="text"
                value={localOptions.tradeDeadlineDate}
                onChange={(e) => handleChange('tradeDeadlineDate', e.target.value)}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
                placeholder="03-03"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="tradeSalaryCap"
                checked={localOptions.tradeSalaryCap}
                onChange={(e) => handleChange('tradeSalaryCap', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="tradeSalaryCap" className="ml-2 text-sm text-slate-200">
                Vérifier le plafond
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="tradeVetoEnabled"
                checked={localOptions.tradeVetoEnabled}
                onChange={(e) => handleChange('tradeVetoEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="tradeVetoEnabled" className="ml-2 text-sm text-slate-200">
                Veto activé
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Approbation des échanges
            </label>
            <select
              value={localOptions.tradeApproval}
              onChange={(e) => handleChange('tradeApproval', e.target.value)}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
            >
              <option className="bg-slate-900 text-slate-100" value="commissioner">Par le commissaire</option>
              <option className="bg-slate-900 text-slate-100" value="vote">Par vote</option>
              <option className="bg-slate-900 text-slate-100" value="automatic">Automatique</option>
            </select>
          </div>
        </div>
      </section>

      {/* Repêchage */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Repêchage</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="draftEnabled"
              checked={localOptions.draftEnabled}
              onChange={(e) => handleChange('draftEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="draftEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Repêchage activé
            </label>
          </div>

          {localOptions.draftEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Nombre de rondes
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={localOptions.draftRounds}
                  onChange={(e) => handleChange('draftRounds', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Ordre du repêchage
                </label>
                <select
                  value={localOptions.draftOrder}
                  onChange={(e) => handleChange('draftOrder', e.target.value)}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                >
                  <option className="bg-slate-900 text-slate-100" value="reverse_standings">Classement inversé</option>
                  <option className="bg-slate-900 text-slate-100" value="lottery">Loterie</option>
                  <option className="bg-slate-900 text-slate-100" value="custom">Personnalisé</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="draftLottery"
                  checked={localOptions.draftLottery}
                  onChange={(e) => handleChange('draftLottery', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="draftLottery" className="ml-2 text-sm text-slate-200">
                  Loterie activée
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Agence libre */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Agence libre</h3>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="freeAgencyEnabled"
              checked={localOptions.freeAgencyEnabled}
              onChange={(e) => handleChange('freeAgencyEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="freeAgencyEnabled" className="ml-2 text-sm text-slate-200">
              Agence libre activée
            </label>
          </div>

          {localOptions.freeAgencyEnabled && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="restrictedFreeAgency"
                  checked={localOptions.restrictedFreeAgency}
                  onChange={(e) => handleChange('restrictedFreeAgency', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="restrictedFreeAgency" className="ml-2 text-sm text-slate-200">
                  Agence libre avec compensation
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="offerSheets"
                  checked={localOptions.offerSheets}
                  onChange={(e) => handleChange('offerSheets', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="offerSheets" className="ml-2 text-sm text-slate-200">
                  Offres hostiles autorisées
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Roster */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Effectif et alignement</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Taille de l'effectif
            </label>
            <input
              type="number"
              min="10"
              max="50"
              value={localOptions.rosterSize}
              onChange={(e) => handleChange('rosterSize', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Joueurs actifs
            </label>
            <input
              type="number"
              min="10"
              max="30"
              value={localOptions.activeRosterSize}
              onChange={(e) => handleChange('activeRosterSize', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Places réserve blessés
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={localOptions.injuredReserveSlots}
              onChange={(e) => handleChange('injuredReserveSlots', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* Blessures et fatigue */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Blessures et fatigue</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="injuriesEnabled"
              checked={localOptions.injuriesEnabled}
              onChange={(e) => handleChange('injuriesEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="injuriesEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Blessures activées
            </label>
          </div>

          {localOptions.injuriesEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Fréquence des blessures
                </label>
                <select
                  value={localOptions.injuryFrequency}
                  onChange={(e) => handleChange('injuryFrequency', e.target.value)}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                >
                  <option className="bg-slate-900 text-slate-100" value="rare">Rare</option>
                  <option className="bg-slate-900 text-slate-100" value="normal">Normal</option>
                  <option className="bg-slate-900 text-slate-100" value="fréquent">Fréquent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Temps de récupération
                </label>
                <select
                  value={localOptions.injuryRecoveryTime}
                  onChange={(e) => handleChange('injuryRecoveryTime', e.target.value)}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                >
                  <option className="bg-slate-900 text-slate-100" value="rapide">Rapide</option>
                  <option className="bg-slate-900 text-slate-100" value="normal">Normal</option>
                  <option className="bg-slate-900 text-slate-100" value="réaliste">Réaliste</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="fatigueEnabled"
              checked={localOptions.fatigueEnabled}
              onChange={(e) => handleChange('fatigueEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="fatigueEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Fatigue activée
            </label>
          </div>

          {localOptions.fatigueEnabled && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Impact de la fatigue
              </label>
              <select
                value={localOptions.fatigueImpact}
                onChange={(e) => handleChange('fatigueImpact', e.target.value)}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
              >
                <option className="bg-slate-900 text-slate-100" value="faible">Faible</option>
                <option className="bg-slate-900 text-slate-100" value="moyen">Moyen</option>
                <option className="bg-slate-900 text-slate-100" value="élevé">Élevé</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Réalisme */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Options de réalisme</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { key: 'playerDevelopment', label: 'Progression des joueurs' },
            { key: 'playerRegression', label: 'Régression des vétérans' },
            { key: 'rookieDevelopmentBonus', label: 'Bonus développement recrues' },
            { key: 'realisticLineChanges', label: 'Changements de ligne réalistes' },
            { key: 'realisticPenalties', label: 'Pénalités réalistes' },
            { key: 'homeIceAdvantage', label: 'Avantage glace locale' },
            { key: 'teamChemistry', label: 'Chimie d\'équipe' },
            { key: 'fanMorale', label: 'Moral des partisans' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center">
              <input
                type="checkbox"
                id={key}
                checked={localOptions[key as keyof LeagueOptions] as boolean}
                onChange={(e) => handleChange(key as keyof LeagueOptions, e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor={key} className="ml-2 text-sm text-slate-200">
                {label}
              </label>
            </div>
          ))}
        </div>

        {localOptions.homeIceAdvantage && (
          <div className="ml-6">
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Avantage glace locale (%): {localOptions.homeIceAdvantagePercent}
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={localOptions.homeIceAdvantagePercent}
              onChange={(e) => handleChange('homeIceAdvantagePercent', Number(e.target.value))}
              className="w-full max-w-md"
            />
          </div>
        )}
      </section>

      {/* Game Mode */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Mode Jeu (Testing)</h3>
        <p className="text-sm text-slate-400">
          Activez le mode jeu pour tester le simulateur en gérant une seule équipe. L'IA gère toutes les autres équipes.
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="gameMode"
              checked={localOptions.gameMode}
              onChange={(e) => {
                handleChange('gameMode', e.target.checked)
                // Reset team selection when disabling game mode
                if (!e.target.checked) {
                  handleChange('gameModeTeamId', null)
                }
              }}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="gameMode" className="ml-2 text-sm font-medium text-slate-200">
              Mode jeu activé
            </label>
          </div>

          {localOptions.gameMode && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Équipe gérée par le GM
              </label>
              <select
                value={localOptions.gameModeTeamId || ''}
                onChange={(e) => {
                  const newValue = e.target.value === '' ? null : e.target.value
                  console.log('🎮 Game Mode Team Changed:', newValue)
                  handleChange('gameModeTeamId', newValue)
                }}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-md"
              >
                <option value="">Sélectionner une équipe...</option>
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id} className="bg-slate-900 text-slate-100">
                    {team.city} {team.name} ({team.abbreviation})
                  </option>
                ))}
              </select>
              {localOptions.gameModeTeamId && (
                <p className="mt-2 text-xs text-green-400">
                  ✓ Vous gérez cette équipe. Toutes les autres équipes sont gérées par l'IA.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* AHL */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Ligue AHL</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ahlEnabled"
              checked={localOptions.ahlEnabled}
              onChange={(e) => handleChange('ahlEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="ahlEnabled" className="ml-2 text-sm font-medium text-slate-200">
              AHL activée
            </label>
          </div>

          {localOptions.ahlEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Taille effectif AHL
                </label>
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={localOptions.ahlRosterSize}
                  onChange={(e) => handleChange('ahlRosterSize', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Limite de rappels
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={localOptions.callUpLimit}
                  onChange={(e) => handleChange('callUpLimit', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Zone de danger */}
      <section className="space-y-4 border-t pt-8 mt-8 border-red-900/30">
        <h3 className="text-lg font-medium text-red-400">Zone de danger</h3>
        <p className="text-sm text-slate-400">
          Ces actions sont <strong className="text-red-400">irréversibles</strong>. Utilisez avec précaution.
        </p>

        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 space-y-4">
          <div>
            <h4 className="font-medium text-red-300 mb-2">Réinitialiser les données de la ligue</h4>
            <p className="text-sm text-slate-400 mb-4">
              Supprime tous les joueurs, matchs, statistiques et événements.
              Conserve les équipes, paramètres de ligue et utilisateurs.
              Utile pour ré-importer des joueurs depuis zéro.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                🗑️ Nettoyer les données
              </button>
            ) : (
              <div className="space-y-3 bg-red-900/20 p-4 rounded border border-red-700/50">
                <p className="text-sm font-medium text-red-300">
                  ⚠️ Êtes-vous absolument sûr?
                </p>
                <p className="text-xs text-slate-400">
                  Cette action va supprimer:
                </p>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                  <li>Tous les joueurs importés</li>
                  <li>Tous les matchs et résultats</li>
                  <li>Toutes les statistiques</li>
                  <li>Tous les événements de match</li>
                  <li>Le calendrier complet</li>
                </ul>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => resetLeagueMutation.mutate()}
                    disabled={resetLeagueMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    {resetLeagueMutation.isPending ? 'Nettoyage...' : 'Oui, nettoyer tout'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetLeagueMutation.isPending}
                    className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
