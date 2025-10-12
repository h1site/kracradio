import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameplayRules } from '../../../types'

interface GameplayRulesPanelProps {
  rules: GameplayRules
  onUpdate: (rules: GameplayRules) => void
  isUpdating: boolean
}

export const GameplayRulesPanel = ({ rules, onUpdate, isUpdating }: GameplayRulesPanelProps) => {
  const { t } = useTranslation()
  const [localRules, setLocalRules] = useState<GameplayRules>(rules || {} as GameplayRules)

  useEffect(() => {
    if (rules) {
      setLocalRules(rules)
    }
  }, [rules])

  const handleChange = (field: keyof GameplayRules, value: string | number | boolean) => {
    setLocalRules((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onUpdate(localRules)
  }

  const overtimeFormatOptions = [
    { value: '3v3', label: t('leagueRules.gameplay.sections.overtime.options.format.3v3') },
    { value: '4v4', label: t('leagueRules.gameplay.sections.overtime.options.format.4v4') },
    { value: '5v5', label: t('leagueRules.gameplay.sections.overtime.options.format.5v5') },
  ]

  // Unused for now but may be needed in the future
  // const fightingPenaltyOptions = [
  //   { value: 'majeure', label: t('leagueRules.gameplay.sections.penalties.fighting.options.majeure') },
  //   { value: 'expulsion', label: t('leagueRules.gameplay.sections.penalties.fighting.options.expulsion') },
  // ]

  // const penaltyTypeKeys: Array<keyof GameplayRules> = [
  //   'highStickingEnabled',
  //   'hookingEnabled',
  //   'slashingEnabled',
  //   'trippingEnabled',
  //   'interferenceEnabled',
  //   'chargingEnabled',
  //   'crossCheckingEnabled',
  //   'roughingEnabled',
  //   'elbowingEnabled',
  //   'kneeingEnabled',
  //   'headContactPenalty',
  //   'delayOfGameEnabled',
  // ]

  // const equipmentKeys: Array<keyof GameplayRules> = ['helmetRequired', 'visorRequired', 'neckGuardRequired']

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('leagueRules.gameplay.title')}</h2>
        <p className="text-slate-400 mb-6">{t('leagueRules.gameplay.description')}</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.gameplay.sections.match.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.gameplay.sections.match.fields.periodLength')}
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={localRules.periodLength}
              onChange={(e) => handleChange('periodLength', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.gameplay.sections.match.fields.numberOfPeriods')}
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={localRules.numberOfPeriods}
              onChange={(e) => handleChange('numberOfPeriods', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.gameplay.sections.match.fields.intermissionLength')}
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={localRules.intermissionLength}
              onChange={(e) => handleChange('intermissionLength', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* Prolongation et fusillade */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.gameplay.sections.overtime.title')}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="overtimeEnabled"
              checked={localRules.overtimeEnabled}
              onChange={(e) => handleChange('overtimeEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="overtimeEnabled" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.gameplay.sections.overtime.fields.enabled')}
            </label>
          </div>

          {localRules.overtimeEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  {t('leagueRules.gameplay.sections.overtime.fields.length')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={localRules.overtimeLength}
                  onChange={(e) => handleChange('overtimeLength', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  {t('leagueRules.gameplay.sections.overtime.fields.format')}
                </label>
                <select
                  value={localRules.overtimeFormat}
                  onChange={(e) => handleChange('overtimeFormat', e.target.value)}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                >
                  {overtimeFormatOptions.map((option) => (
                    <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="shootoutEnabled"
              checked={localRules.shootoutEnabled}
              onChange={(e) => handleChange('shootoutEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="shootoutEnabled" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.gameplay.sections.overtime.fields.shootoutEnabled')}
            </label>
          </div>

          {localRules.shootoutEnabled && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                {t('leagueRules.gameplay.sections.overtime.fields.shootoutRounds')}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={localRules.shootoutRounds}
                onChange={(e) => handleChange('shootoutRounds', Number(e.target.value))}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
              />
            </div>
          )}
        </div>
      </section>

      {/* Règles de jeu de base */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.gameplay.sections.basic.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="icingEnabled"
                checked={localRules.icingEnabled}
                onChange={(e) => handleChange('icingEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="icingEnabled" className="ml-2 text-sm text-slate-200">
                {t('leagueRules.gameplay.sections.basic.fields.icing')}
              </label>
            </div>

            {localRules.icingEnabled && (
              <div className="ml-6 flex items-center">
                <input
                  type="checkbox"
                  id="hybridIcing"
                  checked={localRules.hybridIcing}
                  onChange={(e) => handleChange('hybridIcing', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="hybridIcing" className="ml-2 text-sm text-slate-200">
                  {t('leagueRules.gameplay.sections.basic.fields.hybridIcing')}
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="offsideEnabled"
                checked={localRules.offsideEnabled}
                onChange={(e) => handleChange('offsideEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="offsideEnabled" className="ml-2 text-sm text-slate-200">
                {t('leagueRules.gameplay.sections.basic.fields.offside')}
              </label>
            </div>

            {localRules.offsideEnabled && (
              <div className="ml-6 flex items-center">
                <input
                  type="checkbox"
                  id="offsideReview"
                  checked={localRules.offsideReview}
                  onChange={(e) => handleChange('offsideReview', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="offsideReview" className="ml-2 text-sm text-slate-200">
                  {t('leagueRules.gameplay.sections.basic.fields.offsideReview')}
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="goalieTrapezoid"
              checked={localRules.goalieTrapezoid}
              onChange={(e) => handleChange('goalieTrapezoid', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="goalieTrapezoid" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.gameplay.sections.basic.fields.goalieTrapezoid')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="lineChangeAfterIcing"
              checked={!localRules.lineChangeAfterIcing}
              onChange={(e) => handleChange('lineChangeAfterIcing', !e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="lineChangeAfterIcing" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.gameplay.sections.basic.fields.lineChangeAfterIcing')}
            </label>
          </div>
        </div>
      </section>

      {/* Pénalités */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Pénalités</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="penaltiesEnabled"
              checked={localRules.penaltiesEnabled}
              onChange={(e) => handleChange('penaltiesEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="penaltiesEnabled" className="ml-2 text-sm font-medium text-slate-200">
              Pénalités activées
            </label>
          </div>

          {localRules.penaltiesEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Pénalité mineure (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={localRules.minorPenaltyDuration}
                    onChange={(e) => handleChange('minorPenaltyDuration', Number(e.target.value))}
                    className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Pénalité majeure (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={localRules.majorPenaltyDuration}
                    onChange={(e) => handleChange('majorPenaltyDuration', Number(e.target.value))}
                    className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Inconduite (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={localRules.misconductDuration}
                    onChange={(e) => handleChange('misconductDuration', Number(e.target.value))}
                    className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Types de pénalités */}
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-2">Types de pénalités activées</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { key: 'highStickingEnabled', label: 'Bâton élevé' },
                    { key: 'hookingEnabled', label: 'Accrochage' },
                    { key: 'slashingEnabled', label: 'Cinglage' },
                    { key: 'trippingEnabled', label: 'Faire trébucher' },
                    { key: 'interferenceEnabled', label: 'Obstruction' },
                    { key: 'chargingEnabled', label: 'Charge' },
                    { key: 'crossCheckingEnabled', label: 'Coup de crosse' },
                    { key: 'roughingEnabled', label: 'Rudesse' },
                    { key: 'elbowingEnabled', label: 'Coup de coude' },
                    { key: 'kneeingEnabled', label: 'Coup de genou' },
                    { key: 'headContactPenalty', label: 'Contact à la tête' },
                    { key: 'delayOfGameEnabled', label: 'Retard de jeu' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={key}
                        checked={localRules[key as keyof GameplayRules] as boolean}
                        onChange={(e) => handleChange(key as keyof GameplayRules, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor={key} className="ml-2 text-sm text-slate-200">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagarres */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="fightingAllowed"
                    checked={localRules.fightingAllowed}
                    onChange={(e) => handleChange('fightingAllowed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="fightingAllowed" className="ml-2 text-sm font-medium text-slate-200">
                    Bagarres autorisées
                  </label>
                </div>

                {localRules.fightingAllowed && (
                  <div className="ml-6 space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Pénalité pour bagarre
                      </label>
                      <select
                        value={localRules.fightingPenalty}
                        onChange={(e) => handleChange('fightingPenalty', e.target.value)}
                        className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
                      >
                        <option className="bg-slate-900 text-slate-100" value="majeure">Majeure (5 min)</option>
                        <option className="bg-slate-900 text-slate-100" value="expulsion">Expulsion</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="instigatorPenalty"
                        checked={localRules.instigatorPenalty}
                        onChange={(e) => handleChange('instigatorPenalty', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="instigatorPenalty" className="ml-2 text-sm text-slate-200">
                        Pénalité pour l'instigateur
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Révision vidéo et contestations */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Révision vidéo</h3>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="goalReview"
              checked={localRules.goalReview}
              onChange={(e) => handleChange('goalReview', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="goalReview" className="ml-2 text-sm text-slate-200">
              Révision des buts
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="coachChallenge"
              checked={localRules.coachChallenge}
              onChange={(e) => handleChange('coachChallenge', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="coachChallenge" className="ml-2 text-sm text-slate-200">
              Contestation d'entraîneur
            </label>
          </div>

          {localRules.coachChallenge && (
            <div className="ml-6 space-y-2">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Nombre de contestations
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={localRules.coachChallengeLimit}
                  onChange={(e) => handleChange('coachChallengeLimit', Number(e.target.value))}
                  className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100 max-w-xs"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="challengeFailurePenalty"
                  checked={localRules.challengeFailurePenalty}
                  onChange={(e) => handleChange('challengeFailurePenalty', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="challengeFailurePenalty" className="ml-2 text-sm text-slate-200">
                  Pénalité si contestation échouée
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="netDisplacementReview"
              checked={localRules.netDisplacementReview}
              onChange={(e) => handleChange('netDisplacementReview', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="netDisplacementReview" className="ml-2 text-sm text-slate-200">
              Vérifier déplacement du filet
            </label>
          </div>
        </div>
      </section>

      {/* Timeouts */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Temps morts</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Nombre par équipe
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={localRules.timeoutsPerTeam}
              onChange={(e) => handleChange('timeoutsPerTeam', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Durée (secondes)
            </label>
            <input
              type="number"
              min="15"
              max="120"
              step="15"
              value={localRules.timeoutDuration}
              onChange={(e) => handleChange('timeoutDuration', Number(e.target.value))}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* Équipement */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">Équipement obligatoire</h3>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="helmetRequired"
              checked={localRules.helmetRequired}
              onChange={(e) => handleChange('helmetRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="helmetRequired" className="ml-2 text-sm text-slate-200">
              Casque obligatoire
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="visorRequired"
              checked={localRules.visorRequired}
              onChange={(e) => handleChange('visorRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="visorRequired" className="ml-2 text-sm text-slate-200">
              Visière obligatoire
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="neckGuardRequired"
              checked={localRules.neckGuardRequired}
              onChange={(e) => handleChange('neckGuardRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="neckGuardRequired" className="ml-2 text-sm text-slate-200">
              Protège-cou obligatoire
            </label>
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
