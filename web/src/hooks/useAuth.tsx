import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  setAuth: () => {},
  clearAuth: () => {},
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('nova_user')
    return u ? JSON.parse(u) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nova_token')
  })

  const setAuth = useCallback((t: string, u: User) => {
    localStorage.setItem('nova_token', t)
    localStorage.setItem('nova_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('nova_token')
    localStorage.removeItem('nova_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, setAuth, clearAuth, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
