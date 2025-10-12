import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLeagueStore } from '../state/useLeagueStore'
import { useMyAssignedTeamsQuery } from '../api/teams'
import { useRosterQuery, type RosterEntry } from '../api/roster'
import { PlayerAvatar } from '../components/common/PlayerAvatar'
import { useLineupQuery, useSaveLineupMutation, type LineupData } from '../api/lineup'

interface ForwardLine {
  lw: string | null
  c: string | null
  rw: string | null
}

interface DefensePair {
  ld: string | null
  rd: string | null
}

interface Lineup {
  forwards: {
    line1: ForwardLine
    line2: ForwardLine
    line3: ForwardLine
    line4: ForwardLine
  }
  defense: {
    pair1: DefensePair
    pair2: DefensePair
    pair3: DefensePair
  }
  goalies: {
    starter: string | null
    backup: string | null
  }
  powerPlay: {
    pp1: string[]
    pp2: string[]
  }
  penaltyKill: {
    pk1: string[]
    pk2: string[]
  }
}

type SlotId = string

export const LineupPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedLeagueId } = useLeagueStore()
  const { data: teams = [] } = useMyAssignedTeamsQuery(selectedLeagueId)
  const nhlTeam = useMemo(() => teams.find((team) => team.level === 'NHL'), [teams])
  const { data: rosterEntries = [] } = useRosterQuery(selectedLeagueId)

  // Load saved lineup from database
  const { data: savedLineup } = useLineupQuery(selectedLeagueId, nhlTeam?.id || null)
  const saveLineupMutation = useSaveLineupMutation()

  const [lineup, setLineup] = useState<Lineup>({
    forwards: {
      line1: { lw: null, c: null, rw: null },
      line2: { lw: null, c: null, rw: null },
      line3: { lw: null, c: null, rw: null },
      line4: { lw: null, c: null, rw: null },
    },
    defense: {
      pair1: { ld: null, rd: null },
      pair2: { ld: null, rd: null },
      pair3: { ld: null, rd: null },
    },
    goalies: {
      starter: null,
      backup: null,
    },
    powerPlay: {
      pp1: [],
      pp2: [],
    },
    penaltyKill: {
      pk1: [],
      pk2: [],
    },
  })

  const [activeTab, setActiveTab] = useState<'lines' | 'defense' | 'goalies' | 'special'>('lines')
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotId | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  // Load saved lineup when it's available
  useEffect(() => {
    if (savedLineup) {
      setLineup({
        forwards: {
          line1: { lw: savedLineup.line1_lw, c: savedLineup.line1_c, rw: savedLineup.line1_rw },
          line2: { lw: savedLineup.line2_lw, c: savedLineup.line2_c, rw: savedLineup.line2_rw },
          line3: { lw: savedLineup.line3_lw, c: savedLineup.line3_c, rw: savedLineup.line3_rw },
          line4: { lw: savedLineup.line4_lw, c: savedLineup.line4_c, rw: savedLineup.line4_rw },
        },
        defense: {
          pair1: { ld: savedLineup.pair1_ld, rd: savedLineup.pair1_rd },
          pair2: { ld: savedLineup.pair2_ld, rd: savedLineup.pair2_rd },
          pair3: { ld: savedLineup.pair3_ld, rd: savedLineup.pair3_rd },
        },
        goalies: {
          starter: savedLineup.starter,
          backup: savedLineup.backup,
        },
        powerPlay: {
          pp1: savedLineup.pp1 || [],
          pp2: savedLineup.pp2 || [],
        },
        penaltyKill: {
          pk1: savedLineup.pk1 || [],
          pk2: savedLineup.pk2 || [],
        },
      })
    }
  }, [savedLineup])

  const nhlRoster = useMemo(() => {
    if (!nhlTeam) return []
    return rosterEntries.filter((entry) => entry.teamId === nhlTeam.id)
  }, [nhlTeam, rosterEntries])

  const forwards = useMemo(
    () => nhlRoster.filter((e) => ['LW', 'C', 'RW'].includes(e.player.position)),
    [nhlRoster]
  )
  const defensemen = useMemo(
    () => nhlRoster.filter((e) => e.player.position === 'D'),
    [nhlRoster]
  )
  const goalies = useMemo(
    () => nhlRoster.filter((e) => e.player.position === 'G'),
    [nhlRoster]
  )

  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    Object.values(lineup.forwards).forEach(line => {
      if (line.lw) ids.add(line.lw)
      if (line.c) ids.add(line.c)
      if (line.rw) ids.add(line.rw)
    })
    Object.values(lineup.defense).forEach(pair => {
      if (pair.ld) ids.add(pair.ld)
      if (pair.rd) ids.add(pair.rd)
    })
    if (lineup.goalies.starter) ids.add(lineup.goalies.starter)
    if (lineup.goalies.backup) ids.add(lineup.goalies.backup)
    return ids
  }, [lineup])

  const availableForwards = useMemo(
    () => forwards.filter(p => !assignedPlayerIds.has(p.player.id)),
    [forwards, assignedPlayerIds]
  )
  const availableDefensemen = useMemo(
    () => defensemen.filter(p => !assignedPlayerIds.has(p.player.id)),
    [defensemen, assignedPlayerIds]
  )
  const availableGoalies = useMemo(
    () => goalies.filter(p => !assignedPlayerIds.has(p.player.id)),
    [goalies, assignedPlayerIds]
  )

  const getPlayerById = (id: string | null): RosterEntry | undefined => {
    if (!id) return undefined
    return nhlRoster.find((e) => e.player.id === id)
  }

  const assignPlayerToSlot = (slotId: SlotId, playerId: string) => {
    const newLineup = { ...lineup }

    if (slotId.startsWith('line')) {
      const [lineKey, position] = slotId.split('.') as [keyof typeof lineup.forwards, keyof ForwardLine]
      newLineup.forwards[lineKey][position] = playerId
    } else if (slotId.startsWith('pair')) {
      const [pairKey, position] = slotId.split('.') as [keyof typeof lineup.defense, keyof DefensePair]
      newLineup.defense[pairKey][position] = playerId
    } else if (slotId === 'starter' || slotId === 'backup') {
      newLineup.goalies[slotId] = playerId
    } else if (slotId === 'pp1' || slotId === 'pp2') {
      if (!newLineup.powerPlay[slotId].includes(playerId) && newLineup.powerPlay[slotId].length < 5) {
        newLineup.powerPlay[slotId] = [...newLineup.powerPlay[slotId], playerId]
      }
    } else if (slotId === 'pk1' || slotId === 'pk2') {
      if (!newLineup.penaltyKill[slotId].includes(playerId) && newLineup.penaltyKill[slotId].length < 4) {
        newLineup.penaltyKill[slotId] = [...newLineup.penaltyKill[slotId], playerId]
      }
    }

    setLineup(newLineup)
    setSelectedSlot(null)
  }

  const handleDragStart = (playerId: string) => {
    setDraggedPlayer(playerId)
  }

  const handleDragEnd = () => {
    setDraggedPlayer(null)
  }

  const handleDrop = (slotId: SlotId) => {
    if (!draggedPlayer) return
    assignPlayerToSlot(slotId, draggedPlayer)
    setDraggedPlayer(null)
  }

  const handleRemovePlayer = (slotId: SlotId, playerId?: string) => {
    const newLineup = { ...lineup }

    if (slotId.startsWith('line')) {
      const [lineKey, position] = slotId.split('.') as [keyof typeof lineup.forwards, keyof ForwardLine]
      newLineup.forwards[lineKey][position] = null
    } else if (slotId.startsWith('pair')) {
      const [pairKey, position] = slotId.split('.') as [keyof typeof lineup.defense, keyof DefensePair]
      newLineup.defense[pairKey][position] = null
    } else if (slotId === 'starter' || slotId === 'backup') {
      newLineup.goalies[slotId] = null
    } else if ((slotId === 'pp1' || slotId === 'pp2') && playerId) {
      newLineup.powerPlay[slotId] = newLineup.powerPlay[slotId].filter(id => id !== playerId)
    } else if ((slotId === 'pk1' || slotId === 'pk2') && playerId) {
      newLineup.penaltyKill[slotId] = newLineup.penaltyKill[slotId].filter(id => id !== playerId)
    }

    setLineup(newLineup)
  }

  const handlePlayerClick = (playerId: string) => {
    if (selectedSlot) {
      // If a slot is already selected, assign player to that slot
      assignPlayerToSlot(selectedSlot, playerId)
      setSelectedPlayer(null)
    } else {
      // Otherwise, select this player and wait for slot click
      setSelectedPlayer(playerId)
    }
  }

  const handleSlotClick = (slotId: SlotId) => {
    if (selectedPlayer) {
      // If a player is already selected, assign to this slot
      assignPlayerToSlot(slotId, selectedPlayer)
      setSelectedPlayer(null)
    } else {
      // Otherwise, select this slot and wait for player click
      setSelectedSlot(slotId)
    }
  }

  const handleSaveLineup = async () => {
    if (!selectedLeagueId || !nhlTeam) {
      alert(t('lineup.alerts.noTeam'))
      return
    }

    const lineupData: LineupData = {
      league_id: selectedLeagueId,
      team_id: nhlTeam.id,

      // Forward lines
      line1_lw: lineup.forwards.line1.lw,
      line1_c: lineup.forwards.line1.c,
      line1_rw: lineup.forwards.line1.rw,
      line2_lw: lineup.forwards.line2.lw,
      line2_c: lineup.forwards.line2.c,
      line2_rw: lineup.forwards.line2.rw,
      line3_lw: lineup.forwards.line3.lw,
      line3_c: lineup.forwards.line3.c,
      line3_rw: lineup.forwards.line3.rw,
      line4_lw: lineup.forwards.line4.lw,
      line4_c: lineup.forwards.line4.c,
      line4_rw: lineup.forwards.line4.rw,

      // Defense pairs
      pair1_ld: lineup.defense.pair1.ld,
      pair1_rd: lineup.defense.pair1.rd,
      pair2_ld: lineup.defense.pair2.ld,
      pair2_rd: lineup.defense.pair2.rd,
      pair3_ld: lineup.defense.pair3.ld,
      pair3_rd: lineup.defense.pair3.rd,

      // Goalies
      starter: lineup.goalies.starter,
      backup: lineup.goalies.backup,

      // Special teams
      pp1: lineup.powerPlay.pp1,
      pp2: lineup.powerPlay.pp2,
      pk1: lineup.penaltyKill.pk1,
      pk2: lineup.penaltyKill.pk2,
    }

    try {
      await saveLineupMutation.mutateAsync(lineupData)
      alert(t('lineup.alerts.saveSuccess'))
    } catch (error) {
      console.error('Error saving lineup:', error)
      alert(t('lineup.alerts.saveError'))
    }
  }

  // Compact Player Card (2 columns: photo | name+position)
  const PlayerCard = ({ player }: { player: RosterEntry }) => {
    const isSelected = selectedPlayer === player.player.id

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(player.player.id)}
        onDragEnd={handleDragEnd}
        onClick={() => handlePlayerClick(player.player.id)}
        className={`flex items-center gap-2 rounded border-2 p-2 cursor-pointer transition-colors ${
          draggedPlayer === player.player.id ? 'opacity-50' : ''
        } ${
          isSelected
            ? 'border-sky-500 bg-sky-900/30'
            : 'border-slate-600 bg-slate-800 hover:border-sky-500'
        } ${selectedSlot ? 'hover:bg-sky-900/20' : ''}`}
      >
        <PlayerAvatar nhl_id={player.player.nhl_id} name={player.player.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">{player.player.name}</p>
          <p className="text-[10px] font-semibold text-slate-400">{player.player.position} • {player.player.overall_rating || '-'}</p>
        </div>
      </div>
    )
  }

  // Compact Slot Component
  const PlayerSlot = ({
    slotId,
    playerId,
    label,
  }: {
    slotId: SlotId
    playerId: string | null
    label: string
  }) => {
    const player = getPlayerById(playerId)
    const isSelected = selectedSlot === slotId

    return (
      <div
        onClick={() => handleSlotClick(slotId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(slotId)}
        className={`flex items-center gap-2 rounded border-2 p-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-sky-500 bg-sky-900/30'
            : player
            ? 'border-slate-600 bg-slate-800'
            : 'border-dashed border-slate-700 bg-slate-900/50 hover:border-sky-600'
        } ${selectedPlayer ? 'hover:bg-sky-900/20' : ''}`}
      >
        {player ? (
          <>
            <PlayerAvatar nhl_id={player.player.nhl_id} name={player.player.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{player.player.name}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemovePlayer(slotId)
              }}
              className="flex-shrink-0 text-red-400 hover:text-red-300 text-xs"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] font-bold text-slate-500">{label}</span>
            </div>
            <p className="text-xs text-slate-500">{label}</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-4">
      <div className="mx-auto max-w-[1800px]">
        {/* Compact Header */}
        <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-100">{t('lineup.title', '🏒 Line Builder')}</h1>
            {nhlTeam && (
              <span className="text-sm text-sky-400">{nhlTeam.name}</span>
            )}
            {selectedSlot && (
              <span className="rounded bg-sky-600 px-2 py-1 text-xs font-semibold text-white">
                {t('lineup.prompts.selectPlayer', 'Click a player to assign')}
              </span>
            )}
            {selectedPlayer && (
              <span className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                {t('lineup.prompts.selectSlot', 'Click a position to assign')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/roster')}
              className="rounded border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              {t('lineup.buttons.back', '← Back')}
            </button>
            <button
              onClick={handleSaveLineup}
              disabled={saveLineupMutation.isPending}
              className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLineupMutation.isPending
                ? t('lineup.buttons.saving', '⏳ Saving...')
                : t('lineup.buttons.save', '💾 Save')}
            </button>
          </div>
        </div>

        {selectedLeagueId && nhlTeam && (
          <div className="grid grid-cols-5 gap-4">
            {/* Sidebar - Taller and more compact */}
            <div className="space-y-3">
              {/* Tabs as compact buttons */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-700 bg-slate-800/50 p-1">
                <button
                  onClick={() => setActiveTab('lines')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeTab === 'lines' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('lineup.tabs.lines', 'Forwards')}
                </button>
                <button
                  onClick={() => setActiveTab('defense')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeTab === 'defense' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('lineup.tabs.defense', 'Defense')}
                </button>
                <button
                  onClick={() => setActiveTab('goalies')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeTab === 'goalies' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('lineup.tabs.goalies', 'Goalies')}
                </button>
                <button
                  onClick={() => setActiveTab('special')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeTab === 'special' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('lineup.tabs.special', 'Special teams')}
                </button>
              </div>

              {/* Available Players - TALLER */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                <h3 className="mb-2 text-xs font-bold text-slate-300">
                  {activeTab === 'lines' && t('lineup.available.forwards', { count: availableForwards.length, defaultValue: `Forwards (${availableForwards.length})` })}
                  {activeTab === 'defense' && t('lineup.available.defense', { count: availableDefensemen.length, defaultValue: `Defensemen (${availableDefensemen.length})` })}
                  {activeTab === 'goalies' && t('lineup.available.goalies', { count: availableGoalies.length, defaultValue: `Goalies (${availableGoalies.length})` })}
                  {activeTab === 'special' && t('lineup.available.allPlayers', 'All players')}
                </h3>
                <div className="max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto pr-1">
                  {activeTab === 'lines' && availableForwards.map((player) => (
                    <PlayerCard key={player.player.id} player={player} />
                  ))}
                  {activeTab === 'defense' && availableDefensemen.map((player) => (
                    <PlayerCard key={player.player.id} player={player} />
                  ))}
                  {activeTab === 'goalies' && availableGoalies.map((player) => (
                    <PlayerCard key={player.player.id} player={player} />
                  ))}
                  {activeTab === 'special' && (
                    <>
                      {forwards.map((player) => (
                        <PlayerCard key={player.player.id} player={player} />
                      ))}
                      {defensemen.map((player) => (
                        <PlayerCard key={player.player.id} player={player} />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - 4 columns */}
            <div className="col-span-4">
              {/* Forward Lines */}
              {activeTab === 'lines' && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Line 1 */}
                  <div className="rounded-lg border border-green-600/30 bg-green-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-green-400">
                        {t('lineup.lines.line1.title', 'L1 - Top Line')}
                      </h3>
                      <span className="text-[10px] text-green-300">
                        {t('lineup.lines.line1.summary', '⏱️ 18-22 min • 🎯 Offensive')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="line1.lw" playerId={lineup.forwards.line1.lw} label="LW" />
                      <PlayerSlot slotId="line1.c" playerId={lineup.forwards.line1.c} label="C" />
                      <PlayerSlot slotId="line1.rw" playerId={lineup.forwards.line1.rw} label="RW" />
                    </div>
                  </div>

                  {/* Line 2 */}
                  <div className="rounded-lg border border-blue-600/30 bg-blue-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-blue-400">
                        {t('lineup.lines.line2.title', 'L2 - Scoring')}
                      </h3>
                      <span className="text-[10px] text-blue-300">
                        {t('lineup.lines.line2.summary', '⏱️ 15-18 min • 🎯 Secondary attack')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="line2.lw" playerId={lineup.forwards.line2.lw} label="LW" />
                      <PlayerSlot slotId="line2.c" playerId={lineup.forwards.line2.c} label="C" />
                      <PlayerSlot slotId="line2.rw" playerId={lineup.forwards.line2.rw} label="RW" />
                    </div>
                  </div>

                  {/* Line 3 */}
                  <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-yellow-400">
                        {t('lineup.lines.line3.title', 'L3 - Checking')}
                      </h3>
                      <span className="text-[10px] text-yellow-300">
                        {t('lineup.lines.line3.summary', '⏱️ 12-15 min • 🎯 Defensive')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="line3.lw" playerId={lineup.forwards.line3.lw} label="LW" />
                      <PlayerSlot slotId="line3.c" playerId={lineup.forwards.line3.c} label="C" />
                      <PlayerSlot slotId="line3.rw" playerId={lineup.forwards.line3.rw} label="RW" />
                    </div>
                  </div>

                  {/* Line 4 */}
                  <div className="rounded-lg border border-orange-600/30 bg-orange-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-orange-400">
                        {t('lineup.lines.line4.title', 'L4 - Energy')}
                      </h3>
                      <span className="text-[10px] text-orange-300">
                        {t('lineup.lines.line4.summary', '⏱️ 6-10 min • 🎯 PK')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="line4.lw" playerId={lineup.forwards.line4.lw} label="LW" />
                      <PlayerSlot slotId="line4.c" playerId={lineup.forwards.line4.c} label="C" />
                      <PlayerSlot slotId="line4.rw" playerId={lineup.forwards.line4.rw} label="RW" />
                    </div>
                  </div>
                </div>
              )}

              {/* Defense Pairings */}
              {activeTab === 'defense' && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Pair 1 */}
                  <div className="rounded-lg border border-green-600/30 bg-green-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-green-400">
                        {t('lineup.defense.pair1.title', 'P1 - Top Pair')}
                      </h3>
                      <span className="text-[10px] text-green-300">
                        {t('lineup.defense.pair1.summary', '⏱️ 22-26 min • 🎯 vs Top')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="pair1.ld" playerId={lineup.defense.pair1.ld} label="LD" />
                      <PlayerSlot slotId="pair1.rd" playerId={lineup.defense.pair1.rd} label="RD" />
                    </div>
                  </div>

                  {/* Pair 2 */}
                  <div className="rounded-lg border border-blue-600/30 bg-blue-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-blue-400">
                        {t('lineup.defense.pair2.title', 'P2')}
                      </h3>
                      <span className="text-[10px] text-blue-300">
                        {t('lineup.defense.pair2.summary', '⏱️ 18-22 min • 🎯 Support')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="pair2.ld" playerId={lineup.defense.pair2.ld} label="LD" />
                      <PlayerSlot slotId="pair2.rd" playerId={lineup.defense.pair2.rd} label="RD" />
                    </div>
                  </div>

                  {/* Pair 3 */}
                  <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-yellow-400">
                        {t('lineup.defense.pair3.title', 'P3')}
                      </h3>
                      <span className="text-[10px] text-yellow-300">
                        {t('lineup.defense.pair3.summary', '⏱️ 10-14 min • 🎯 Stability')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <PlayerSlot slotId="pair3.ld" playerId={lineup.defense.pair3.ld} label="LD" />
                      <PlayerSlot slotId="pair3.rd" playerId={lineup.defense.pair3.rd} label="RD" />
                    </div>
                  </div>
                </div>
              )}

              {/* Goalies */}
              {activeTab === 'goalies' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-green-600/30 bg-green-900/10 p-3">
                    <h3 className="mb-2 text-xs font-bold text-green-400">
                      {t('lineup.goalies.starter', 'Starter (60-65 games)')}
                    </h3>
                    <PlayerSlot slotId="starter" playerId={lineup.goalies.starter} label="G" />
                  </div>
                  <div className="rounded-lg border border-blue-600/30 bg-blue-900/10 p-3">
                    <h3 className="mb-2 text-xs font-bold text-blue-400">
                      {t('lineup.goalies.backup', 'Backup (15-20 games)')}
                    </h3>
                    <PlayerSlot slotId="backup" playerId={lineup.goalies.backup} label="G" />
                  </div>
                </div>
              )}

              {/* Special Teams */}
              {activeTab === 'special' && (
                <div className="grid grid-cols-2 gap-3">
                  {/* PP1 */}
                  <div className="rounded-lg border border-purple-600/30 bg-purple-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-purple-400">
                        {t('lineup.special.pp1.title', 'PP1 (5v4)')}
                      </h3>
                      <span className="text-[10px] text-purple-300">
                        {t('lineup.special.pp1.summary', {
                          count: lineup.powerPlay.pp1.length,
                          defaultValue: `⏱️ ~1:00/2:00 • ${lineup.powerPlay.pp1.length}/5`,
                        })}
                      </span>
                    </div>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('pp1')}
                      onClick={() => handleSlotClick('pp1')}
                      className={`min-h-[100px] rounded border-2 border-dashed border-purple-600/50 bg-purple-900/20 p-2 cursor-pointer transition-colors ${
                        selectedSlot === 'pp1' ? 'border-solid border-sky-500 bg-sky-900/30' : ''
                      } ${selectedPlayer ? 'hover:bg-sky-900/20' : ''}`}
                    >
                      {lineup.powerPlay.pp1.length === 0 ? (
                        <p className="text-center text-xs text-slate-500">
                          {t('lineup.special.emptyMax', { max: 5, defaultValue: 'Click or drag (max 5)' })}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {lineup.powerPlay.pp1.map((playerId) => {
                            const player = getPlayerById(playerId)
                            if (!player) return null
                            return (
                              <div key={playerId} className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 p-1">
                                <PlayerAvatar nhl_id={player.player.nhl_id} name={player.player.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-200 truncate">{player.player.name}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemovePlayer('pp1', playerId)
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PP2 */}
                  <div className="rounded-lg border border-purple-600/30 bg-purple-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-purple-400">
                        {t('lineup.special.pp2.title', 'PP2 (5v4)')}
                      </h3>
                      <span className="text-[10px] text-purple-300">
                        {t('lineup.special.pp2.summary', {
                          count: lineup.powerPlay.pp2.length,
                          defaultValue: `${lineup.powerPlay.pp2.length}/5`,
                        })}
                      </span>
                    </div>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('pp2')}
                      onClick={() => handleSlotClick('pp2')}
                      className={`min-h-[100px] rounded border-2 border-dashed border-purple-600/50 bg-purple-900/20 p-2 cursor-pointer transition-colors ${
                        selectedSlot === 'pp2' ? 'border-solid border-sky-500 bg-sky-900/30' : ''
                      } ${selectedPlayer ? 'hover:bg-sky-900/20' : ''}`}
                    >
                      {lineup.powerPlay.pp2.length === 0 ? (
                        <p className="text-center text-xs text-slate-500">
                          {t('lineup.special.emptyMax', { max: 5, defaultValue: 'Click or drag (max 5)' })}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {lineup.powerPlay.pp2.map((playerId) => {
                            const player = getPlayerById(playerId)
                            if (!player) return null
                            return (
                              <div key={playerId} className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 p-1">
                                <PlayerAvatar nhl_id={player.player.nhl_id} name={player.player.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-200 truncate">{player.player.name}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemovePlayer('pp2', playerId)
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PK1 */}
                  <div className="rounded-lg border border-red-600/30 bg-red-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-red-400">
                        {t('lineup.special.pk1.title', 'PK1 (4v5)')}
                      </h3>
                      <span className="text-[10px] text-red-300">
                        {t('lineup.special.pk1.summary', {
                          count: lineup.penaltyKill.pk1.length,
                          defaultValue: `⏱️ ~1:10/2:00 • ${lineup.penaltyKill.pk1.length}/4`,
                        })}
                      </span>
                    </div>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('pk1')}
                      onClick={() => handleSlotClick('pk1')}
                      className={`min-h-[100px] rounded border-2 border-dashed border-red-600/50 bg-red-900/20 p-2 cursor-pointer transition-colors ${
                        selectedSlot === 'pk1' ? 'border-solid border-sky-500 bg-sky-900/30' : ''
                      } ${selectedPlayer ? 'hover:bg-sky-900/20' : ''}`}
                    >
                      {lineup.penaltyKill.pk1.length === 0 ? (
                        <p className="text-center text-xs text-slate-500">
                          {t('lineup.special.emptyMax', { max: 4, defaultValue: 'Click or drag (max {{max}})' })}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {lineup.penaltyKill.pk1.map((playerId) => {
                            const player = getPlayerById(playerId)
                            if (!player) return null
                            return (
                              <div key={playerId} className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 p-1">
                                <PlayerAvatar nhl_id={player.player.nhl_id} name={player.player.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-200 truncate">{player.player.name}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemovePlayer('pk1', playerId)
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PK2 */}
                  <div className="rounded-lg border border-red-600/30 bg-red-900/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-red-400">
                        {t('lineup.special.pk2.title', 'PK2 (4v5)')}
                      </h3>
                      <span className="text-[10px] text-red-300">
                        {t('lineup.special.pk2.summary', {
                          count: lineup.penaltyKill.pk2.length,
                          defaultValue: `${lineup.penaltyKill.pk2.length}/4`,
                        })}
                      </span>
                    </div>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('pk2')}
                      onClick={() => handleSlotClick('pk2')}
                      className={`min-h-[100px] rounded border-2 border-dashed border-red-600/50 bg-red-900/20 p-2 cursor-pointer transition-colors ${
                        selectedSlot === 'pk2' ? 'border-solid border-sky-500 bg-sky-900/30' : ''
                      } ${selectedPlayer ? 'hover:bg-sky-900/20' : ''}`}
                    >
                      {lineup.penaltyKill.pk2.length === 0 ? (
                        <p className="text-center text-xs text-slate-500">
                          {t('lineup.special.emptyMax', { max: 4, defaultValue: 'Click or drag (max {{max}})' })}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {lineup.penaltyKill.pk2.map((playerId) => {
                            const player = getPlayerById(playerId)
                            if (!player) return null
                            return (
                              <div key={playerId} className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 p-1">
                                <PlayerAvatar nhl_id={player.player.nhl_id} name={player.player.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-200 truncate">{player.player.name}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemovePlayer('pk2', playerId)
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
