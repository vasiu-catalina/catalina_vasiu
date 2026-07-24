import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthUser {
  id: number
  email: string
  first_name: string
  last_name: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  mustChangePassword: boolean
}

interface AuthContextType extends AuthState {
  setAuth: (token: string, user: AuthUser, mustChangePassword: boolean) => void
  updateToken: (token: string) => void
  clearMustChangePassword: () => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function loadStoredAuth(): AuthState {
  const stored = localStorage.getItem('auth')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return { token: null, user: null, mustChangePassword: false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStoredAuth)

  const setAuth = useCallback((token: string, user: AuthUser, mustChangePassword: boolean) => {
    const newState = { token, user, mustChangePassword }
    setState(newState)
    localStorage.setItem('auth', JSON.stringify(newState))
  }, [])

  const updateToken = useCallback((token: string) => {
    setState(prev => {
      const newState = { ...prev, token }
      localStorage.setItem('auth', JSON.stringify(newState))
      return newState
    })
  }, [])

  const clearMustChangePassword = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, mustChangePassword: false }
      localStorage.setItem('auth', JSON.stringify(newState))
      return newState
    })
  }, [])

  const logout = useCallback(() => {
    setState({ token: null, user: null, mustChangePassword: false })
    localStorage.removeItem('auth')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setAuth,
        updateToken,
        clearMustChangePassword,
        logout,
        isAuthenticated: !!state.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
