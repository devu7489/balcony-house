import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import { groupBookings } from '../lib/groupBookings'
import Select from '../components/Select'
import { cancellationConfirmMessage } from '../lib/cancellationPolicy'

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
  const [sortBy, setSortBy] = useState('bookingTime')

  const load = () => apiClient.get('/bookings/mine').then(({ data }) => setBookings(data))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const cancelBooking = async (b) => {
    const message = cancellationConfirmMessage(b.checkIn, b.checkOut, false)
    if (!window.confirm(message)) return
    setCancellingKey(b.id)
    try {
      await apiClient.post(`/bookings/${b.id}/cancel`)
      await load()
    } finally {
      setCancellingKey(null)
    }
  }

  const cancelTrip = async (entry) => {
    const message = cancellationConfirmMessage(entry.bookings[0].checkIn, entry.bookings[0].checkOut, true)
    if (!window.confirm(message)) return
    setCancellingKey(entry.bookingGroupId)
    try {
      await apiClient.post(`/bookings/group/${entry.bookingGroupId}/cancel`)
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

  const sortedBookings = sortBy === 'checkIn'
    ? [...bookings].sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    : [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const entries = groupBookings(sortedBookings)

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
        <h1 className="font-serif text-4xl">Your bookings</h1>
        {bookings.length > 1 && (
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sm:w-56 px-4 py-2 text-sm"
          >
            <option value="bookingTime">Sort: Booking time (newest)</option>
            <option value="checkIn">Sort: Check-in date</option>
          </Select>
        )}
      </div>

      {bookings.length > 0 && (
        <p className="text-xs text-charcoal/40 -mt-8 mb-8">
          Invoices are emailed to you at booking and again at check-out — check your inbox.
        </p>
      )}

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
                          onClick={() => cancelBooking(b)}
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
            // A room change can reset just one room in the trip back to PENDING while the
            // others stay PAID, so the trip is only truly settled if every active room is.
            const paymentStatus = entry.bookings
              .filter((b) => b.status !== 'CANCELLED')
              .every((b) => b.paymentStatus === 'PAID') ? 'PAID' : 'PENDING'
            const total = totalAmount(entry.bookings)
            return (
              <div key={entry.bookingGroupId} className="bg-white border border-stone rounded-xl2 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">
                      Trip &middot; {entry.bookings.length} rooms
                      <span className="hidden sm:inline"> &middot; </span>
                      <br className="sm:hidden" />
                      {entry.bookings[0].checkIn} &rarr; {entry.bookings[0].checkOut}
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
                  <div className="flex items-center gap-4 sm:shrink-0">
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
                        onClick={() => cancelTrip(entry)}
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
