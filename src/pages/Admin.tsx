import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAiJobsQuery } from '../api/aiJobs'
import {
  useLeagueMembersQuery,
  useUpdateLeagueMember,
  useDeleteLeagueMember,
  useInviteLeagueMember,
  useLeagueUserSearch,
  type UserSearchResult,
} from '../api/leagueMembers'
import { useLeagueStore } from '../state/useLeagueStore'
import { supabase } from '../api/supabaseClient'
import type { LeagueMember } from '../types'
import { useLeagueTeamsQuery, useCreateTeam, useUpdateTeam, useDeleteTeam, useAssignTeamMember, useUnassignTeamMember, useTeamAssignmentsQuery } from '../api/teams'

export const AdminPage = () => {
  const { t, i18n } = useTranslation()
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [i18n.language],
  )
  const formatDateTime = (iso: string) => dateFormatter.format(new Date(iso))

  const navigate = useNavigate()
  const { selectedLeagueId } = useLeagueStore()
  const { data: jobs = [], isFetching, refetch, error } = useAiJobsQuery(selectedLeagueId)
  const [actionJobId, setActionJobId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ message?: string; error?: string }>({})
  const [memberFeedback, setMemberFeedback] = useState<{ message?: string; error?: string }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [inviteRole, setInviteRole] = useState<LeagueMember['role']>('gm')

  const groupedJobs = useMemo(() => {
    const byStatus = new Map<string, number>()
    jobs.forEach((job) => {
      byStatus.set(job.status, (byStatus.get(job.status) ?? 0) + 1)
    })
    return byStatus
  }, [jobs])

  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useLeagueTeamsQuery(selectedLeagueId)
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()
  const assignTeamMember = useAssignTeamMember()
  const unassignTeamMember = useUnassignTeamMember()
  const { data: teamAssignments = [] } = useTeamAssignmentsQuery(selectedLeagueId)

  const [teamName, setTeamName] = useState('')
  const [teamCity, setTeamCity] = useState('')
  const [teamAbbrev, setTeamAbbrev] = useState('')
  const [teamLevel, setTeamLevel] = useState<'NHL' | 'AHL'>('NHL')
  const [teamFeedback, setTeamFeedback] = useState<{ message?: string; error?: string }>({})
  const [isSeeding, setIsSeeding] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [assigningTeamId, setAssigningTeamId] = useState<string | null>(null)

  const handleRetry = async (jobId: string) => {
    setActionJobId(jobId)
    setFeedback({})
    const { error: updateError } = await supabase
      .from('ai_jobs')
      .update({
        status: 'queued',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    setActionJobId(null)

    if (updateError) {
      setFeedback({ error: updateError.message })
      return
    }

    setFeedback({ message: t('admin.feedback.jobRequeued') })
    refetch()
  }

  const {
    data: members = [],
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useLeagueMembersQuery(selectedLeagueId)

  const updateMember = useUpdateLeagueMember()
  const removeMember = useDeleteLeagueMember()
  const inviteMember = useInviteLeagueMember()
  const { data: searchResults = [], isLoading: searchLoading } = useLeagueUserSearch(selectedLeagueId, searchTerm)

  const handleChangeMemberStatus = async (memberId: string, status: LeagueMember['status']) => {
    if (!selectedLeagueId) return
    setMemberFeedback({})
    try {
      await updateMember.mutateAsync({ memberId, leagueId: selectedLeagueId, status })
      setMemberFeedback({ message: t('admin.members.feedback.statusUpdated') })
    } catch (mutationError: any) {
      setMemberFeedback({
        error: mutationError.message ?? t('admin.members.feedback.statusError'),
      })
    }
  }

  const handleChangeMemberRole = async (memberId: string, role: LeagueMember['role']) => {
    if (!selectedLeagueId) return
    setMemberFeedback({})
    try {
      await updateMember.mutateAsync({ memberId, leagueId: selectedLeagueId, role })
      setMemberFeedback({ message: t('admin.members.feedback.roleUpdated') })
    } catch (mutationError: any) {
      setMemberFeedback({
        error: mutationError.message ?? t('admin.members.feedback.roleError'),
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLeagueId) return
    setMemberFeedback({})
    try {
      await removeMember.mutateAsync({ memberId, leagueId: selectedLeagueId })
      setMemberFeedback({ message: t('admin.members.feedback.memberRemoved') })
    } catch (mutationError: any) {
      setMemberFeedback({
        error: mutationError.message ?? t('admin.members.feedback.memberRemoveError'),
      })
    }
  }

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedLeagueId) return
    setMemberFeedback({})
    if (!selectedUser) {
      setMemberFeedback({ error: t('admin.members.feedback.inviteMissingUser') })
      return
    }
    try {
      await inviteMember.mutateAsync({ leagueId: selectedLeagueId, userId: selectedUser.id, role: inviteRole })
      setMemberFeedback({ message: t('admin.members.feedback.inviteSaved') })
      setSelectedUser(null)
      setSearchTerm('')
      setInviteRole('gm')
    } catch (mutationError: any) {
      setMemberFeedback({
        error: mutationError.message ?? t('admin.members.feedback.inviteError'),
      })
    }
  }

  const handleProcessJobs = async () => {
    if (!selectedLeagueId) {
      setFeedback({ error: t('admin.feedback.selectLeagueForJobs') })
      return
    }
    setFeedback({})
    setActionJobId('process')
    try {
      const { error: invokeError } = await supabase.functions.invoke('process-ai-jobs', {
        body: { leagueId: selectedLeagueId },
      })
      if (invokeError) {
        setFeedback({ error: invokeError.message ?? t('admin.feedback.jobProcessError') })
      } else {
        setFeedback({ message: t('admin.feedback.jobProcessSuccess') })
        refetch()
      }
    } catch (invokeErr: any) {
      setFeedback({ error: invokeErr.message ?? t('admin.feedback.jobProcessError') })
    } finally {
      setActionJobId(null)
    }
  }

  const handleSeedTeams = async () => {
    if (!selectedLeagueId) {
      setTeamFeedback({ error: t('admin.feedback.selectLeagueForTeams') })
      return
    }
    setIsSeeding(true)
    setTeamFeedback({})
    try {
      const { error: seedError } = await supabase.rpc('fn_seed_nhl_teams', {
        p_league_id: selectedLeagueId,
      })
      if (seedError) {
        throw seedError
      }
      setTeamFeedback({ message: t('admin.feedback.teamsImported') })
      refetchTeams()
    } catch (seedErr: any) {
      setTeamFeedback({ error: seedErr.message ?? t('admin.feedback.teamsImportError') })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCreateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedLeagueId) {
      setTeamFeedback({ error: t('admin.feedback.selectLeagueBeforeTeam') })
      return
    }
    if (!teamName.trim() || !teamCity.trim()) {
      setTeamFeedback({ error: t('admin.teams.form.errors.missingFields') })
      return
    }

    setTeamFeedback({})
    try {
      await createTeam.mutateAsync({
        leagueId: selectedLeagueId,
        name: teamName.trim(),
        city: teamCity.trim(),
        level: teamLevel,
        abbreviation: teamAbbrev.trim() || null,
      })
      setTeamFeedback({ message: t('admin.feedback.teamAdded') })
      setTeamName('')
      setTeamCity('')
      setTeamAbbrev('')
      refetchTeams()
    } catch (mutationError: any) {
      setTeamFeedback({ error: mutationError.message ?? t('admin.feedback.teamCreateError') })
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('admin.title')}</h2>
          <p className="text-sm text-slate-400">{t('admin.description')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/roster-management')}
            className="rounded-md border border-sky-600 px-3 py-1 text-xs font-semibold text-sky-200 hover:border-sky-500"
            title={t('admin.actions.rosterManagementTooltip.enabled', 'Manage player rosters')}
          >
            {t('admin.actions.rosterManagement', 'Roster Management')}
          </button>
          <button
            onClick={() => navigate(`/league/${selectedLeagueId}/rules`)}
            disabled={!selectedLeagueId}
            className="rounded-md border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-200 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !selectedLeagueId
                ? t('admin.actions.leagueRulesTooltip.disabled')
                : t('admin.actions.leagueRulesTooltip.enabled')
            }
          >
            {t('admin.actions.leagueRules')}
          </button>
          <button className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">
            {t('admin.actions.invite')}
          </button>
        </div>
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t('admin.members.title')}
            </h3>
            <p className="text-xs text-slate-500">{t('admin.members.description')}</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => refetchMembers()}
              className="rounded-md border border-slate-700 px-3 py-1 font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-60"
              disabled={membersLoading}
            >
              {t('admin.members.refresh')}
            </button>
          </div>
        </div>

        {!selectedLeagueId ? (
          <p className="mt-3 text-sm text-slate-400">{t('admin.members.noLeague')}</p>
        ) : membersLoading ? (
          <p className="mt-3 text-sm text-slate-500">{t('admin.members.loading')}</p>
        ) : (
          <>
            {memberFeedback.message && <p className="mt-3 text-xs text-emerald-400">{memberFeedback.message}</p>}
            {memberFeedback.error && <p className="mt-3 text-xs text-red-400">{memberFeedback.error}</p>}
            {membersError && (
              <p className="mt-3 text-xs text-red-400">
                {t('admin.members.errorPrefix', { message: membersError.message })}
              </p>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-auto text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.members.table.headers.member')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.members.table.headers.role')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.members.table.headers.status')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.members.table.headers.token')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.members.table.headers.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        {t('admin.members.table.empty')}
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-3 py-3 text-slate-200">
                          <p className="font-semibold text-slate-100">{member.displayName}</p>
                          <p className="text-[10px] uppercase text-slate-500">{member.email ?? member.userId}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          <select
                            value={member.role}
                            onChange={(event) =>
                              handleChangeMemberRole(member.id, event.target.value as LeagueMember['role'])
                            }
                            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                          >
                            <option value="commissioner">{t('admin.members.roles.commissioner')}</option>
                            <option value="gm">{t('admin.members.roles.gm')}</option>
                            <option value="assistant">{t('admin.members.roles.assistant')}</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          <select
                            value={member.status}
                            onChange={(event) =>
                              handleChangeMemberStatus(member.id, event.target.value as LeagueMember['status'])
                            }
                            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                          >
                            <option value="pending">{t('admin.members.statuses.pending')}</option>
                            <option value="active">{t('admin.members.statuses.active')}</option>
                            <option value="inactive">{t('admin.members.statuses.inactive')}</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                          {member.invitationToken.slice(0, 8)}…{member.invitationToken.slice(-4)}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(member.invitationToken)}
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-slate-500"
                            >
                              {t('admin.members.table.copyToken')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="rounded border border-red-600 px-2 py-1 text-[11px] font-semibold text-red-300 hover:border-red-400"
                            >
                              {t('admin.members.table.remove')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form className="mt-6 space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4" onSubmit={handleInvite}>
              <p className="text-sm font-semibold text-slate-200">{t('admin.members.form.title')}</p>
              <p className="text-xs text-slate-500">{t('admin.members.form.description')}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="invite-user" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('admin.members.form.searchLabel')}
                  </label>
                  <div className="relative">
                    <input
                      id="invite-user"
                      value={selectedUser ? `${selectedUser.displayName} (${selectedUser.email})` : searchTerm}
                      onChange={(event) => {
                        setSelectedUser(null)
                        setSearchTerm(event.target.value)
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                      placeholder={t('admin.members.form.searchPlaceholder')}
                      autoComplete="off"
                    />
                    {isSearchFocused && !selectedUser && searchTerm.trim().length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-lg">
                        {searchLoading ? (
                          <p className="px-3 py-2 text-[11px] text-slate-400">{t('admin.members.form.searching')}</p>
                        ) : searchResults.length === 0 ? (
                          <p className="px-3 py-2 text-[11px] text-slate-400">{t('admin.members.form.noResults')}</p>
                        ) : (
                          <ul className="max-h-48 overflow-y-auto text-xs text-slate-100">
                            {searchResults.map((user) => (
                              <li key={user.id}>
                                <button
                                  type="button"
                                  className="flex w-full flex-col items-start border-b border-slate-800 px-3 py-2 text-left hover:bg-slate-800"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setSearchTerm('')
                                    setIsSearchFocused(false)
                                  }}
                                >
                                  <span className="font-semibold">{user.displayName}</span>
                                  <span className="text-[10px] text-slate-400">{user.email}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                {selectedUser && (
                  <button
                    type="button"
                    className="self-start text-[10px] text-slate-400 hover:text-slate-200"
                    onClick={() => {
                      setSelectedUser(null)
                      setSearchTerm('')
                    }}
                  >
                    {t('admin.members.form.clearSelection')}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="invite-role" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.members.form.roleLabel')}
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as LeagueMember['role'])}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                >
                  <option value="gm">{t('admin.members.roles.gm')}</option>
                  <option value="assistant">{t('admin.members.roles.assistant')}</option>
                  <option value="commissioner">{t('admin.members.roles.commissioner')}</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
              disabled={inviteMember.isPending}
            >
              {inviteMember.isPending ? t('admin.members.form.submitting') : t('admin.members.form.submit')}
            </button>
            </form>
          </>
        )}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('admin.teams.title')}</h3>
        {!selectedLeagueId ? (
          <p className="mt-2 text-sm text-slate-400">{t('admin.teams.noLeague')}</p>
        ) : (
          <div className="mt-3 space-y-4">
            <form className="grid gap-3 md:grid-cols-4" onSubmit={handleCreateTeam}>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.teams.form.nameLabel')}
                </label>
                <input
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  placeholder={t('admin.teams.form.namePlaceholder')}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.teams.form.cityLabel')}
                </label>
                <input
                  value={teamCity}
                  onChange={(event) => setTeamCity(event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  placeholder={t('admin.teams.form.cityPlaceholder')}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.teams.form.levelLabel')}
                </label>
                <select
                  value={teamLevel}
                  onChange={(event) => setTeamLevel(event.target.value as 'NHL' | 'AHL')}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                >
                  <option value="NHL">NHL</option>
                  <option value="AHL">AHL</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.teams.form.abbreviationLabel')}
                </label>
                <input
                  value={teamAbbrev}
                  onChange={(event) => setTeamAbbrev(event.target.value.toUpperCase())}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  placeholder={t('admin.teams.form.abbreviationPlaceholder')}
                  maxLength={5}
                />
              </div>
              <div className="md:col-span-4 flex items-center justify-end gap-3 text-xs">
                {teamFeedback.error && <span className="text-red-400">{teamFeedback.error}</span>}
                {teamFeedback.message && <span className="text-emerald-400">{teamFeedback.message}</span>}
                <button
                  type="submit"
                  className="rounded-md bg-sky-500 px-3 py-2 font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                  disabled={createTeam.isPending}
                >
                  {createTeam.isPending ? t('admin.teams.form.submitting') : t('admin.teams.form.submit')}
                </button>
              </div>
            </form>

            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={handleSeedTeams}
                className="rounded-md border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-60"
                disabled={isSeeding}
              >
                {isSeeding ? t('admin.teams.seed.pending') : t('admin.teams.seed.button')}
              </button>
            </div>

            {teamsLoading ? (
              <p className="text-xs text-slate-400">{t('admin.teams.loading')}</p>
            ) : teams.length === 0 ? (
              <p className="text-xs text-slate-400">{t('admin.teams.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-xs">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                        {t('admin.teams.table.headers.name')}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                        {t('admin.teams.table.headers.city')}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                        {t('admin.teams.table.headers.level')}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                        {t('admin.teams.table.headers.assignedGM', 'Assigned GM')}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                        {t('admin.teams.table.headers.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {teams.map((team) => {
                      const assignment = teamAssignments.find(a => a.teamId === team.id)
                      console.log('[Admin] Team:', team.name, 'ID:', team.id, 'Assignment:', assignment)
                      return (
                      <tr key={team.id}>
                        <td className="px-3 py-2 text-slate-100">{team.name}</td>
                        <td className="px-3 py-2 text-slate-300">{team.city}</td>
                        <td className="px-3 py-2 text-slate-300">{team.level}</td>
                        <td className="px-3 py-2">
                          {assignment ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-200">{assignment.member.displayName}</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(t('admin.teams.confirmUnassign', { member: assignment.member.displayName }))) {
                                    try {
                                      await unassignTeamMember.mutateAsync({
                                        teamId: team.id,
                                        memberId: assignment.memberId,
                                        leagueId: selectedLeagueId!,
                                      })
                                      setTeamFeedback({ message: t('admin.teams.unassigned') })
                                    } catch (err: any) {
                                      setTeamFeedback({ error: err.message })
                                    }
                                  }
                                }}
                                className="rounded border border-red-600 px-1 py-0.5 text-[10px] font-semibold text-red-300 hover:border-red-400"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAssigningTeamId(team.id)}
                              className="rounded border border-sky-600 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:border-sky-400"
                            >
                              {t('admin.teams.assignButton')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTeamId(team.id)}
                              className="rounded border border-slate-600 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-400"
                            >
                              {t('admin.teams.table.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(t('admin.teams.confirmDelete', { team: team.name }))) {
                                  try {
                                    await deleteTeam.mutateAsync({ teamId: team.id, leagueId: selectedLeagueId! })
                                    setTeamFeedback({ message: t('admin.feedback.teamDeleted') })
                                  } catch (err: any) {
                                    setTeamFeedback({ error: err.message })
                                  }
                                }
                              }}
                              className="rounded border border-red-600 px-2 py-1 text-[11px] font-semibold text-red-300 hover:border-red-400"
                            >
                              {t('admin.teams.table.delete')}
                            </button>
                          </div>

                          {/* Modal d'assignation */}
                          {assigningTeamId === team.id && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                              <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
                                <h3 className="mb-4 text-lg font-semibold text-slate-100">
                                  {t('admin.teams.assignModal.title', { team: team.name })}
                                </h3>
                                <div className="space-y-3">
                                  {members
                                    .filter((m) => m.role === 'gm' || m.role === 'assistant' || m.role === 'commissioner')
                                    .map((member) => (
                                      <button
                                        key={member.id}
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await assignTeamMember.mutateAsync({
                                              teamId: team.id,
                                              memberId: member.id,
                                              role: member.role === 'gm' ? 'manager' : 'assistant',
                                              leagueId: selectedLeagueId!,
                                            })
                                            setTeamFeedback({
                                              message: t('admin.teams.assignModal.assigned', {
                                                member: member.displayName,
                                                team: team.name,
                                              }),
                                            })
                                            setAssigningTeamId(null)
                                          } catch (err: any) {
                                            setTeamFeedback({ error: err.message })
                                          }
                                        }}
                                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-700"
                                      >
                                        <p className="font-semibold">{member.displayName}</p>
                                        <p className="text-xs text-slate-400">{member.email}</p>
                                      </button>
                                    ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAssigningTeamId(null)}
                                  className="mt-4 w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
                                >
                                  {t('admin.teams.assignModal.cancel')}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Edit modal */}
                          {editingTeamId === team.id && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                              <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6">
                                <h3 className="mb-4 text-lg font-semibold text-slate-100">
                                  {t('admin.teams.editModal.title', { team: team.name })}
                                </h3>
                                <form
                                  className="space-y-3"
                                  onSubmit={async (e) => {
                                    e.preventDefault()
                                    const formData = new FormData(e.currentTarget)
                                    try {
                                      await updateTeam.mutateAsync({
                                        teamId: team.id,
                                        leagueId: selectedLeagueId!,
                                        name: formData.get('name') as string,
                                        city: formData.get('city') as string,
                                        level: formData.get('level') as 'NHL' | 'AHL',
                                        abbreviation: formData.get('abbreviation') as string,
                                      })
                                      setTeamFeedback({ message: t('admin.feedback.teamUpdated') })
                                      setEditingTeamId(null)
                                    } catch (err: any) {
                                      setTeamFeedback({ error: err.message })
                                    }
                                  }}
                                >
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                                      {t('admin.teams.form.nameLabel')}
                                    </label>
                                    <input
                                      name="name"
                                      defaultValue={team.name}
                                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                                      {t('admin.teams.form.cityLabel')}
                                    </label>
                                    <input
                                      name="city"
                                      defaultValue={team.city}
                                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                                      {t('admin.teams.form.levelLabel')}
                                    </label>
                                    <select
                                      name="level"
                                      defaultValue={team.level}
                                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                                    >
                                      <option value="NHL">NHL</option>
                                      <option value="AHL">AHL</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                                      {t('admin.teams.form.abbreviationLabel')}
                                    </label>
                                    <input
                                      name="abbreviation"
                                      defaultValue=""
                                      maxLength={5}
                                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      className="flex-1 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
                                    >
                                      {t('admin.teams.editModal.save')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTeamId(null)}
                                      className="flex-1 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
                                    >
                                      {t('admin.teams.editModal.cancel')}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {teamsError && (
              <p className="text-xs text-red-400">{t('admin.teams.errorPrefix', { message: teamsError.message })}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t('admin.automation.title')}
            </h3>
            <p className="text-xs text-slate-500">{t('admin.automation.description')}</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500"
            disabled={isFetching}
          >
            {t('admin.automation.refresh')}
          </button>
          <button
            type="button"
            onClick={handleProcessJobs}
            className="rounded-md border border-sky-600 px-3 py-1 text-xs font-semibold text-sky-200 hover:border-sky-400 disabled:opacity-60"
            disabled={actionJobId === 'process'}
          >
            {actionJobId === 'process' ? t('admin.automation.processing') : t('admin.automation.process')}
          </button>
        </div>

        {!selectedLeagueId ? (
          <p className="text-sm text-slate-400">{t('admin.automation.noLeague')}</p>
        ) : (
          <>
            <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-4">
              {['queued', 'running', 'failed', 'completed'].map((status) => (
                <div key={status} className="rounded border border-slate-800 bg-slate-950/80 p-3">
                  <p className="uppercase tracking-wide text-slate-500">
                    {t(`admin.automation.statusLabels.${status}`)}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-100">
                    {groupedJobs.get(status) ?? 0}
                  </p>
                </div>
              ))}
            </div>

            {feedback.message && <p className="text-xs text-emerald-400">{feedback.message}</p>}
            {feedback.error && <p className="text-xs text-red-400">{feedback.error}</p>}

            {error && (
              <p className="text-xs text-red-400">{t('admin.automation.errorPrefix', { message: error.message })}</p>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-auto text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.automation.table.headers.type')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.automation.table.headers.status')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.automation.table.headers.created')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.automation.table.headers.updated')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                      {t('admin.automation.table.headers.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        {t('admin.automation.table.empty')}
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-3 py-3 text-slate-200">{job.type}</td>
                        <td className="px-3 py-3 text-slate-300 capitalize">
                          {t(`admin.automation.statusLabels.${job.status}`)}
                        </td>
                        <td className="px-3 py-3 text-slate-400">{formatDateTime(job.createdAt)}</td>
                        <td className="px-3 py-3 text-slate-400">
                          {job.updatedAt ? formatDateTime(job.updatedAt) : '—'}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {job.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => handleRetry(job.id)}
                              disabled={actionJobId === job.id}
                              className="rounded border border-red-600 px-2 py-1 text-[11px] font-semibold text-red-300 hover:border-red-400 hover:text-red-200 disabled:opacity-60"
                            >
                              {actionJobId === job.id
                                ? t('admin.automation.table.retrying')
                                : t('admin.automation.table.retry')}
                            </button>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
