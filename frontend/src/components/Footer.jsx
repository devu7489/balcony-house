import { useState } from 'react'
import apiClient from '../api/axiosClient'
import { useHotelConfig } from '../context/HotelConfigContext'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const { hotelName, tagline, contactEmail, contactPhone } = useHotelConfig()

  const subscribe = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await apiClient.post('/newsletter/subscribe', { email })
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer className="bg-charcoal text-warmwhite mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-2xl mb-2">{hotelName}</h3>
          <p className="text-warmwhite/60 text-sm max-w-xs">{tagline}</p>
        </div>

        <div className="text-sm text-warmwhite/70 space-y-2">
          {contactEmail && <p>{contactEmail}</p>}
          {contactPhone && <p>{contactPhone}</p>}
          <div className="flex gap-4 pt-2">
            <a href="#" className="hover:text-warmwhite">Instagram</a>
            <a href="#" className="hover:text-warmwhite">Facebook</a>
          </div>
        </div>

        <form onSubmit={subscribe} className="text-sm">
          <p className="mb-3 text-warmwhite/70">Join our journal — occasional notes, never spam.</p>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 min-w-0 bg-transparent border border-warmwhite/30 rounded-full px-4 py-2 text-warmwhite placeholder:text-warmwhite/40 focus:outline-none focus:border-warmwhite"
            />
            <button className="px-5 py-2 rounded-full bg-warmwhite text-charcoal hover:bg-stone transition-colors">
              {status === 'sending' ? '...' : 'Join'}
            </button>
          </div>
          {status === 'done' && <p className="text-xs text-warmwhite/50 mt-2">Thank you — welcome.</p>}
          {status === 'error' && <p className="text-xs text-red-300 mt-2">Something went wrong. Try again.</p>}
        </form>
      </div>
      <div className="border-t border-warmwhite/10 text-center text-xs text-warmwhite/40 py-6">
        © {new Date().getFullYear()} {hotelName}. All rights reserved.
      </div>
    </footer>
  )
}
