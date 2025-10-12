import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LeagueSelector } from '../common/LeagueSelector'
import { useLeagueStore } from '../../state/useLeagueStore'

export const Sidebar = () => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const leagues = useLeagueStore((state) => state.leagues)
  const selectedLeagueId = useLeagueStore((state) => state.selectedLeagueId)
  const activeLeague = leagues.find((league) => league.id === selectedLeagueId)

  const navItems = [
    { to: '/', label: t('nav.dashboard'), key: 'dashboard' },
    { to: '/roster', label: t('nav.roster'), key: 'roster' },
    { to: '/contracts', label: t('nav.contracts'), key: 'contracts' },
    { to: '/schedule', label: t('nav.schedule'), key: 'schedule' },
    { to: '/standings', label: t('nav.standings', 'Classement'), key: 'standings' },
    { to: '/player-statistics', label: t('nav.playerStatistics', 'Statistiques Joueurs'), key: 'player-statistics' },
    { to: '/draft', label: t('nav.draft'), key: 'draft' },
    { to: '/admin', label: t('nav.admin'), key: 'admin' },
  ]

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu on navigation
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-slate-100 lg:hidden"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Toggle Button - Desktop only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 lg:flex"
          aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="border-b border-slate-800 p-4">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <img src="/logo.webp" alt="HockeyBreak" className="h-8 w-auto flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t('sidebar.activeLeague')}
                  </span>
                  <span className="truncate text-sm text-slate-100">
                    {activeLeague ? activeLeague.name : t('sidebar.selectLeague')}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <LeagueSelector hideLabel />
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <img src="/logo.webp" alt="HockeyBreak" className="h-8 w-8 object-contain" />
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100',
                  isCollapsed ? 'text-center' : '',
                ].join(' ')
              }
              title={isCollapsed ? item.label : undefined}
            >
              {isCollapsed ? item.label.charAt(0) : item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
