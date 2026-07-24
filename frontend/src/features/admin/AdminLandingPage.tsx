import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { fetchAdminNavigation, type NavigationSection } from './api'

const sectionIcons: Record<string, string> = {
  'new-user': '👤',
  users: '👥',
  cases: '📋',
  system: '⚙️',
}

export function AdminLandingPage() {
  const { token } = useAuth()
  const [sections, setSections] = useState<NavigationSection[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetchAdminNavigation(token)
      .then((data) => setSections(data.sections))
      .catch(() => setError('Failed to load navigation.'))
  }, [token])

  return (
    <div>
      <div className="page-hero">
        <div className="hero-eyebrow">Admin Dashboard</div>
        <h1 className="hero-title">Welcome to AirAssist Admin</h1>
        <p className="hero-copy">
          Manage users, cases, and system settings from one central dashboard.
        </p>
      </div>

      {error && <div className="alert" style={{ marginTop: 16 }}>{error}</div>}

      <div className="admin-card-grid" data-testid="admin-nav-grid">
        {sections.map((section) => (
          <Link
            key={section.key}
            to={section.path}
            className="admin-card"
            data-testid={`admin-card-${section.key}`}
          >
            <span className="admin-card-icon">{sectionIcons[section.key] ?? '📄'}</span>
            <h2 className="admin-card-title">{section.label}</h2>
            <p className="admin-card-desc">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
