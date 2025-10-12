import { useState, useEffect } from 'react'
import type { LeagueOptions } from '../../../types'

interface FinancePanelProps {
  options: LeagueOptions
  onUpdate: (options: LeagueOptions) => void
  isUpdating: boolean
}

export const FinancePanel = ({ options, onUpdate, isUpdating }: FinancePanelProps) => {
  const [localOptions, setLocalOptions] = useState<LeagueOptions>(options || {} as LeagueOptions)

  useEffect(() => {
    if (options) {
      setLocalOptions(options)
    }
  }, [options])

  const handleChange = (field: keyof LeagueOptions, value: string | number | boolean) => {
    setLocalOptions((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onUpdate(localOptions)
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-100">🏒 Détails contractuels et financiers</h2>
        <p className="text-slate-400 mb-6">
          Configurez tous les aspects financiers et contractuels conformes à la CBA de la NHL (2026-2030)
        </p>
      </div>

      {/* Contrats d'entrée (Entry-Level) */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Contrats d'entrée (Entry-Level Contracts)</h3>
        <p className="text-sm text-slate-400">
          Premiers contrats obligatoires pour tous les nouveaux joueurs NHL
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="elcEnabled"
              checked={localOptions.elcEnabled}
              onChange={(e) => handleChange('elcEnabled', e.target.checked)}
              className="h-4 w-4 text-sky-600 rounded"
            />
            <label htmlFor="elcEnabled" className="ml-2 text-sm text-slate-200">
              Contrats d'entrée obligatoires
            </label>
          </div>

          {localOptions.elcEnabled && (
            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Salaire de base maximal ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={localOptions.elcMaxSalary}
                  onChange={(e) => handleChange('elcMaxSalary', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Bonus de performance max ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={localOptions.elcMaxBonus}
                  onChange={(e) => handleChange('elcMaxBonus', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Durée pour joueurs 18-21 ans (années)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={localOptions.elcDuration18to21}
                  onChange={(e) => handleChange('elcDuration18to21', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Durée pour joueurs 22-23 ans (années)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={localOptions.elcDuration22to23}
                  onChange={(e) => handleChange('elcDuration22to23', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Durée pour joueurs 24+ ans (années)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={localOptions.elcDuration24plus}
                  onChange={(e) => handleChange('elcDuration24plus', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="twoWayContractsEnabled"
                  checked={localOptions.twoWayContractsEnabled}
                  onChange={(e) => handleChange('twoWayContractsEnabled', e.target.checked)}
                  className="h-4 w-4 text-sky-600 rounded"
                />
                <label htmlFor="twoWayContractsEnabled" className="ml-2 text-sm text-slate-200">
                  Contrats bidirectionnels (two-way) autorisés
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Structure salariale */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Structure salariale</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Variation annuelle max (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={localOptions.salaryVariationLimit}
              onChange={(e) => handleChange('salaryVariationLimit', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Empêche les contrats trop chargés en début ou fin (défaut: 20%)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Bonus à la signature max (% du contrat)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={localOptions.signingBonusMaxPercent}
              onChange={(e) => handleChange('signingBonusMaxPercent', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Salaire minimum NHL ($)
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={localOptions.minimumNHLSalary}
              onChange={(e) => handleChange('minimumNHLSalary', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="performanceBonusesEnabled"
                checked={localOptions.performanceBonusesEnabled}
                onChange={(e) => handleChange('performanceBonusesEnabled', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="performanceBonusesEnabled" className="ml-2 text-sm text-slate-200">
                Bonus de performance autorisés
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="deferredPaymentsAllowed"
                checked={localOptions.deferredPaymentsAllowed}
                onChange={(e) => handleChange('deferredPaymentsAllowed', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="deferredPaymentsAllowed" className="ml-2 text-sm text-slate-200">
                Paiements différés autorisés
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Clauses spéciales */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Clauses contractuelles spéciales</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="buyoutEnabled"
              checked={localOptions.buyoutEnabled}
              onChange={(e) => handleChange('buyoutEnabled', e.target.checked)}
              className="h-4 w-4 text-sky-600 rounded"
            />
            <label htmlFor="buyoutEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Rachat de contrat (buyout) autorisé
            </label>
          </div>

          {localOptions.buyoutEnabled && (
            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Taux de rachat pour joueurs 26+ ans (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={localOptions.buyoutRateOver26}
                  onChange={(e) => handleChange('buyoutRateOver26', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">Défaut NHL: 66.67% (2/3)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Taux de rachat pour joueurs -26 ans (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={localOptions.buyoutRateUnder26}
                  onChange={(e) => handleChange('buyoutRateUnder26', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">Défaut NHL: 33.33% (1/3)</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="noMovementClausesEnabled"
                checked={localOptions.noMovementClausesEnabled}
                onChange={(e) => handleChange('noMovementClausesEnabled', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="noMovementClausesEnabled" className="ml-2 text-sm text-slate-200">
                Clauses de non-mouvement (NMC)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="limitedNoTradeEnabled"
                checked={localOptions.limitedNoTradeEnabled}
                onChange={(e) => handleChange('limitedNoTradeEnabled', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="limitedNoTradeEnabled" className="ml-2 text-sm text-slate-200">
                NTC limitées (liste d'équipes)
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Arbitrage salarial */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Arbitrage salarial</h3>
        <p className="text-sm text-slate-400">
          Processus de résolution de désaccords sur la rémunération
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="salaryArbitrationEnabled"
              checked={localOptions.salaryArbitrationEnabled}
              onChange={(e) => handleChange('salaryArbitrationEnabled', e.target.checked)}
              className="h-4 w-4 text-sky-600 rounded"
            />
            <label htmlFor="salaryArbitrationEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Arbitrage salarial activé
            </label>
          </div>

          {localOptions.salaryArbitrationEnabled && (
            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Années d'expérience requises
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={localOptions.arbitrationEligibilityYears}
                  onChange={(e) => handleChange('arbitrationEligibilityYears', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="clubElectedArbitration"
                    checked={localOptions.clubElectedArbitration}
                    onChange={(e) => handleChange('clubElectedArbitration', e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded"
                  />
                  <label htmlFor="clubElectedArbitration" className="ml-2 text-sm text-slate-200">
                    Arbitrage initié par le club autorisé
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="arbitrationDecisionBinding"
                    checked={localOptions.arbitrationDecisionBinding}
                    onChange={(e) => handleChange('arbitrationDecisionBinding', e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded"
                  />
                  <label htmlFor="arbitrationDecisionBinding" className="ml-2 text-sm text-slate-200">
                    Décision de l'arbitre contraignante
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Blessures et assurances */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Listes de blessés et assurances</h3>

        <div className="space-y-4">
          {/* Injured Reserve (IR) */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="injuredReserveEnabled"
                checked={localOptions.injuredReserveEnabled}
                onChange={(e) => handleChange('injuredReserveEnabled', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="injuredReserveEnabled" className="ml-2 text-sm font-medium text-slate-200">
                Liste des blessés (IR) activée
              </label>
            </div>

            {localOptions.injuredReserveEnabled && (
              <div className="ml-6 mt-2">
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Jours minimum en IR
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={localOptions.irMinimumDays}
                  onChange={(e) => handleChange('irMinimumDays', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Long-Term Injured Reserve (LTIR) */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ltirEnabled"
                checked={localOptions.ltirEnabled}
                onChange={(e) => handleChange('ltirEnabled', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="ltirEnabled" className="ml-2 text-sm font-medium text-slate-200">
                Liste blessés long terme (LTIR) activée
              </label>
            </div>

            {localOptions.ltirEnabled && (
              <div className="ml-6 mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Jours minimum en LTIR
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={localOptions.ltirMinimumDays}
                    onChange={(e) => handleChange('ltirMinimumDays', Number(e.target.value))}
                    className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Matchs minimum en LTIR
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={localOptions.ltirMinimumGames}
                    onChange={(e) => handleChange('ltirMinimumGames', Number(e.target.value))}
                    className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ltirCapRelief"
                    checked={localOptions.ltirCapRelief}
                    onChange={(e) => handleChange('ltirCapRelief', e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded"
                  />
                  <label htmlFor="ltirCapRelief" className="ml-2 text-sm text-slate-200">
                    Soulagement du plafond salarial
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Assurances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="healthInsuranceProvided"
                checked={localOptions.healthInsuranceProvided}
                onChange={(e) => handleChange('healthInsuranceProvided', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="healthInsuranceProvided" className="ml-2 text-sm text-slate-200">
                Assurance santé fournie
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="disabilityInsuranceProvided"
                checked={localOptions.disabilityInsuranceProvided}
                onChange={(e) => handleChange('disabilityInsuranceProvided', e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded"
              />
              <label htmlFor="disabilityInsuranceProvided" className="ml-2 text-sm text-slate-200">
                Assurance invalidité fournie
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Retraite et pensions */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Retraite et pensions</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pensionEnabled"
              checked={localOptions.pensionEnabled}
              onChange={(e) => handleChange('pensionEnabled', e.target.checked)}
              className="h-4 w-4 text-sky-600 rounded"
            />
            <label htmlFor="pensionEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Système de pension activé
            </label>
          </div>

          {localOptions.pensionEnabled && (
            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Années de service pour pension complète
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={localOptions.pensionYearsRequired}
                  onChange={(e) => handleChange('pensionYearsRequired', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="earlyRetirementPenalty"
                    checked={localOptions.earlyRetirementPenalty}
                    onChange={(e) => handleChange('earlyRetirementPenalty', e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded"
                  />
                  <label htmlFor="earlyRetirementPenalty" className="ml-2 text-sm text-slate-200">
                    Pénalité pour retraite anticipée
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="capRecaptureRule"
                    checked={localOptions.capRecaptureRule}
                    onChange={(e) => handleChange('capRecaptureRule', e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded"
                  />
                  <label htmlFor="capRecaptureRule" className="ml-2 text-sm text-slate-200">
                    Règle de récupération du plafond
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-6 border-t border-slate-700">
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
