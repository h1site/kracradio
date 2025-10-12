import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { RosterPage } from './pages/Roster'
import { ContractsPage } from './pages/Contracts'
import { SchedulePage } from './pages/Schedule'
import { StandingsPage } from './pages/Standings'
import { PlayerStatisticsPage } from './pages/PlayerStatistics'
import { TeamRosterPage } from './pages/TeamRoster'
import { DraftPage } from './pages/Draft'
import { AdminPage } from './pages/Admin'
import { AuthLoginPage } from './pages/AuthLogin'
import { LeagueRulesPage } from './pages/LeagueRules'
import { RosterManagementPage } from './pages/RosterManagementPage'
import { LineupPage } from './pages/LineupPage'
import { GameDetailsPage } from './pages/GameDetailsPage'
import { PlayerStatsPage } from './pages/PlayerStatsPage'

const App = () => {
  return (
    <Routes>
      <Route path="/auth/login" element={<AuthLoginPage />} />
      <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/lineup" element={<LineupPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/player-statistics" element={<PlayerStatisticsPage />} />
        <Route path="/team/:teamId/roster" element={<TeamRosterPage />} />
        <Route path="/game/:gameId" element={<GameDetailsPage />} />
        <Route path="/player/:playerId" element={<PlayerStatsPage />} />
        <Route path="/draft" element={<DraftPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/roster-management" element={<RosterManagementPage />} />
        <Route path="/league/:leagueId/rules" element={<LeagueRulesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
