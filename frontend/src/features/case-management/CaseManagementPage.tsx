import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../auth'
import { deleteCase, fetchCases, type CaseRecord } from './api'
import { Alert, Badge, Button } from '../../components/ui'

/**
 * Case management table with responsive design.
 * Table uses secondary background (white card) with hover highlights.
 * Delete action uses danger variant with confirmation step.
 * Status badges use semantic coloring (green for active states).
 * All interactive elements meet 48px touch target.
 */
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
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">Case Management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          View and manage all submitted cases.
        </p>
      </div>

      {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* Table card */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            Loading cases...
          </div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            No cases found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Case Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Flight Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Flight Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-slate-50 dark:hover:bg-zinc-750 transition-colors duration-100">
                    <td className="px-4 py-3">
                      <a href={`/cases/${caseItem.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
                        {caseItem.id}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">{formatDate(caseItem.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">{caseItem.flight_number ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">{caseItem.flight_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{caseItem.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmingId === caseItem.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(caseItem.id)}
                            disabled={deleting}
                          >
                            {deleting ? 'Deleting...' : 'Confirm'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmingId(null)}
                            disabled={deleting}
                          >
                            Cancel
                          </Button>
                        </span>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmingId(caseItem.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
