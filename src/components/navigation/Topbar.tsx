import { useTranslation } from 'react-i18next'
import { supabase } from '../../api/supabaseClient'
import { useSessionContext } from '../../providers/SessionProvider'
import { LanguageSelector } from '../common/LanguageSelector'

export const Topbar = () => {
  const { t } = useTranslation()
  const { session } = useSessionContext()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">League Control Center</h1>
          <p className="text-sm text-slate-400">Manage teams, contracts, and simulations</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <LanguageSelector compact />
        <div className="text-right">
          <p className="font-medium text-slate-100">{session?.user?.user_metadata?.display_name ?? 'mrbossross'}</p>
          <p className="text-xs text-slate-400">{session?.user?.email ?? 'Session active'}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100"
        >
          {t('topbar.logout')}
        </button>
      </div>
    </header>
  )
}
