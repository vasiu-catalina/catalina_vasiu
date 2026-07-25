import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../auth'
import { deleteUser, fetchUsers, type UserRecord } from './api'

function formatRole(role: string | null): string {
  if (!role) return '—'
  switch (role) {
    case 'admin': return 'System Administrator'
    case 'colleague': return 'Colleague'
    case 'passenger': return 'Passenger'
    default: return role
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
    <div className="section-card" style={{ marginTop: 24 }}>
      <div className="section-heading">
        <h2>User Management</h2>
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
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Cases</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.is_active ? 'user-inactive' : ''}>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email}</td>
                <td>{formatRole(user.role)}</td>
                <td>{user.assigned_cases}</td>
                <td>
                  {user.is_active && (
                    confirmingId === user.id ? (
                      <span className="confirm-actions">
                        <button
                          className="button-ghost"
                          onClick={() => handleDelete(user.id)}
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
                        onClick={() => setConfirmingId(user.id)}
                      >
                        Delete
                      </button>
                    )
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
