import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { CaseEntryForm } from './features/case-entry/CaseEntryForm'
import { AuthProvider, useAuth, LoginPage, ChangePasswordPage, CreateColleaguePage } from './features/auth'
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

  const isAdmin = user?.role === 'admin'

  return (
    <Routes>
      <Route path="/" element={
        <>
          <header className="app-header">
            <span>AirAssist</span>
            <nav className="app-nav">
              {isAdmin && <Link to="/admin/create-colleague" className="nav-link">Create Colleague</Link>}
            </nav>
            <button onClick={logout} className="logout-btn">Logout</button>
          </header>
          <CaseEntryForm />
        </>
      } />
      {isAdmin && (
        <Route path="/admin/create-colleague" element={
          <>
            <header className="app-header">
              <span>AirAssist</span>
              <nav className="app-nav">
                <Link to="/" className="nav-link">Cases</Link>
                <Link to="/admin/create-colleague" className="nav-link active">Create Colleague</Link>
              </nav>
              <button onClick={logout} className="logout-btn">Logout</button>
            </header>
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
