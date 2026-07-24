import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { CaseEntryForm } from './features/case-entry/CaseEntryForm'
import { AuthProvider, useAuth, LoginPage, ChangePasswordPage } from './features/auth'
import { UserManagementPage } from './features/user-management'
import './App.css'

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

  const isAdmin = user?.is_staff === true

  return (
    <Routes>
      <Route path="/" element={
        <>
          <header className="app-header">
            <span>AirAssist</span>
            <nav className="app-nav">
              {isAdmin && <Link to="/users" className="nav-link">Users</Link>}
              <button onClick={logout} className="logout-btn">Logout</button>
            </nav>
          </header>
          <CaseEntryForm />
        </>
      } />
      {isAdmin && (
        <Route path="/users" element={
          <>
            <header className="app-header">
              <span>AirAssist</span>
              <nav className="app-nav">
                <Link to="/" className="nav-link">Cases</Link>
                <button onClick={logout} className="logout-btn">Logout</button>
              </nav>
            </header>
            <UserManagementPage />
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
