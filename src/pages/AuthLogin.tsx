import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'
import { useSessionContext } from '../providers/SessionProvider'

interface LocationState {
  from?: {
    pathname: string
  }
}

export const AuthLoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { session } = useSessionContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    if (session) {
      const state = location.state as LocationState | undefined
      const redirectTo = state?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    }
  }, [session, location.state, navigate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsLoading(true)

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError(t('auth.errors.displayNameRequired'))
        setIsLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError(t('auth.errors.passwordMismatch'))
        setIsLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        setInfo(t('auth.info.signupWithSession'))
      } else {
        setInfo(t('auth.info.signupWithoutSession'))
      }
      setIsLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError(t('auth.errors.passwordResetEmailMissing'))
      return
    }
    setError(null)
    setInfo(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setInfo(t('auth.info.passwordResetSent'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <header className="mb-6 text-center">
          <img src="/logo.webp" alt="HockeyBreak" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="text-2xl font-semibold text-slate-50">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login' ? t('auth.loginDescription') : t('auth.signupDescription')}
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div>
              <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('auth.fields.displayName.label')}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
                placeholder={t('auth.fields.displayName.placeholder')}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('auth.fields.email.label')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
              placeholder={t('auth.fields.email.placeholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('auth.fields.password.label')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
              placeholder={t('auth.fields.password.placeholder')}
              required
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('auth.fields.confirmPassword.label')}
              </label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
                placeholder={t('auth.fields.confirmPassword.placeholder')}
                required
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-emerald-400">{info}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-800"
            disabled={isLoading}
          >
            {isLoading
              ? mode === 'login'
                ? t('auth.actions.submittingLogin')
                : t('auth.actions.submittingSignup')
              : mode === 'login'
                ? t('auth.actions.submitLogin')
                : t('auth.actions.submitSignup')}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <button type="button" className="hover:text-sky-300" onClick={handlePasswordReset}>
            {t('auth.actions.forgotPassword')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
              setError(null)
              setInfo(null)
            }}
            className="hover:text-sky-300"
          >
            {mode === 'login' ? t('auth.actions.toggleToSignup') : t('auth.actions.toggleToLogin')}
          </button>
        </div>
      </div>
    </div>
  )
}
