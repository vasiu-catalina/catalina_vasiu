import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CaseEntryForm } from './features/case-entry/CaseEntryForm'
import { AuthProvider, useAuth, LoginPage, ChangePasswordPage } from './features/auth'
import './App.css'

function AppRoutes() {
  const { isAuthenticated, mustChangePassword, logout } = useAuth()

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

  return (
    <Routes>
      <Route path="/" element={
        <>
          <header className="app-header">
            <span>AirAssist</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </header>
          <CaseEntryForm />
        </>
      } />
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
