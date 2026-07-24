import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../auth'
import { deleteCase, fetchCases, type CaseRecord } from './api'

export function CaseManagementPage() {
  const { token } = useAuth()
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCases = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchCases(token)
      setCases(data)
    } catch {
      setError('Failed to load cases.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  const handleDelete = async (caseId: number) => {
    if (!token) return
    setDeleting(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await deleteCase(token, caseId)
      setSuccessMessage(result.detail)
      setConfirmingId(null)
      await loadCases()
    } catch {
      setError('Failed to delete case.')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="section-card" style={{ marginTop: 24 }}>
      <div className="section-heading">
        <h2>Case Management</h2>
      </div>

      {successMessage && (
        <div className="success-banner" style={{ marginBottom: 16 }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading cases...</p>
      ) : cases.length === 0 ? (
        <p>No cases found.</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Case Date</th>
              <th>Flight Number</th>
              <th>Flight Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>
                  <a href={`/cases/${caseItem.id}`} className="case-link">
                    {caseItem.id}
                  </a>
                </td>
                <td>{formatDate(caseItem.created_at)}</td>
                <td>{caseItem.flight_number ?? '—'}</td>
                <td>{caseItem.flight_date ?? '—'}</td>
                <td>
                  <span className="status-pill">
                    {caseItem.status}
                  </span>
                </td>
                <td>
                  {confirmingId === caseItem.id ? (
                    <span className="confirm-actions">
                      <button
                        className="button-ghost"
                        onClick={() => handleDelete(caseItem.id)}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        className="button-secondary"
                        onClick={() => setConfirmingId(null)}
                        disabled={deleting}
                        style={{ marginLeft: 8 }}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      className="button-delete"
                      onClick={() => setConfirmingId(caseItem.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
