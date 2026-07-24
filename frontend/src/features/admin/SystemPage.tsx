import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { fetchSystemInfo, type SystemInfo } from './api'

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
      <h1>System Information</h1>

      {error && <div className="alert">{error}</div>}

      {info && (
        <div className="summary-grid" data-testid="system-info">
          <div className="summary-card">
            <strong>Total Cases</strong>
            <span data-testid="total-cases">{info.total_cases}</span>
          </div>
          <div className="summary-card">
            <strong>Total Users</strong>
            <span data-testid="total-users">{info.total_users}</span>
          </div>
          <div className="summary-card">
            <strong>Total Colleagues</strong>
            <span data-testid="total-colleagues">{info.total_colleagues}</span>
          </div>
        </div>
      )}
    </div>
  )
}
