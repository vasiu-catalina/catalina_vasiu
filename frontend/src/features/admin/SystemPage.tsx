import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { fetchSystemInfo, type SystemInfo } from './api'
import { Alert, Card } from '../../components/ui'

/**
 * System info page — metric cards in a responsive grid.
 * Each card uses the secondary color (white/zinc-800) — 30% rule.
 * Numbers are large and bold for instant readability (visual hierarchy).
 */
export function SystemPage() {
  const { token } = useAuth()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetchSystemInfo(token)
      .then(setInfo)
      .catch(() => setError('Failed to load system information.'))
  }, [token])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">System Information</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Overview of system metrics and status.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {info && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="system-info">
          <Card>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Total Cases</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-zinc-100" data-testid="total-cases">
              {info.total_cases}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-zinc-100" data-testid="total-users">
              {info.total_users}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Total Colleagues</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-zinc-100" data-testid="total-colleagues">
              {info.total_colleagues}
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
