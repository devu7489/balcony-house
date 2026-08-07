import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import { groupBookings } from '../lib/groupBookings'

const isCancellable = (status) => status === 'CONFIRMED' || status === 'CHECKED_IN'
const totalAmount = (bookings) =>
  bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  + Number(bookings[0]?.childcareFee || 0)
  + Number(bookings[0]?.fullBoardFee || 0)

function RoomLine({ b, showDates = true }) {
  return (
    <div className="flex gap-4 items-center p-4">
      <div
        className="w-24 h-24 rounded-lg bg-stone bg-cover bg-center shrink-0"
        style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
      />
      <div className="flex-1">
        <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
        {showDates && <p className="text-charcoal/70 text-sm">{b.checkIn} &rarr; {b.checkOut}</p>}
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

  const [payingKey, setPayingKey] = useState(null)
  const payTrip = async (groupId) => {
    setPayingKey(groupId)
    try {
      await apiClient.post(`/bookings/group/${groupId}/pay`)
      await load()
    } finally {
      setPayingKey(null)
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
              const cancelled = b.status === 'CANCELLED'
              return (
                <div key={b.id} className="bg-white border border-stone rounded-xl2">
                  <RoomLine b={b} />
                  {b.childrenCount > 0 && (
                    <p className="px-4 text-xs text-charcoal/50">Kids Play Zone &middot; {b.childrenCount} child{b.childrenCount === 1 ? '' : 'ren'}</p>
                  )}
                  {b.fullBoard && <p className="px-4 text-xs text-charcoal/50">Full Board</p>}
                  <div className="px-4 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {b.amount != null && <span className="text-sm text-charcoal/60">₹{totalAmount([b]).toLocaleString()}</span>}
                      {!cancelled && <PaymentBadge status={b.paymentStatus} />}
                    </div>
                    <div className="flex items-center gap-4">
                      {isCancellable(b.status) && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          disabled={cancellingKey === b.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {cancellingKey === b.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            const anyCancellable = entry.bookings.some((b) => isCancellable(b.status))
            const cancelled = entry.bookings.every((b) => b.status === 'CANCELLED')
            const paymentStatus = entry.bookings[0].paymentStatus
            const total = totalAmount(entry.bookings)
            return (
              <div key={entry.bookingGroupId} className="bg-white border border-stone rounded-xl2 p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">
                      Trip &middot; {entry.bookings.length} rooms &middot; {entry.bookings[0].checkIn} &rarr; {entry.bookings[0].checkOut}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-charcoal/70">₹{total.toLocaleString()}</span>
                      {!cancelled && <PaymentBadge status={paymentStatus} />}
                    </div>
                    {entry.bookings[0].childrenCount > 0 && (
                      <p className="text-xs text-charcoal/50 mt-1">
                        incl. Kids Play Zone &middot; {entry.bookings[0].childrenCount} child{entry.bookings[0].childrenCount === 1 ? '' : 'ren'}
                      </p>
                    )}
                    {entry.bookings[0].fullBoard && (
                      <p className="text-xs text-charcoal/50 mt-1">incl. Full Board</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {!cancelled && paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => payTrip(entry.bookingGroupId)}
                        disabled={payingKey === entry.bookingGroupId}
                        className="text-xs text-olive hover:underline disabled:opacity-50"
                      >
                        {payingKey === entry.bookingGroupId ? 'Processing…' : 'Pay now'}
                      </button>
                    )}
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
                </div>
                <div className="divide-y divide-stone">
                  {entry.bookings.map((b) => <RoomLine key={b.id} b={b} showDates={false} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
