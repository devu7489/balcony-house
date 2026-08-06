import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PROMPTED_KEY = 'balconyhouse:profilePrompted'

// Redirects a logged-in guest to /complete-profile once per browser session
// if they haven't saved a phone number yet. Doesn't trap them - if they
// navigate away without finishing, it won't fire again until next session.
export default function ProfilePrompt() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading || !user || user.phone) return
    if (location.pathname === '/complete-profile') return
    if (sessionStorage.getItem(PROMPTED_KEY)) return

    sessionStorage.setItem(PROMPTED_KEY, '1')
    navigate('/complete-profile', { state: { from: location } })
  }, [loading, user, location, navigate])

  return null
}
