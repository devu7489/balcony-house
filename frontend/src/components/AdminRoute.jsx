import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

// Admin-only routes. Mirrors ProtectedRoute but also requires the isAdmin
// flag from GET /api/auth/me (granted server-side via app.admin-emails).
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen label="Checking access" />
  if (!user || !user.isAdmin) return <Navigate to="/" state={{ from: location }} replace />
  return children
}
