import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { CaseEntryForm } from './features/case-entry/CaseEntryForm'
import { AuthProvider, useAuth, LoginPage, ChangePasswordPage, CreateColleaguePage } from './features/auth'
import { CaseManagementPage } from './features/case-management'
import { UserManagementPage } from './features/user-management'
import { AdminLandingPage, SystemPage } from './features/admin'
import './App.css'

function AdminHeader() {
  const { logout } = useAuth()
  const location = useLocation()
  const path = location.pathname

  return (
    <header className="app-header">
      <Link to="/admin-dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>AirAssist</Link>
      <nav className="app-nav">
        <Link to="/admin-dashboard" className={`nav-link${path === '/admin-dashboard' ? ' active' : ''}`}>Dashboard</Link>
        <Link to="/cases" className={`nav-link${path === '/cases' ? ' active' : ''}`}>Cases</Link>
        <Link to="/users" className={`nav-link${path === '/users' ? ' active' : ''}`}>Users</Link>
        <Link to="/admin/create-colleague" className={`nav-link${path === '/admin/create-colleague' ? ' active' : ''}`}>New User</Link>
        <Link to="/admin/system" className={`nav-link${path === '/admin/system' ? ' active' : ''}`}>System</Link>
      </nav>
      <button onClick={logout} className="logout-btn">Logout</button>
    </header>
  )
}

function AppRoutes() {
  const { isAuthenticated, mustChangePassword, logout, user } = useAuth()

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

  return (
    <Routes>
      <Route path="/" element={
        isAdmin ? <Navigate to="/admin-dashboard" replace /> : (
          <>
            <header className="app-header">
              <span>AirAssist</span>
              <button onClick={logout} className="logout-btn">Logout</button>
            </header>
            <CaseEntryForm />
          </>
        )
      } />
      {isAdmin && (
        <Route path="/admin-dashboard" element={
          <>
            <AdminHeader />
            <AdminLandingPage />
          </>
        } />
      )}
      {isAdmin && (
        <Route path="/admin/system" element={
          <>
            <AdminHeader />
            <SystemPage />
          </>
        } />
      )}
      {isAdmin && (
        <Route path="/cases" element={
          <>
            <AdminHeader />
            <CaseManagementPage />
          </>
        } />
      )}
      {isAdmin && (
        <Route path="/users" element={
          <>
            <AdminHeader />
            <UserManagementPage />
          </>
        } />
      )}
      {isAdmin && (
        <Route path="/admin/create-colleague" element={
          <>
            <AdminHeader />
            <CreateColleaguePage />
          </>
        } />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <main className="app-shell">
          <AppRoutes />
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
