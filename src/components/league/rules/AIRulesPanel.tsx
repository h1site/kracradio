import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AIRules } from '../../../types'

interface AIRulesPanelProps {
  rules: AIRules
  onUpdate: (rules: AIRules) => void
  isUpdating: boolean
}

export const AIRulesPanel = ({ rules, onUpdate, isUpdating }: AIRulesPanelProps) => {
  const { t } = useTranslation()
  const [localRules, setLocalRules] = useState<AIRules>(rules || {} as AIRules)

  useEffect(() => {
    if (rules) {
      setLocalRules(rules)
    }
  }, [rules])

  const handleChange = (field: keyof AIRules, value: string | number | boolean) => {
    setLocalRules((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onUpdate(localRules)
  }

  const aiDifficultyOptions = [
    { value: 'facile', label: t('leagueRules.ai.sections.general.options.difficulty.facile') },
    { value: 'normal', label: t('leagueRules.ai.sections.general.options.difficulty.normal') },
    { value: 'difficile', label: t('leagueRules.ai.sections.general.options.difficulty.difficile') },
    { value: 'expert', label: t('leagueRules.ai.sections.general.options.difficulty.expert') },
  ]

  const lineChangeOptions = [
    { value: 'conservateur', label: t('leagueRules.ai.sections.general.options.lineChanges.conservateur') },
    { value: 'normal', label: t('leagueRules.ai.sections.general.options.lineChanges.normal') },
    { value: 'agressif', label: t('leagueRules.ai.sections.general.options.lineChanges.agressif') },
  ]

  const icingStrategyOptions = [
    { value: 'éviter', label: t('leagueRules.ai.sections.tactics.options.icingStrategy.éviter') },
    { value: 'normal', label: t('leagueRules.ai.sections.tactics.options.icingStrategy.normal') },
    { value: 'agressif', label: t('leagueRules.ai.sections.tactics.options.icingStrategy.agressif') },
  ]

  const penaltyKillOptions = [
    { value: 'défensif', label: t('leagueRules.ai.sections.tactics.options.penaltyKill.défensif') },
    { value: 'équilibré', label: t('leagueRules.ai.sections.tactics.options.penaltyKill.équilibré') },
    { value: 'agressif', label: t('leagueRules.ai.sections.tactics.options.penaltyKill.agressif') },
  ]

  const powerPlayOptions = [
    { value: 'conservateur', label: t('leagueRules.ai.sections.tactics.options.powerPlay.conservateur') },
    { value: 'équilibré', label: t('leagueRules.ai.sections.tactics.options.powerPlay.équilibré') },
    { value: 'offensif', label: t('leagueRules.ai.sections.tactics.options.powerPlay.offensif') },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('leagueRules.ai.title')}</h2>
        <p className="text-slate-400 mb-6">{t('leagueRules.ai.description')}</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.ai.sections.general.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.general.fields.difficulty')}
            </label>
            <select
              value={localRules.aiDifficulty}
              onChange={(e) => handleChange('aiDifficulty', e.target.value)}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            >
              {aiDifficultyOptions.map((option) => (
                <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.general.fields.aggressiveness', {
                value: localRules.aiAggressiveness,
              })}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localRules.aiAggressiveness}
              onChange={(e) => handleChange('aiAggressiveness', Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.general.fields.lineChanges')}
            </label>
            <select
              value={localRules.aiLineChangeBehavior}
              onChange={(e) => handleChange('aiLineChangeBehavior', e.target.value)}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            >
              {lineChangeOptions.map((option) => (
                <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.ai.sections.tactics.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="aiPullGoalie"
              checked={localRules.aiPullGoalie}
              onChange={(e) => handleChange('aiPullGoalie', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="aiPullGoalie" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.ai.sections.tactics.fields.pullGoalie')}
            </label>
          </div>

          {localRules.aiPullGoalie && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                {t('leagueRules.ai.sections.tactics.fields.pullGoalieTime')}
              </label>
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.5"
                value={localRules.aiPullGoalieTime}
                onChange={(e) => handleChange('aiPullGoalieTime', Number(e.target.value))}
                className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.tactics.fields.icingStrategy')}
            </label>
            <select
              value={localRules.aiIcingStrategy}
              onChange={(e) => handleChange('aiIcingStrategy', e.target.value)}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            >
              {icingStrategyOptions.map((option) => (
                <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.tactics.fields.penaltyKill')}
            </label>
            <select
              value={localRules.aiPenaltyKilling}
              onChange={(e) => handleChange('aiPenaltyKilling', e.target.value)}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            >
              {penaltyKillOptions.map((option) => (
                <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.tactics.fields.powerPlay')}
            </label>
            <select
              value={localRules.aiPowerPlayStrategy}
              onChange={(e) => handleChange('aiPowerPlayStrategy', e.target.value)}
              className="w-full border border-slate-600 bg-slate-900 rounded-md px-3 py-2 text-slate-100"
            >
              {powerPlayOptions.map((option) => (
                <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.ai.sections.players.title')}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="aiRespectDepthChart"
              checked={localRules.aiRespectDepthChart}
              onChange={(e) => handleChange('aiRespectDepthChart', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="aiRespectDepthChart" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.ai.sections.players.fields.depthChart')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="aiInjuryManagement"
              checked={localRules.aiInjuryManagement}
              onChange={(e) => handleChange('aiInjuryManagement', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="aiInjuryManagement" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.ai.sections.players.fields.injuryManagement')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="aiCallUpPlayers"
              checked={localRules.aiCallUpPlayers}
              onChange={(e) => handleChange('aiCallUpPlayers', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="aiCallUpPlayers" className="ml-2 text-sm text-slate-200">
              {t('leagueRules.ai.sections.players.fields.callUps')}
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-100">
          {t('leagueRules.ai.sections.discipline.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('leagueRules.ai.sections.discipline.fields.fightingTendency', {
                value: localRules.aiFightingTendency,
              })}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localRules.aiFightingTendency}
              onChange={(e) => handleChange('aiFightingTendency', Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="aiRetaliation"
                checked={localRules.aiRetaliation}
                onChange={(e) => handleChange('aiRetaliation', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="aiRetaliation" className="ml-2 text-sm text-slate-200">
                {t('leagueRules.ai.sections.discipline.fields.retaliation')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="aiProtectStars"
                checked={localRules.aiProtectStars}
                onChange={(e) => handleChange('aiProtectStars', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="aiProtectStars" className="ml-2 text-sm text-slate-200">
                {t('leagueRules.ai.sections.discipline.fields.protectStars')}
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {isUpdating ? t('leagueRules.ai.save.working') : t('leagueRules.ai.save.label')}
        </button>
      </div>
    </div>
  )
}
