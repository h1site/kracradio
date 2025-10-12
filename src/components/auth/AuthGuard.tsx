import { Navigate, useLocation } from 'react-router-dom'
import { useSessionContext } from '../../providers/SessionProvider'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const { session, isLoading } = useSessionContext()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
          <p className="text-sm text-slate-400">Chargement de votre session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
