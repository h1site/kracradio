import { useState } from 'react'
import { useLeagueRules, useUpdateLeagueRules, useResetLeagueRules } from '../../api/leagueRules'
import { DEFAULT_LEAGUE_RULES } from '../../types'
import type { LeagueRules } from '../../types'
import { AIRulesPanel } from './rules/AIRulesPanel'
import { GameplayRulesPanel } from './rules/GameplayRulesPanel'
import { LeagueOptionsPanel } from './rules/LeagueOptionsPanel'
import { FinancePanel } from './rules/FinancePanel'
import { DivisionsPanel } from '../leagueOptions/DivisionsPanel'

interface LeagueRulesSettingsProps {
  leagueId: string
}

export const LeagueRulesSettings = ({ leagueId }: LeagueRulesSettingsProps) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'gameplay' | 'league' | 'finance' | 'divisions'>('gameplay')

  const { data: rules, isLoading, error } = useLeagueRules(leagueId)
  const updateRulesMutation = useUpdateLeagueRules()
  const resetRulesMutation = useResetLeagueRules()

  const currentRules: LeagueRules =
    rules &&
    rules.gameplayRules &&
    rules.aiRules &&
    rules.leagueOptions
      ? rules
      : DEFAULT_LEAGUE_RULES

  const handleUpdateRules = (updatedRules: Partial<LeagueRules>) => {
    updateRulesMutation.mutate({
      leagueId,
      rules: updatedRules,
    })
  }

  const handleResetRules = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les règles aux valeurs par défaut?')) {
      resetRulesMutation.mutate(leagueId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-slate-200">Chargement des règles...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-950/60 border border-red-800 rounded-lg p-4">
        <p className="text-red-300">
          {error instanceof Error
            ? `Erreur lors du chargement des règles: ${error.message}`
            : 'Erreur inconnue lors du chargement des règles'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Règles de la ligue</h1>
          <p className="text-slate-400 mt-1">Personnalisez toutes les règles de votre ligue</p>
        </div>
        <button
          onClick={handleResetRules}
          disabled={resetRulesMutation.isPending}
          className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 disabled:opacity-50"
        >
          {resetRulesMutation.isPending ? 'Réinitialisation...' : 'Réinitialiser tout'}
        </button>
      </div>

      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('gameplay')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'gameplay'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }
            `}
          >
            Règles de jeu
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'ai'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }
            `}
          >
            Règles de l'IA
          </button>
          <button
            onClick={() => setActiveTab('league')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'league'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }
            `}
          >
            Options de ligue
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'finance'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }
            `}
          >
            Finance
          </button>
          <button
            onClick={() => setActiveTab('divisions')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'divisions'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }
            `}
          >
            Divisions & Conférences
          </button>
        </nav>
      </div>

      {updateRulesMutation.isSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg p-4">
          <p className="text-emerald-300">Règles mises à jour avec succès!</p>
        </div>
      )}

      {updateRulesMutation.isError && (
        <div className="bg-red-950/60 border border-red-800 rounded-lg p-4">
          <p className="text-red-300 whitespace-pre-wrap">
            Erreur lors de la mise à jour: {updateRulesMutation.error instanceof Error ? updateRulesMutation.error.message : JSON.stringify(updateRulesMutation.error, null, 2)}
          </p>
        </div>
      )}

      <div className="bg-slate-900/60 rounded-lg border border-slate-800">
        {activeTab === 'ai' && (
          <AIRulesPanel
            rules={currentRules.aiRules}
            onUpdate={(aiRules) => handleUpdateRules({ aiRules })}
            isUpdating={updateRulesMutation.isPending}
          />
        )}

        {activeTab === 'gameplay' && (
          <GameplayRulesPanel
            rules={currentRules.gameplayRules}
            onUpdate={(gameplayRules) => handleUpdateRules({ gameplayRules })}
            isUpdating={updateRulesMutation.isPending}
          />
        )}

        {activeTab === 'league' && (
          <LeagueOptionsPanel
            leagueId={leagueId}
            options={currentRules.leagueOptions}
            onUpdate={(leagueOptions) => handleUpdateRules({ leagueOptions })}
            isUpdating={updateRulesMutation.isPending}
          />
        )}

        {activeTab === 'finance' && (
          <FinancePanel
            options={currentRules.leagueOptions}
            onUpdate={(leagueOptions) => handleUpdateRules({ leagueOptions })}
            isUpdating={updateRulesMutation.isPending}
          />
        )}

        {activeTab === 'divisions' && (
          <DivisionsPanel />
        )}
      </div>
    </div>
  )
}
