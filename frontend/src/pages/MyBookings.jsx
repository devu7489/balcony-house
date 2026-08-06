import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const load = () => apiClient.get('/bookings/mine').then(({ data }) => setBookings(data))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const cancelBooking = async (id) => {
    setCancellingId(id)
    try {
      await apiClient.post(`/bookings/${id}/cancel`)
      await load()
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <LoadingScreen label="Gathering your bookings" />

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <h1 className="font-serif text-4xl mb-12">Your bookings</h1>

      {bookings.length === 0 ? (
        <div>
          <p className="text-charcoal/70 mb-6">You haven't booked a stay yet.</p>
          <Link to="/stay" className="inline-block px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors">
            Browse rooms
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="flex gap-4 items-center bg-white border border-stone rounded-xl2 p-4">
              <div
                className="w-24 h-24 rounded-lg bg-stone bg-cover bg-center shrink-0"
                style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
              />
              <div className="flex-1">
                <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
                <p className="text-charcoal/70 text-sm">{b.checkIn} &rarr; {b.checkOut}</p>
                <p className="text-charcoal/60 text-sm">{b.guests} guest{b.guests === 1 ? '' : 's'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={b.status} />
                {(b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    disabled={cancellingId === b.id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
