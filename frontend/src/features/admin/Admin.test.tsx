import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AuthProvider } from '../auth'
import { AdminLandingPage } from './AdminLandingPage'
import { SystemPage } from './SystemPage'

const API_BASE = 'http://localhost:8000/api'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function setAdminAuth() {
  localStorage.setItem(
    'auth',
    JSON.stringify({
      token: 'admin-token',
      user: { id: 1, email: 'admin@test.com', first_name: 'Admin', last_name: 'User', is_staff: true, role: 'admin' },
      mustChangePassword: false,
    })
  )
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  )
}

describe('AdminLandingPage', () => {
  beforeEach(() => setAdminAuth())

  it('renders 4 navigation cards', async () => {
    server.use(
      http.get(`${API_BASE}/admin/navigation/`, () => {
        return HttpResponse.json({
          sections: [
            { key: 'new-user', label: 'New User', description: 'Create new colleague accounts', path: '/admin/create-colleague' },
            { key: 'users', label: 'User Management', description: 'View and manage user accounts', path: '/users' },
            { key: 'cases', label: 'Case Management', description: 'View and manage passenger cases', path: '/cases' },
            { key: 'system', label: 'System', description: 'View system information and settings', path: '/admin/system' },
          ],
        })
      })
    )

    renderWithAuth(<AdminLandingPage />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-nav-grid')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-card-new-user')).toBeInTheDocument()
    expect(screen.getByTestId('admin-card-users')).toBeInTheDocument()
    expect(screen.getByTestId('admin-card-cases')).toBeInTheDocument()
    expect(screen.getByTestId('admin-card-system')).toBeInTheDocument()
  })

  it('cards have correct labels and descriptions', async () => {
    server.use(
      http.get(`${API_BASE}/admin/navigation/`, () => {
        return HttpResponse.json({
          sections: [
            { key: 'new-user', label: 'New User', description: 'Create new colleague accounts', path: '/admin/create-colleague' },
            { key: 'users', label: 'User Management', description: 'View and manage user accounts', path: '/users' },
            { key: 'cases', label: 'Case Management', description: 'View and manage passenger cases', path: '/cases' },
            { key: 'system', label: 'System', description: 'View system information and settings', path: '/admin/system' },
          ],
        })
      })
    )

    renderWithAuth(<AdminLandingPage />)

    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument()
    })

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Case Management')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('Create new colleague accounts')).toBeInTheDocument()
  })

  it('cards link to correct paths', async () => {
    server.use(
      http.get(`${API_BASE}/admin/navigation/`, () => {
        return HttpResponse.json({
          sections: [
            { key: 'new-user', label: 'New User', description: 'Create accounts', path: '/admin/create-colleague' },
            { key: 'users', label: 'Users', description: 'Manage users', path: '/users' },
            { key: 'cases', label: 'Cases', description: 'Manage cases', path: '/cases' },
            { key: 'system', label: 'System', description: 'System info', path: '/admin/system' },
          ],
        })
      })
    )

    renderWithAuth(<AdminLandingPage />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-card-new-user')).toBeInTheDocument()
    })

    expect(screen.getByTestId('admin-card-new-user')).toHaveAttribute('href', '/admin/create-colleague')
    expect(screen.getByTestId('admin-card-users')).toHaveAttribute('href', '/users')
    expect(screen.getByTestId('admin-card-cases')).toHaveAttribute('href', '/cases')
    expect(screen.getByTestId('admin-card-system')).toHaveAttribute('href', '/admin/system')
  })

  it('shows error when API fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/navigation/`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    renderWithAuth(<AdminLandingPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load navigation.')).toBeInTheDocument()
    })
  })
})

describe('SystemPage', () => {
  beforeEach(() => setAdminAuth())

  it('renders system information', async () => {
    server.use(
      http.get(`${API_BASE}/admin/system-info/`, () => {
        return HttpResponse.json({
          total_cases: 10,
          total_users: 5,
          total_colleagues: 3,
        })
      })
    )

    renderWithAuth(<SystemPage />)

    await waitFor(() => {
      expect(screen.getByTestId('system-info')).toBeInTheDocument()
    })

    expect(screen.getByTestId('total-cases')).toHaveTextContent('10')
    expect(screen.getByTestId('total-users')).toHaveTextContent('5')
    expect(screen.getByTestId('total-colleagues')).toHaveTextContent('3')
  })

  it('shows error when API fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/system-info/`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    renderWithAuth(<SystemPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load system information.')).toBeInTheDocument()
    })
  })
})
