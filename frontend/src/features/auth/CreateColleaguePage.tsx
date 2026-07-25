import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { createColleague, getAuthErrorMessage } from './api'
import { Button, Alert } from '../../components/ui'

/**
 * Create colleague page — admin-only form within the admin layout.
 * Form validation: submit disabled until all required fields filled.
 * Success/error feedback via semantic Alert component.
 * 8px grid spacing with generous whitespace.
 */
export function CreateColleaguePage() {
  const { token } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const isFormValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    password.length >= 8

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await createColleague(token!, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      })
      setSuccess(response.message)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      {/* Page header — clear visual hierarchy */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">Create Colleague</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Add a new colleague account to the system.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          {success && (
            <div role="status" className="p-4 rounded-xl border text-sm bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                maxLength={128}
                className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
                placeholder="Jane"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lastName" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                maxLength={128}
                className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="colleagueEmail" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
              Email
            </label>
            <input
              id="colleagueEmail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
              placeholder="colleague@company.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="initialPassword" className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
              Initial Password
            </label>
            <input
              id="initialPassword"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="min-h-12 w-full px-4 py-3 rounded-lg text-sm border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
              placeholder="Minimum 8 characters"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Minimum 8 characters. The colleague will be prompted to change it on first login.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid}
            isLoading={loading}
            className="w-full mt-2"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
