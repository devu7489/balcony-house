import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/auth/me')
      setUser(data ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onExpired = () => setUser(null)
    window.addEventListener('balconyhouse:session-expired', onExpired)
    return () => window.removeEventListener('balconyhouse:session-expired', onExpired)
  }, [refresh])

  const login = () => {
    window.location.href = '/oauth2/authorization/google'
  }

  const logout = async () => {
    await apiClient.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
