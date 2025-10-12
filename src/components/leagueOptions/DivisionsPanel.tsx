import { useState } from 'react'
import {
  useLeagueConferencesAndDivisions,
  useInitializeNHLDivisions,
  useUpsertConference,
  useUpsertDivision,
  useDeleteConference,
  useDeleteDivision,
  useUpdateTeamDivision,
  type Conference,
  type Division,
} from '../../api/divisions'
import { useLeagueStore } from '../../state/useLeagueStore'
import { useLeagueTeamsQuery } from '../../api/teams'

export const DivisionsPanel = () => {
  const { selectedLeagueId } = useLeagueStore()
  const { data: conferencesData, isLoading } = useLeagueConferencesAndDivisions(selectedLeagueId || undefined)
  const { data: teams } = useLeagueTeamsQuery(selectedLeagueId || null)
  const initializeNHL = useInitializeNHLDivisions()
  const upsertConference = useUpsertConference()
  const upsertDivision = useUpsertDivision()
  const deleteConference = useDeleteConference()
  const deleteDivision = useDeleteDivision()
  const updateTeamDivision = useUpdateTeamDivision()

  const [editingConference, setEditingConference] = useState<Conference | null>(null)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [isAddingConference, setIsAddingConference] = useState(false)
  const [isAddingDivision, setIsAddingDivision] = useState<string | null>(null)
  const [newConferenceName, setNewConferenceName] = useState('')
  const [newDivisionName, setNewDivisionName] = useState('')

  const handleInitializeNHL = async () => {
    if (!selectedLeagueId) return
    if (!confirm('Initialiser les divisions NHL par défaut? Ceci écrasera les divisions existantes.')) return

    try {
      await initializeNHL.mutateAsync({ leagueId: selectedLeagueId })
      alert('Divisions NHL initialisées avec succès!')
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleSaveConference = async () => {
    if (!selectedLeagueId || !newConferenceName.trim()) return

    try {
      await upsertConference.mutateAsync({
        id: editingConference?.id,
        league_id: selectedLeagueId,
        name: newConferenceName,
        display_order: editingConference?.display_order || (conferencesData?.length || 0) + 1,
      })
      setIsAddingConference(false)
      setEditingConference(null)
      setNewConferenceName('')
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleSaveDivision = async (conferenceId: string) => {
    if (!selectedLeagueId || !newDivisionName.trim()) return

    try {
      const conference = conferencesData?.find(c => c.id === conferenceId)
      await upsertDivision.mutateAsync({
        id: editingDivision?.id,
        league_id: selectedLeagueId,
        conference_id: conferenceId,
        name: newDivisionName,
        display_order: editingDivision?.display_order || (conference?.divisions.length || 0) + 1,
      })
      setIsAddingDivision(null)
      setEditingDivision(null)
      setNewDivisionName('')
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleDeleteConference = async (confId: string) => {
    if (!selectedLeagueId) return
    if (!confirm('Supprimer cette conférence et toutes ses divisions?')) return

    try {
      await deleteConference.mutateAsync({ id: confId, leagueId: selectedLeagueId })
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleDeleteDivision = async (divId: string) => {
    if (!selectedLeagueId) return
    if (!confirm('Supprimer cette division?')) return

    try {
      await deleteDivision.mutateAsync({ id: divId, leagueId: selectedLeagueId })
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleMoveTeam = async (teamId: string, divisionName: string, conferenceName: string) => {
    if (!selectedLeagueId) return

    try {
      await updateTeamDivision.mutateAsync({
        teamId,
        leagueId: selectedLeagueId,
        division: divisionName,
        conference: conferenceName,
      })
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  if (isLoading) {
    return <div className="text-slate-400">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Conférences et Divisions</h2>
          <p className="text-sm text-slate-400">
            Gérez les conférences, divisions et assignations d'équipes
          </p>
        </div>
        <button
          onClick={handleInitializeNHL}
          disabled={initializeNHL.isPending}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {initializeNHL.isPending ? 'Initialisation...' : 'Initialiser Divisions NHL'}
        </button>
      </div>

      {/* Add Conference Button */}
      {!isAddingConference && (
        <button
          onClick={() => setIsAddingConference(true)}
          className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
        >
          + Ajouter une Conférence
        </button>
      )}

      {/* Add Conference Form */}
      {isAddingConference && (
        <div className="rounded-lg border border-slate-600 bg-slate-800 p-4">
          <h3 className="mb-2 text-sm font-semibold text-white">Nouvelle Conférence</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newConferenceName}
              onChange={(e) => setNewConferenceName(e.target.value)}
              placeholder="Nom de la conférence"
              className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
            />
            <button
              onClick={handleSaveConference}
              disabled={!newConferenceName.trim()}
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500 disabled:opacity-50"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => {
                setIsAddingConference(false)
                setNewConferenceName('')
              }}
              className="rounded-md bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-500"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Conferences and Divisions */}
      <div className="space-y-4">
        {conferencesData?.map((conference) => (
          <div key={conference.id} className="rounded-lg border border-slate-600 bg-slate-800">
            {/* Conference Header */}
            <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/80 p-4">
              <h3 className="text-lg font-semibold text-white">{conference.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingConference(conference)
                    setNewConferenceName(conference.name)
                    setIsAddingConference(true)
                  }}
                  className="rounded bg-slate-600 px-3 py-1 text-xs text-white hover:bg-slate-500"
                >
                  Renommer
                </button>
                <button
                  onClick={() => handleDeleteConference(conference.id)}
                  className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setIsAddingDivision(conference.id)}
                  className="rounded bg-sky-600 px-3 py-1 text-xs text-white hover:bg-sky-500"
                >
                  + Division
                </button>
              </div>
            </div>

            {/* Add Division Form */}
            {isAddingDivision === conference.id && (
              <div className="border-b border-slate-700 bg-slate-750 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    placeholder="Nom de la division"
                    className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={() => handleSaveDivision(conference.id)}
                    disabled={!newDivisionName.trim()}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingDivision(null)
                      setNewDivisionName('')
                    }}
                    className="rounded-md bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-500"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Divisions */}
            <div className="divide-y divide-slate-700">
              {conference.divisions.map((division) => {
                const divisionTeams = teams?.filter(
                  (t) => t.division === division.name && t.conference === conference.name
                )

                return (
                  <div key={division.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium text-slate-200">{division.name}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingDivision(division)
                            setNewDivisionName(division.name)
                            setIsAddingDivision(conference.id)
                          }}
                          className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-500"
                        >
                          Renommer
                        </button>
                        <button
                          onClick={() => handleDeleteDivision(division.id)}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>

                    {/* Teams in Division */}
                    <div className="space-y-2">
                      {divisionTeams && divisionTeams.length > 0 ? (
                        divisionTeams.map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between rounded bg-slate-700/50 px-3 py-2"
                          >
                            <span className="text-sm text-slate-300">
                              {team.city} {team.name}
                            </span>
                            <select
                              value={`${team.conference}|${team.division}`}
                              onChange={(e) => {
                                const [conf, div] = e.target.value.split('|')
                                handleMoveTeam(team.id, div, conf)
                              }}
                              className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white"
                            >
                              {conferencesData?.map((conf) =>
                                conf.divisions.map((div) => (
                                  <option key={`${conf.id}-${div.id}`} value={`${conf.name}|${div.name}`}>
                                    {conf.name} - {div.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Aucune équipe dans cette division</p>
                      )}
                    </div>

                    {/* Unassigned Teams in this Conference */}
                    {division === conference.divisions[conference.divisions.length - 1] && (
                      <>
                        {teams?.filter(
                          (t) =>
                            t.conference === conference.name &&
                            !conference.divisions.some((d) => d.name === t.division)
                        ).length! > 0 && (
                          <div className="mt-4 rounded border border-amber-600/30 bg-amber-900/10 p-3">
                            <h5 className="mb-2 text-xs font-semibold text-amber-400">
                              Équipes non assignées dans {conference.name}
                            </h5>
                            <div className="space-y-2">
                              {teams
                                ?.filter(
                                  (t) =>
                                    t.conference === conference.name &&
                                    !conference.divisions.some((d) => d.name === t.division)
                                )
                                .map((team) => (
                                  <div
                                    key={team.id}
                                    className="flex items-center justify-between rounded bg-slate-700/50 px-3 py-2"
                                  >
                                    <span className="text-sm text-slate-300">
                                      {team.city} {team.name}
                                    </span>
                                    <select
                                      value={`${team.conference}|${team.division || ''}`}
                                      onChange={(e) => {
                                        const [conf, div] = e.target.value.split('|')
                                        handleMoveTeam(team.id, div, conf)
                                      }}
                                      className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white"
                                    >
                                      <option value="">Sélectionner division...</option>
                                      {conferencesData?.map((conf) =>
                                        conf.divisions.map((div) => (
                                          <option
                                            key={`${conf.id}-${div.id}`}
                                            value={`${conf.name}|${div.name}`}
                                          >
                                            {conf.name} - {div.name}
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Completely Unassigned Teams */}
      {teams?.filter((t) => !t.conference || !t.division).length! > 0 && (
        <div className="rounded-lg border border-red-600/30 bg-red-900/10 p-4">
          <h3 className="mb-3 text-lg font-semibold text-red-400">
            Équipes sans conférence/division
          </h3>
          <div className="space-y-2">
            {teams
              ?.filter((t) => !t.conference || !t.division)
              .map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between rounded bg-slate-700/50 px-3 py-2"
                >
                  <span className="text-sm text-slate-300">
                    {team.city} {team.name}
                  </span>
                  <select
                    value=""
                    onChange={(e) => {
                      const [conf, div] = e.target.value.split('|')
                      handleMoveTeam(team.id, div, conf)
                    }}
                    className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white"
                  >
                    <option value="">Assigner à une division...</option>
                    {conferencesData?.map((conf) =>
                      conf.divisions.map((div) => (
                        <option key={`${conf.id}-${div.id}`} value={`${conf.name}|${div.name}`}>
                          {conf.name} - {div.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
