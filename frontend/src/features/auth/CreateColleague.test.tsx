import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuthProvider } from './AuthContext'
import { CreateColleaguePage } from './CreateColleaguePage'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function renderWithAuth(ui: React.ReactElement) {
  // Simulate logged-in admin
  localStorage.setItem('auth', JSON.stringify({
    token: 'test-admin-token',
    user: { id: 1, email: 'admin@airassist.com', first_name: 'System', last_name: 'Admin', role: 'admin' },
    mustChangePassword: false,
  }))
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  )
}

describe('CreateColleaguePage', () => {
  it('renders the form with all required fields', () => {
    renderWithAuth(<CreateColleaguePage />)
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/initial password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows success message on successful creation', async () => {
    server.use(
      http.post('http://localhost:8000/api/admin/colleagues/', () => {
        return HttpResponse.json({
          id: 5,
          email: 'jane@airassist.com',
          first_name: 'Jane',
          last_name: 'Smith',
          message: 'Colleague account created successfully.',
        }, { status: 201 })
      })
    )

    renderWithAuth(<CreateColleaguePage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/email/i), 'jane@airassist.com')
    await user.type(screen.getByLabelText(/initial password/i), 'Welcome123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Colleague account created successfully.')
    })
  })

  it('shows error message on duplicate email', async () => {
    server.use(
      http.post('http://localhost:8000/api/admin/colleagues/', () => {
        return HttpResponse.json({
          email: ['A user with this email already exists.'],
        }, { status: 400 })
      })
    )

    renderWithAuth(<CreateColleaguePage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/email/i), 'existing@airassist.com')
    await user.type(screen.getByLabelText(/initial password/i), 'Welcome123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('clears form after successful creation', async () => {
    server.use(
      http.post('http://localhost:8000/api/admin/colleagues/', () => {
        return HttpResponse.json({
          id: 5,
          email: 'jane@airassist.com',
          first_name: 'Jane',
          last_name: 'Smith',
          message: 'Colleague account created successfully.',
        }, { status: 201 })
      })
    )

    renderWithAuth(<CreateColleaguePage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/email/i), 'jane@airassist.com')
    await user.type(screen.getByLabelText(/initial password/i), 'Welcome123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue('')
      expect(screen.getByLabelText(/last name/i)).toHaveValue('')
      expect(screen.getByLabelText(/email/i)).toHaveValue('')
      expect(screen.getByLabelText(/initial password/i)).toHaveValue('')
    })
  })
})
