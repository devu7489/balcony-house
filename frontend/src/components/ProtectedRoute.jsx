import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

// Booking/guest-only routes. Because auth state lives in the session cookie,
// this simply checks the already-fetched `user` from AuthContext.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen label="Checking your session" />
  if (!user) return <Navigate to="/" state={{ from: location, needsAuth: true }} replace />
  return children
}
