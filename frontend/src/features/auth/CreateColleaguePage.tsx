import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { createColleague, getAuthErrorMessage } from './api'

export function CreateColleaguePage() {
  const { token } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await createColleague(token!, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      })
      setSuccess(response.message)
      // Clear form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h1>Create Colleague Account</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message" role="alert">{error}</div>}
        {success && <div className="success-message" role="status">{success}</div>}
        <div className="form-field">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            maxLength={128}
          />
        </div>
        <div className="form-field">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
            maxLength={128}
          />
        </div>
        <div className="form-field">
          <label htmlFor="colleagueEmail">Email</label>
          <input
            id="colleagueEmail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="initialPassword">Initial Password</label>
          <input
            id="initialPassword"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <small>Minimum 8 characters. Will be sent to the colleague via email.</small>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
