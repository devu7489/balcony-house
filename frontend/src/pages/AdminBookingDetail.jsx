import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'

export default function AdminBookingDetail() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionStatus, setActionStatus] = useState('idle')
  const [actionError, setActionError] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentReference, setPaymentReference] = useState('')

  const load = () => apiClient.get(`/admin/bookings/${id}`)
    .then(({ data }) => setBooking(data))
    .catch(() => setNotFound(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  const runAction = async (action) => {
    setActionStatus('running')
    setActionError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/${action}`)
      await load()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setActionStatus('idle')
    }
  }

  const markAsPaid = async (e) => {
    e.preventDefault()
    setActionStatus('running')
    setActionError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/payment`, {
        method: paymentMethod,
        reference: paymentReference || null,
      })
      setShowPaymentForm(false)
      setPaymentReference('')
      await load()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setActionStatus('idle')
    }
  }

  if (loading) return <LoadingScreen label="Loading booking" />
  if (notFound || !booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">This booking doesn't exist.</h1>
        <Link to="/admin" className="text-olive hover:underline">Back to Admin</Link>
      </div>
    )
  }

  const guestLine = [booking.guestName, booking.guestEmail, booking.guestPhone].filter(Boolean).join(' · ')

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/admin" className="text-sm text-olive hover:underline">&larr; Back to Admin</Link>

      <div className="mt-6 bg-white border border-stone rounded-xl2 overflow-hidden">
        <div
          className="h-56 bg-cover bg-center bg-stone"
          style={{ backgroundImage: booking.propertyHeroImageUrl ? `url(${booking.propertyHeroImageUrl})` : undefined }}
        />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-serif text-2xl">{booking.propertyName || `Room #${booking.propertyId}`}</h1>
            <StatusBadge status={booking.status} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <dt className="text-charcoal/50">Guest</dt>
              <dd className="text-charcoal/80">{guestLine || '—'}</dd>
            </div>
            <div>
              <dt className="text-charcoal/50">Guests</dt>
              <dd className="text-charcoal/80">{booking.guests}</dd>
            </div>
            <div>
              <dt className="text-charcoal/50">Check-in</dt>
              <dd className="text-charcoal/80">{booking.checkIn}</dd>
            </div>
            <div>
              <dt className="text-charcoal/50">Check-out</dt>
              <dd className="text-charcoal/80">{booking.checkOut}</dd>
            </div>
          </dl>

          {booking.notes && (
            <div className="mb-6 bg-stone/50 border border-stone rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Special request</p>
              <p className="text-charcoal/80 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {booking.status !== 'CANCELLED' && (
            <div className="mb-6 border border-stone rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {booking.amount != null && (
                    <span className="font-serif text-lg">
                      ₹{(
                        Number(booking.amount) + Number(booking.childcareFee || 0) + Number(booking.fullBoardFee || 0)
                        - Number(booking.discountAmount || 0)
                      ).toLocaleString()}
                    </span>
                  )}
                  <PaymentBadge status={booking.paymentStatus} />
                </div>
                {booking.childrenCount > 0 && (
                  <p className="text-sm text-charcoal/60">
                    incl. Kids Play Zone &middot; {booking.childrenCount} child{booking.childrenCount === 1 ? '' : 'ren'} &middot; ₹{Number(booking.childcareFee).toLocaleString()}
                  </p>
                )}
                {booking.fullBoard && (
                  <p className="text-sm text-charcoal/60">
                    incl. Full Board &middot; ₹{Number(booking.fullBoardFee).toLocaleString()}
                  </p>
                )}
                {booking.discountPercent > 0 && (
                  <p className="text-sm text-charcoal/60">
                    {booking.discountPercent}% discount &middot; -₹{Number(booking.discountAmount).toLocaleString()}
                  </p>
                )}
                {(booking.paymentMethod || booking.paymentReference) && (
                  <p className="text-sm text-charcoal/60">
                    {[booking.paymentMethod, booking.paymentReference].filter(Boolean).join(' · ')}
                  </p>
                )}
                {booking.paymentStatus !== 'PAID' && !showPaymentForm && (
                  <button onClick={() => setShowPaymentForm(true)} className="text-sm text-olive hover:underline">
                    Mark as paid
                  </button>
                )}
              </div>

              {showPaymentForm && (
                <form onSubmit={markAsPaid} className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone">
                  <label className="text-sm text-charcoal/70">
                    Method
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive bg-white"
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                      <option>Card</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="text-sm text-charcoal/70">
                    Reference <span className="text-charcoal/40">(optional)</span>
                    <input
                      placeholder="txn id / notes"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                    />
                  </label>
                  <div className="col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={actionStatus === 'running'}
                      className="px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 text-sm"
                    >
                      Confirm payment
                    </button>
                    <button type="button" onClick={() => setShowPaymentForm(false)} className="text-sm text-charcoal/60 hover:underline">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {!booking.bookingGroupId && (
            <div className="flex flex-wrap gap-3">
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => runAction('check-in')}
                  disabled={actionStatus === 'running'}
                  className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
                >
                  Check-in
                </button>
              )}
              {booking.status === 'CHECKED_IN' && (
                <button
                  onClick={() => runAction('check-out')}
                  disabled={actionStatus === 'running'}
                  className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
                >
                  Check-out
                </button>
              )}
              {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
                <button
                  onClick={() => runAction('cancel')}
                  disabled={actionStatus === 'running'}
                  className="px-6 py-2.5 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel booking
                </button>
              )}
            </div>
          )}

          {booking.bookingGroupId && (
            <p className="text-xs text-charcoal/50">
              This room is part of a multi-room trip — manage check-in, check-out, and cancellation from the{' '}
              <Link to={`/admin/trips/${booking.bookingGroupId}`} className="underline">trip page</Link>.
            </p>
          )}

          {actionError && <p className="text-red-600 text-sm mt-4">{actionError}</p>}
        </div>
      </div>
    </div>
  )
}
