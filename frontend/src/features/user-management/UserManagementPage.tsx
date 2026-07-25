import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../auth'
import { deleteUser, fetchUsers, type UserRecord } from './api'
import { Alert, Badge, Button } from '../../components/ui'

/**
 * User management table with role formatting.
 * Inactive users are visually dimmed (opacity) for instant recognition.
 * Delete action requires confirmation (prevent accidental deletions).
 * Responsive: horizontal scroll on small screens preserves data integrity.
 */
function formatRole(role: string | null): string {
  if (!role) return '—'
  switch (role) {
    case 'admin': return 'System Administrator'
    case 'colleague': return 'Colleague'
    case 'passenger': return 'Passenger'
    default: return role
  }
}

function getRoleBadgeVariant(role: string | null): 'default' | 'info' | 'success' | 'warning' {
  switch (role) {
    case 'admin': return 'warning'
    case 'colleague': return 'info'
    case 'passenger': return 'success'
    default: return 'default'
  }
}

export function UserManagementPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers(token)
      setUsers(data)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleDelete = async (userId: number) => {
    if (!token) return
    setDeleting(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await deleteUser(token, userId)
      setSuccessMessage(result.detail)
      setConfirmingId(null)
      await loadUsers()
    } catch {
      setError('Failed to delete user.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">User Management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          View and manage all system users.
        </p>
      </div>

      {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* Table card */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Assigned Cases</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={[
                      'transition-colors duration-100',
                      !user.is_active
                        ? 'opacity-50'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-750',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {formatRole(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">{user.assigned_cases}</td>
                    <td className="px-4 py-3 text-right">
                      {user.is_active && (
                        confirmingId === user.id ? (
                          <span className="inline-flex items-center gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
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
                            onClick={() => setConfirmingId(user.id)}
                          >
                            Delete
                          </Button>
                        )
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
