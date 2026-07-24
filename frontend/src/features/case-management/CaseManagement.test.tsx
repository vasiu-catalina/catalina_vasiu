import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuthProvider } from '../auth/AuthContext'
import { CaseManagementPage } from './CaseManagementPage'

const mockCases = [
  {
    id: 1,
    status: 'NEW',
    created_at: '2026-07-24T10:00:00Z',
    flight_number: 'RO101',
    flight_date: '2026-07-20',
  },
  {
    id: 2,
    status: 'VALID',
    created_at: '2026-07-23T14:30:00Z',
    flight_number: 'LH456',
    flight_date: '2026-07-18',
  },
]

const server = setupServer(
  http.get('http://localhost:8000/api/cases/list/', () => {
    return HttpResponse.json(mockCases)
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function renderPage() {
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
        <CaseManagementPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('CaseManagementPage', () => {
  it('renders case list with ID, status, and flight info', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('RO101')).toBeInTheDocument()
      expect(screen.getByText('NEW')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('LH456')).toBeInTheDocument()
      expect(screen.getByText('VALID')).toBeInTheDocument()
    })
  })

  it('shows delete buttons for all cases', async () => {
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
      expect(screen.getByText('RO101')).toBeInTheDocument()
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
      expect(screen.getByText('RO101')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
    })
  })

  it('shows success message after deletion', async () => {
    renderPage()
    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByText('RO101')).toBeInTheDocument()
    })

    let deleted = false
    server.use(
      http.delete('http://localhost:8000/api/cases/1/', () => {
        deleted = true
        return HttpResponse.json({ detail: 'Case deleted successfully.' })
      }),
      http.get('http://localhost:8000/api/cases/list/', () => {
        if (deleted) {
          return HttpResponse.json([mockCases[1]])
        }
        return HttpResponse.json(mockCases)
      })
    )

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('Case deleted successfully.')).toBeInTheDocument()
    })
  })

  it('shows error when case list fails to load', async () => {
    server.use(
      http.get('http://localhost:8000/api/cases/list/', () => {
        return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
      })
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Failed to load cases.')).toBeInTheDocument()
    })
  })

  it('shows no cases message when list is empty', async () => {
    server.use(
      http.get('http://localhost:8000/api/cases/list/', () => {
        return HttpResponse.json([])
      })
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('No cases found.')).toBeInTheDocument()
    })
  })

  it('renders case ID as a link', async () => {
    renderPage()

    await waitFor(() => {
      const link = screen.getByRole('link', { name: '1' })
      expect(link).toHaveAttribute('href', '/cases/1')
    })
  })
})
