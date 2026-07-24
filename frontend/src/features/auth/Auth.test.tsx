import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuthProvider, useAuth } from './AuthContext'
import { LoginPage } from './LoginPage'
import { ChangePasswordPage } from './ChangePasswordPage'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithAuth(<LoginPage />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error on invalid credentials', async () => {
    server.use(
      http.post('http://localhost:8000/api/auth/login/', () => {
        return HttpResponse.json(
          { non_field_errors: ['Invalid email or password.'] },
          { status: 400 }
        )
      })
    )

    renderWithAuth(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.')
    })
  })

  it('stores auth on successful login', async () => {
    server.use(
      http.post('http://localhost:8000/api/auth/login/', () => {
        return HttpResponse.json({
          token: 'abc123',
          must_change_password: true,
          user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
        })
      })
    )

    renderWithAuth(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('auth')!)
      expect(stored.token).toBe('abc123')
      expect(stored.mustChangePassword).toBe(true)
    })
  })
})

describe('ChangePasswordPage', () => {
  function renderChangePassword() {
    // Pre-set auth state
    localStorage.setItem(
      'auth',
      JSON.stringify({
        token: 'abc123',
        user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
        mustChangePassword: true,
      })
    )
    return renderWithAuth(<ChangePasswordPage />)
  }

  it('renders change password form', () => {
    renderChangePassword()

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    renderChangePassword()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/new password/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different1')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.')
    })
  })

  it('shows error when password too short', async () => {
    renderChangePassword()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/new password/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters.')
    })
  })

  it('successfully changes password', async () => {
    server.use(
      http.post('http://localhost:8000/api/auth/change-password/', () => {
        return HttpResponse.json({
          detail: 'Password changed successfully.',
          token: 'newtoken456',
        })
      })
    )

    renderChangePassword()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/new password/i), 'newpass1234')
    await user.type(screen.getByLabelText(/confirm password/i), 'newpass1234')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('auth')!)
      expect(stored.token).toBe('newtoken456')
      expect(stored.mustChangePassword).toBe(false)
    })
  })
})
