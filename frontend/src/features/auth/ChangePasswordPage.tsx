import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { changePassword, getAuthErrorMessage } from './api'
import { Button } from '../../components/ui'
import { ThemeToggle } from '../../components/ThemeToggle'

/**
 * Change password page — forced on first login.
 * Client-side validation with inline error feedback.
 * Submit disabled until passwords match and meet length requirements.
 */
export function ChangePasswordPage() {
  const { token, updateToken, clearMustChangePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordsMatch = newPassword === confirmPassword
  const isLongEnough = newPassword.length >= 8

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    if (!isLongEnough) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await changePassword(token!, newPassword, confirmPassword)
      updateToken(response.token)
      clearMustChangePassword()
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-zinc-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mb-1">Change Password</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
            You must change your password before continuing.
          </p>

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
              <label htmlFor="new-password" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
                placeholder="Minimum 8 characters"
              />
              {newPassword.length > 0 && !isLongEnough && (
                <p className="text-xs text-red-600 dark:text-red-400">Must be at least 8 characters</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
                placeholder="Repeat your password"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
