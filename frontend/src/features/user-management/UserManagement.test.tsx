import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuthProvider } from '../auth/AuthContext'
import { UserManagementPage } from './UserManagementPage'

const mockUsers = [
  {
    id: 1,
    email: 'alice@test.com',
    first_name: 'Alice',
    last_name: 'Smith',
    is_active: true,
    date_joined: '2026-07-24T10:00:00Z',
  },
  {
    id: 2,
    email: 'bob@test.com',
    first_name: 'Bob',
    last_name: 'Jones',
    is_active: true,
    date_joined: '2026-07-24T11:00:00Z',
  },
]

const server = setupServer(
  http.get('http://localhost:8000/api/users/', () => {
    return HttpResponse.json(mockUsers)
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function renderPage() {
  // Seed auth state so useAuth provides a token
  localStorage.setItem(
    'auth',
    JSON.stringify({
      token: 'admin-token',
      user: { id: 99, email: 'admin@test.com', first_name: 'Admin', last_name: 'User', is_staff: true },
      mustChangePassword: false,
    })
  )

  return render(
    <BrowserRouter>
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('UserManagementPage', () => {
  it('renders user list with names and emails', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('alice@test.com')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      expect(screen.getByText('bob@test.com')).toBeInTheDocument()
    })
  })

  it('shows delete buttons for active users', async () => {
    renderPage()

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      expect(deleteButtons).toHaveLength(2)
    })
  })

  it('shows confirmation on delete click', async () => {
    renderPage()
    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('can cancel deletion', async () => {
    renderPage()
    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    // Delete buttons should be back
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
    })
  })

  it('shows success message after deletion', async () => {
    renderPage()
    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    // Override handlers after initial load
    let deleted = false
    server.use(
      http.delete('http://localhost:8000/api/users/1/', () => {
        deleted = true
        return HttpResponse.json({ detail: 'User account deleted successfully.' })
      }),
      http.get('http://localhost:8000/api/users/', () => {
        if (deleted) {
          return HttpResponse.json([
            { ...mockUsers[0], is_active: false },
            mockUsers[1],
          ])
        }
        return HttpResponse.json(mockUsers)
      })
    )

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('User account deleted successfully.')).toBeInTheDocument()
    })
  })

  it('shows error when user list fails to load', async () => {
    server.use(
      http.get('http://localhost:8000/api/users/', () => {
        return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
      })
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    renderPage()
    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })
})
