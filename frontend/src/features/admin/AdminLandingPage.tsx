import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { fetchAdminNavigation, type NavigationSection } from './api'
import { Alert } from '../../components/ui'

/**
 * Admin dashboard landing page.
 * Hero section uses a gradient card (secondary/accent interplay).
 * Navigation grid cards are interactive (hover lift, focus ring).
 * 8px grid: gap-4 (16px) between cards, gap-6 (24px) for sections.
 */

const sectionIcons: Record<string, React.ReactNode> = {
  'new-user': <UserPlusIcon />,
  users: <UsersGroupIcon />,
  cases: <DocumentIcon />,
  system: <CogIcon />,
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
      {/* Hero section — accent gradient on secondary background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-950 p-8 lg:p-10 text-white shadow-lg">
        <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium uppercase tracking-wider mb-4">
            Admin Dashboard
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome to AirAssist</h1>
        </div>
      </div>

      {error && <Alert variant="error" className="mt-6">{error}</Alert>}

      {/* Navigation cards grid — interactive cards with clear visual hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8" data-testid="admin-nav-grid">
        {sections.map((section) => (
          <Link
            key={section.key}
            to={section.path}
            data-testid={`admin-card-${section.key}`}
            className="group flex flex-col gap-3 p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-150">
              {sectionIcons[section.key] ?? <DocumentIcon />}
            </div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">{section.label}</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ===== Icon components ===== */

function UserPlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function UsersGroupIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function CogIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
