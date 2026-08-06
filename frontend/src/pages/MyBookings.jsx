import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import { groupBookings } from '../lib/groupBookings'

const isCancellable = (status) => status === 'CONFIRMED' || status === 'CHECKED_IN'

function RoomLine({ b }) {
  return (
    <div className="flex gap-4 items-center p-4">
      <div
        className="w-24 h-24 rounded-lg bg-stone bg-cover bg-center shrink-0"
        style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
      />
      <div className="flex-1">
        <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
        <p className="text-charcoal/70 text-sm">{b.checkIn} &rarr; {b.checkOut}</p>
        <p className="text-charcoal/60 text-sm">{b.guests} guest{b.guests === 1 ? '' : 's'}</p>
      </div>
      <StatusBadge status={b.status} />
    </div>
  )
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingKey, setCancellingKey] = useState(null)

  const load = () => apiClient.get('/bookings/mine').then(({ data }) => setBookings(data))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const cancelBooking = async (id) => {
    setCancellingKey(id)
    try {
      await apiClient.post(`/bookings/${id}/cancel`)
      await load()
    } finally {
      setCancellingKey(null)
    }
  }

  const cancelTrip = async (groupId) => {
    setCancellingKey(groupId)
    try {
      await apiClient.post(`/bookings/group/${groupId}/cancel`)
      await load()
    } finally {
      setCancellingKey(null)
    }
  }

  if (loading) return <LoadingScreen label="Gathering your bookings" />

  const entries = groupBookings(bookings)

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
          {entries.map((entry) => {
            if (entry.type === 'single') {
              const b = entry.booking
              return (
                <div key={b.id} className="bg-white border border-stone rounded-xl2">
                  <RoomLine b={b} />
                  {isCancellable(b.status) && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancellingKey === b.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        {cancellingKey === b.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              )
            }

            const anyCancellable = entry.bookings.some((b) => isCancellable(b.status))
            return (
              <div key={entry.bookingGroupId} className="bg-white border border-stone rounded-xl2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wide text-charcoal/50">
                    Trip &middot; {entry.bookings.length} rooms
                  </p>
                  {anyCancellable && (
                    <button
                      onClick={() => cancelTrip(entry.bookingGroupId)}
                      disabled={cancellingKey === entry.bookingGroupId}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      {cancellingKey === entry.bookingGroupId ? 'Cancelling…' : 'Cancel trip'}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-stone">
                  {entry.bookings.map((b) => <RoomLine key={b.id} b={b} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
