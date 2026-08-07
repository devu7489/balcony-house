import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { clearCart } from '../lib/cart'

const AuthContext = createContext(null)
const POST_LOGIN_REDIRECT_KEY = 'balconyhouse:post-login-redirect'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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

  // Runs once per fresh sign-in: if login() stashed the page the user was on before
  // being sent to Google, jump back there now instead of leaving them on the home
  // page the OAuth success handler always redirects to server-side.
  useEffect(() => {
    if (loading || !user) return
    const redirectTo = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
    if (!redirectTo) return
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    if (redirectTo !== window.location.pathname + window.location.search) {
      navigate(redirectTo, { replace: true })
    }
  }, [loading, user, navigate])

  const login = () => {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, window.location.pathname + window.location.search)
    window.location.href = '/oauth2/authorization/google'
  }

  const logout = async () => {
    await apiClient.post('/auth/logout')
    setUser(null)
    clearCart()
    navigate('/')
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
