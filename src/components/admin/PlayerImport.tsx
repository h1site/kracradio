import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'
import { supabase } from '../../api/supabaseClient'
import { useLeagueStore } from '../../state/useLeagueStore'

interface ImportResult {
  imported_count: number
  errors: string[]
}

interface PlayerImportProps {
  teamId?: string
}

export const PlayerImport = ({ teamId }: PlayerImportProps) => {
  const { t } = useTranslation()
  const selectedLeagueId = useLeagueStore((state) => state.selectedLeagueId)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [playerType, setPlayerType] = useState<'skaters' | 'goalies'>('skaters')
  const [importingNHL, setImportingNHL] = useState(false)
  type CsvRow = Record<string, string>

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedLeagueId) return

    setImporting(true)
    setResult(null)

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<CsvRow>) => {
        try {
          // Determine which import function to use based on player type
          const isGoalie = playerType === 'goalies'

          // Validate CSV headers match the expected format
          if (results.data.length > 0) {
            const firstRow: any = results.data[0]
            const headers = Object.keys(firstRow)

            if (isGoalie) {
              // Required goalie fields
              const requiredGoalieFields = ['name', 'skating', 'agility', 'reaction_time', 'size']
              const hasGoalieFields = requiredGoalieFields.some(field => headers.includes(field))

              // Check for skater-specific fields that shouldn't be in goalie CSV
              const skaterOnlyFields = ['checking', 'scoring', 'face_offs']
              const hasSkaterFields = skaterOnlyFields.some(field => headers.includes(field))

              if (!hasGoalieFields || hasSkaterFields) {
                setResult({
                  imported_count: 0,
                  errors: [
                    t('admin.wrongCsvType', {
                      selected: t('admin.goalies'),
                      detected: t('admin.skaters'),
                      expected: t('admin.goalies')
                    })
                  ]
                })
                setImporting(false)
                event.target.value = ''
                return
              }
            } else {
              // Required skater fields
              const requiredSkaterFields = ['name', 'position', 'checking', 'scoring', 'passing']
              const hasSkaterFields = requiredSkaterFields.some(field => headers.includes(field))

              // Check for goalie-specific fields that shouldn't be in skater CSV
              const goalieOnlyFields = ['agility', 'reaction_time', 'rebound_direction', 'style_control']
              const hasGoalieFields = goalieOnlyFields.some(field => headers.includes(field))

              if (!hasSkaterFields || hasGoalieFields) {
                setResult({
                  imported_count: 0,
                  errors: [
                    t('admin.wrongCsvType', {
                      selected: t('admin.skaters'),
                      detected: t('admin.goalies'),
                      expected: t('admin.skaters')
                    })
                  ]
                })
                setImporting(false)
                event.target.value = ''
                return
              }
            }
          }

          // Transform CSV data to match database schema
          const players = results.data.map((row: CsvRow) => {
            if (isGoalie) {
              // Goalie V2 format
              return {
                nhl_id: parseInt(row.nhl_id) || null,
                name: row.name,
                position: 'G',
                age: parseInt(row.age) || null,
                jersey_number: parseInt(row.jersey_number) || null,
                catches: row.catches || 'L',

                // V2 Goalie ratings
                skating: parseInt(row.skating) || null,
                durability: parseInt(row.durability) || null,
                endurance: parseInt(row.endurance) || null,
                size: parseInt(row.size) || null,
                agility: parseInt(row.agility) || null,
                rebound_direction: parseInt(row.rebound_direction) || null,
                style_control: parseInt(row.style_control) || null,
                hand_speed: parseInt(row.hand_speed) || null,
                reaction_time: parseInt(row.reaction_time) || null,
                puck_control: parseInt(row.puck_control) || null,
                penalty_shots: parseInt(row.penalty_shots) || null,
                experience: parseInt(row.experience) || null,
                leadership: parseInt(row.leadership) || null,
                potential: parseInt(row.potential) || null,
                strength: parseInt(row.strength) || null,
              }
            }

            // Skater format
            return {
              nhl_id: parseInt(row.nhl_id) || null,
              name: row.name,
              position: row.position,
              age: parseInt(row.age) || null,
              jersey_number: parseInt(row.jersey_number) || null,
              shoots: row.shoots || 'L',

              // V2 Rating fields for skaters (simulation-focused)
              checking_rating: parseInt(row.checking) || null,
              fight_rating: parseInt(row.fight) || null,
              discipline_rating: parseInt(row.discipline) || null,
              skating_rating: parseInt(row.skating) || null,
              strength_rating: parseInt(row.strength) || null,
              endurance_rating: parseInt(row.endurance) || null,
              durability_rating: parseInt(row.durability) || null,
              puck_handling_rating: parseInt(row.puck_handling) || null,
              face_offs_rating: parseInt(row.face_offs) || null,
              passing_rating: parseInt(row.passing) || null,
              scoring_rating: parseInt(row.scoring) || null,
              defense_rating: parseInt(row.defense) || null,
              penalty_shots_rating: parseInt(row.penalty_shots) || null,
              experience_rating: parseInt(row.experience) || null,
              leadership_rating: parseInt(row.leadership) || null,
              potential_rating: parseInt(row.potential) || null,
            }
          })

          // Call the appropriate import function based on player type
          const functionName = isGoalie ? 'fn_import_goalies' : 'fn_import_players'
          const paramName = isGoalie ? 'p_goalies' : 'p_players'

          const { data, error } = await supabase.rpc(functionName, {
            p_league_id: selectedLeagueId,
            p_team_id: teamId || null,
            [paramName]: players,
          })

          if (error) throw error

          setResult(data[0])
        } catch (error) {
          console.error('Import error:', error)
          setResult({
            imported_count: 0,
            errors: [error instanceof Error ? error.message : t('common.unknownError')],
          })
        } finally {
          setImporting(false)
          // Reset file input
          event.target.value = ''
        }
      },
      error: (error: Error) => {
        console.error('CSV parsing error:', error)
        setResult({
          imported_count: 0,
          errors: [t('admin.parseCsvError', { message: error.message })],
        })
        setImporting(false)
      },
    })
  }

  const handleImportNHLPlayers = async () => {
    if (!selectedLeagueId) {
      alert(t('admin.selectLeagueFirst'))
      return
    }

    setImportingNHL(true)
    setResult(null)

    try {
      // Load both CSV files
      console.log('Loading NHL skaters and goalies...')

      const [skatersResponse, goaliesResponse] = await Promise.all([
        fetch('/nhl-skaters.csv'),
        fetch('/nhl-goalies.csv')
      ])

      const [skatersText, goaliesText] = await Promise.all([
        skatersResponse.text(),
        goaliesResponse.text()
      ])

      // Parse CSVs
      const skatersData = Papa.parse<CsvRow>(skatersText, { header: true, skipEmptyLines: true })
      const goaliesData = Papa.parse<CsvRow>(goaliesText, { header: true, skipEmptyLines: true })

      console.log(`Loaded ${skatersData.data.length} skaters and ${goaliesData.data.length} goalies`)

      // Process skaters with NHL API position lookup (in batches)
      const skaters: any[] = []

      console.log(`Processing ${skatersData.data.length} skaters (using pre-enriched data)...`)

      // The CSV is already enriched with nhl_id, position, age, shoots
      // No need for API calls!
      for (const row of skatersData.data) {
        const playerName = row.name
        const position = row.position

        if (!playerName) continue

        // Validate position
        if (!position || !['C', 'LW', 'RW', 'L', 'R', 'D'].includes(position)) {
          console.warn(`Skipping ${playerName}: invalid position ${position}`)
          continue
        }

        // Normalize wing positions (L -> LW, R -> RW)
        let normalizedPosition = position
        if (position === 'L') normalizedPosition = 'LW'
        if (position === 'R') normalizedPosition = 'RW'

        skaters.push({
          name: playerName,
          position: normalizedPosition,
          nhl_id: row.nhl_id ? parseInt(row.nhl_id) : null,
          age: row.age ? parseInt(row.age) : null,
          jersey_number: null,
          shoots: row.shoots || 'L',

          // V2 Rating fields
          checking_rating: row.CK ? parseInt(row.CK) : null,
          fight_rating: row.FG ? parseInt(row.FG) : null,
          discipline_rating: row.DI ? parseInt(row.DI) : null,
          skating_rating: row.SK ? parseInt(row.SK) : null,
          strength_rating: row.ST ? parseInt(row.ST) : null,
          endurance_rating: row.EN ? parseInt(row.EN) : null,
          durability_rating: row.DU ? parseInt(row.DU) : null,
          puck_handling_rating: row.PH ? parseInt(row.PH) : null,
          face_offs_rating: row.FO ? parseInt(row.FO) : null,
          passing_rating: row.PA ? parseInt(row.PA) : null,
          scoring_rating: row.SC ? parseInt(row.SC) : null,
          defense_rating: row.DF ? parseInt(row.DF) : null,
          penalty_shots_rating: row.PS ? parseInt(row.PS) : null,
          experience_rating: row.EX ? parseInt(row.EX) : null,
          leadership_rating: row.LD ? parseInt(row.LD) : null,
          potential_rating: row.PO ? parseInt(row.PO) : null,
        })
      }

      // Process goalies (using pre-enriched data)
      console.log(`Processing ${goaliesData.data.length} goalies (using pre-enriched data)...`)

      const goalies: any[] = goaliesData.data.map((row: CsvRow) => ({
        name: row.name,
        position: 'G',
        nhl_id: row.nhl_id ? parseInt(row.nhl_id) : null,
        age: row.age ? parseInt(row.age) : null,
        jersey_number: null,
        catches: row.catches || 'L',

        // V2 Goalie ratings
        skating: row.SK ? parseInt(row.SK) : null,
        durability: row.DU ? parseInt(row.DU) : null,
        endurance: row.EN ? parseInt(row.EN) : null,
        size: row.SZ ? parseInt(row.SZ) : null,
        agility: row.AG ? parseInt(row.AG) : null,
        rebound_direction: row.RB ? parseInt(row.RB) : null,
        style_control: row.SC ? parseInt(row.SC) : null,
        hand_speed: row.HS ? parseInt(row.HS) : null,
        reaction_time: row.RT ? parseInt(row.RT) : null,
        puck_control: row.PH ? parseInt(row.PH) : null,
        penalty_shots: row.PS ? parseInt(row.PS) : null,
        experience: row.EX ? parseInt(row.EX) : null,
        leadership: row.LD ? parseInt(row.LD) : null,
        potential: row.PO ? parseInt(row.PO) : null,
        strength: row.ST ? parseInt(row.ST) : null,
      }))

      console.log(`Processed ${skaters.length} skaters and ${goalies.length} goalies`)

      // Debug: Show sample of first skater to verify data structure
      if (skaters.length > 0) {
        console.log('Sample skater data:', skaters[0])
      }
      if (goalies.length > 0) {
        console.log('Sample goalie data:', goalies[0])
      }

      // Import skaters
      console.log(`Importing ${skaters.length} skaters as free agents (team_id: null)...`)
      const { data: skatersResult, error: skatersError } = await supabase.rpc('fn_import_players', {
        p_league_id: selectedLeagueId,
        p_team_id: null,
        p_players: skaters,
      })

      if (skatersError) {
        console.error('Skaters import error:', skatersError)
        throw skatersError
      }
      console.log('Skaters import result:', skatersResult)

      // Import goalies
      console.log(`Importing ${goalies.length} goalies as free agents (team_id: null)...`)
      const { data: goaliesResult, error: goaliesError } = await supabase.rpc('fn_import_goalies', {
        p_league_id: selectedLeagueId,
        p_team_id: null,
        p_goalies: goalies,
      })

      if (goaliesError) {
        console.error('Goalies import error:', goaliesError)
        throw goaliesError
      }
      console.log('Goalies import result:', goaliesResult)

      const totalImported = (skatersResult[0]?.imported_count || 0) + (goaliesResult[0]?.imported_count || 0)
      console.log(`✅ Total imported: ${totalImported} players (${skatersResult[0]?.imported_count} skaters + ${goaliesResult[0]?.imported_count} goalies)`)
      const allErrors = [
        ...(skatersResult[0]?.errors || []),
        ...(goaliesResult[0]?.errors || [])
      ]

      setResult({
        imported_count: totalImported,
        errors: allErrors
      })

    } catch (error) {
      console.error('NHL import error:', error)
      setResult({
        imported_count: 0,
        errors: [error instanceof Error ? error.message : t('common.unknownError')],
      })
    } finally {
      setImportingNHL(false)
    }
  }

  const downloadTemplate = (type: 'skaters' | 'goalies') => {
    const templateUrl = `/docs/csv-templates/${type}_template_v2.csv`
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = `${type}_template_v2.csv`
    link.click()
  }

  return (
    <div className="space-y-6 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">
          {t('admin.importPlayers', 'Import Players from CSV')}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {t(
            'admin.importPlayersDescription',
            'Upload a CSV file to bulk import player ratings. Choose the player type and ensure your CSV matches the template format.'
          )}
        </p>
      </div>

      {/* Player Type Selection */}
      <div className="flex gap-3">
        <button
          onClick={() => setPlayerType('skaters')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            playerType === 'skaters'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {t('admin.skaters', 'Skaters (F/D)')}
        </button>
        <button
          onClick={() => setPlayerType('goalies')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            playerType === 'goalies'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {t('admin.goalies', 'Goalies')}
        </button>
      </div>

      {/* Download Template */}
      <div className="flex items-center justify-between rounded-md border border-slate-600 bg-slate-900/50 p-4">
        <div>
          <p className="font-medium text-slate-200">
            {t('admin.downloadTemplate', 'Download CSV Template')}
          </p>
          <p className="text-sm text-slate-400">
            {playerType === 'skaters'
              ? t('admin.skatersTemplate', 'Template for forwards and defensemen')
              : t('admin.goaliesTemplate', 'Template for goalies')}
          </p>
        </div>
        <button
          onClick={() => downloadTemplate(playerType)}
          className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {t('common.download', 'Download')}
        </button>
      </div>

      {/* Import NHL Players */}
      <div className="rounded-md border border-green-600/50 bg-green-900/20 p-4">
        <div className="mb-3">
          <p className="font-medium text-green-200">
            {t('admin.importNHLPlayers', 'Import Active NHL Players')}
          </p>
          <p className="mt-1 text-sm text-green-300">
            {t('admin.importNHLPlayersDescription', 'Import all active NHL players with ratings. Positions will be fetched automatically from NHL API.')}
          </p>
        </div>
        <button
          onClick={handleImportNHLPlayers}
          disabled={importingNHL || !selectedLeagueId}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importingNHL ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('admin.importingNHL', 'Importing NHL Players...')}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t('admin.importAllNHLPlayers', 'Import NHL Players (Skaters + Goalies)')}
            </>
          )}
        </button>
        {!selectedLeagueId && (
          <p className="mt-2 text-sm text-amber-400">
            {t('admin.selectLeagueFirst', 'Please select a league first')}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label
          htmlFor="csv-upload"
          className="block text-sm font-medium text-slate-300"
        >
          {t('admin.uploadCsv', 'Upload CSV File')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={importing || !selectedLeagueId}
            className="block w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {importing && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('common.importing', 'Importing...')}
            </div>
          )}
        </div>
        {!selectedLeagueId && (
          <p className="text-sm text-amber-400">
            {t('admin.selectLeagueFirst', 'Please select a league first')}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div
          className={`rounded-md border p-4 ${
            result.errors.length > 0
              ? 'border-red-600/50 bg-red-900/20'
              : 'border-green-600/50 bg-green-900/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                result.errors.length > 0 ? 'bg-red-600/20' : 'bg-green-600/20'
              }`}
            >
              {result.errors.length > 0 ? (
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  result.errors.length > 0 ? 'text-red-200' : 'text-green-200'
                }`}
              >
                {result.imported_count > 0
                  ? t('admin.playersImported', {
                      count: result.imported_count,
                    })
                  : t('admin.noPlayersImported')}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-red-300">
                    {t('admin.errors', 'Errors')}:
                  </p>
                  {result.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-200">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-md border border-sky-600/30 bg-sky-900/10 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-sky-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-sky-200">
            <p className="font-medium">{t('admin.importTips', 'Import Tips')}:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sky-300">
              <li>{t('admin.tip1', 'All rating values should be between 0 and 100')}</li>
              <li>{t('admin.tip2', 'Name and position are required fields')}</li>
              <li>
                {t(
                  'admin.tip3',
                  'Skater positions: C (Center), LW (Left Wing), RW (Right Wing), D (Defense)'
                )}
              </li>
              <li>{t('admin.tip4', 'Goalie position: G')}</li>
              <li>
                {t('admin.tip5', 'Shoots/Catches: L (Left) or R (Right)')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
