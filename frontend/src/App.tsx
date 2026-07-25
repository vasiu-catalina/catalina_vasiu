import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { CaseEntryForm } from './features/case-entry/CaseEntryForm'
import { AuthProvider, useAuth, LoginPage, ChangePasswordPage, CreateColleaguePage } from './features/auth'
import { CaseManagementPage } from './features/case-management'
import { UserManagementPage } from './features/user-management'
import { AdminLandingPage, SystemPage } from './features/admin'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import './App.css'

/**
 * Sidebar navigation for admin users.
 * Uses NavLink for automatic active state highlighting.
 * All nav items meet 48px min touch target (min-h-12).
 * Visual hierarchy: current page uses accent indigo (10% rule),
 * rest uses secondary tones (30% rule) on dominant background (60%).
 */
function Sidebar() {
  const { logout, user } = useAuth()

  const navItems = [
    { to: '/admin-dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/cases', label: 'Cases', icon: CasesIcon },
    { to: '/users', label: 'Users', icon: UsersIcon },
    { to: '/admin/create-colleague', label: 'New User', icon: AddUserIcon },
    { to: '/admin/system', label: 'System', icon: SystemIcon },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800">
      {/* Brand — prominent, anchors the sidebar */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">AirAssist</span>
      </div>

      {/* Navigation — 8px grid spacing (space-y-1 = 4px, items have py giving 48px height) */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => [
              'flex items-center gap-3 min-h-12 px-3 rounded-lg',
              'text-sm font-medium transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800',
            ].join(' ')}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer — secondary information area */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full min-h-10 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

/**
 * Mobile header — shown below lg breakpoint.
 * Horizontal scrollable nav pills for space efficiency.
 */
function MobileHeader() {
  const { logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { to: '/admin-dashboard', label: 'Dashboard' },
    { to: '/cases', label: 'Cases' },
    { to: '/users', label: 'Users' },
    { to: '/admin/create-colleague', label: 'New User' },
    { to: '/admin/system', label: 'System' },
  ]

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 h-14">
        <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">AirAssist</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            className="min-h-10 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 px-4 pb-2 overflow-x-auto">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={[
              'shrink-0 min-h-9 px-3 py-1.5 rounded-full text-xs font-medium',
              'transition-colors duration-150',
              location.pathname === to
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800',
            ].join(' ')}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

/**
 * Top bar for desktop — holds theme toggle and utility controls.
 * Minimal height to preserve content area.
 */
function TopBar() {
  return (
    <div className="hidden lg:flex items-center justify-end h-16 px-8 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <ThemeToggle />
    </div>
  )
}

/**
 * Admin layout: sidebar + top bar + scrollable content.
 * Background uses dominant color (slate-50 / zinc-950) — 60% rule.
 */
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <TopBar />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Passenger layout — focused single-column for form entry.
 */
function PassengerLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-16">
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">AirAssist</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-zinc-400 hidden sm:inline">
              {user?.first_name} {user?.last_name}
            </span>
            <ThemeToggle />
            <button
              onClick={logout}
              className="min-h-10 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="px-4 py-8">
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, mustChangePassword, user } = useAuth()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    )
  }

  const isAdmin = user?.is_staff === true || user?.role === 'admin'

  if (!isAdmin) {
    return (
      <PassengerLayout>
        <Routes>
          <Route path="/" element={<CaseEntryForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PassengerLayout>
    )
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
        <Route path="/admin-dashboard" element={<AdminLandingPage />} />
        <Route path="/cases" element={<CaseManagementPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/admin/create-colleague" element={<CreateColleaguePage />} />
        <Route path="/admin/system" element={<SystemPage />} />
        <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
      </Routes>
    </AdminLayout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

/* ===== Sidebar Icon Components (Heroicons outline) ===== */

function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function CasesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function AddUserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
