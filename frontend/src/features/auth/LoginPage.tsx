import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { login, getAuthErrorMessage } from './api'
import { Button } from '../../components/ui'
import { ThemeToggle } from '../../components/ThemeToggle'

/**
 * Login page — centered card layout on dominant background.
 * Form validation: submit disabled until both fields filled.
 * Inline error alerts with semantic red.
 * 8px grid spacing throughout.
 */
export function LoginPage() {
  const { setAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isFormValid = email.trim() !== '' && password.trim() !== ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)
      setAuth(response.token, response.user, response.must_change_password)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-zinc-950">
      {/* Theme toggle — top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">AirAssist</h1>
        </div>

        {/* Card — secondary color (30% rule) */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800 hover:border-slate-400 dark:hover:border-zinc-500"
                placeholder="you@company.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800 hover:border-slate-400 dark:hover:border-zinc-500"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={!isFormValid}
              isLoading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
