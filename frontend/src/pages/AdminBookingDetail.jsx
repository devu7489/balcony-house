import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import Select from '../components/Select'
import { roomNumberOptions } from '../lib/roomNumbers'

const todayIso = () => new Date().toISOString().slice(0, 10)

export default function AdminBookingDetail() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionStatus, setActionStatus] = useState('idle')
  const [actionError, setActionError] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradePropertyId, setUpgradePropertyId] = useState('')
  const [upgradePreview, setUpgradePreview] = useState(null)
  const [upgradeStatus, setUpgradeStatus] = useState('idle')
  const [upgradeError, setUpgradeError] = useState('')
  const [roomNumberError, setRoomNumberError] = useState('')

  const load = () => apiClient.get(`/admin/bookings/${id}`)
    .then(({ data }) => setBooking(data))
    .catch(() => setNotFound(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    apiClient.get('/properties').then(({ data }) => setProperties(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!upgradePropertyId || !booking) { setUpgradePreview(null); return }
    apiClient.get(`/properties/${upgradePropertyId}/availability`, {
      params: { checkIn: booking.checkIn, checkOut: booking.checkOut },
    }).then(({ data }) => setUpgradePreview(data)).catch(() => setUpgradePreview(null))
  }, [upgradePropertyId, booking])

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

  const saveRoomNumber = async (roomNumber) => {
    setRoomNumberError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/room-number`, { roomNumber })
      await load()
    } catch (err) {
      setRoomNumberError(err.response?.data?.message || 'Could not save that room number, please try again.')
    }
  }

  const confirmUpgrade = async () => {
    setUpgradeStatus('running')
    setUpgradeError('')
    try {
      const wasConfirmed = booking.status === 'CONFIRMED'
      await apiClient.post(`/admin/bookings/${id}/upgrade`, { newPropertyId: Number(upgradePropertyId) })
      setShowUpgrade(false)
      setUpgradePropertyId('')
      setUpgradePreview(null)
      await load()
      if (wasConfirmed) await runAction('check-in')
    } catch (err) {
      setUpgradeError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setUpgradeStatus('idle')
    }
  }

  const markAsPaid = async (e) => {
    e.preventDefault()
    setActionStatus('running')
    setActionError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/payment`, {
        amount: paymentAmount === '' ? null : Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference || null,
      })
      setShowPaymentForm(false)
      setPaymentAmount('')
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
  const fullTotal = booking.amount != null
    ? Number(booking.amount) + Number(booking.childcareFee || 0) + Number(booking.fullBoardFee || 0) - Number(booking.discountAmount || 0)
    : 0
  const amountPaidSoFar = Number(booking.amountPaid || 0)
  const balanceDue = fullTotal - amountPaidSoFar
  const currentProperty = properties.find((p) => p.id === booking.propertyId)
  const roomNumbers = roomNumberOptions(currentProperty)
  const otherProperties = properties.filter((p) => p.id !== booking.propertyId)
  const nights = booking.checkIn && booking.checkOut
    ? Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)
    : 0
  const elapsedNights = booking.checkIn
    ? Math.min(Math.max(Math.round((new Date(todayIso()) - new Date(booking.checkIn)) / 86400000), 0), nights)
    : 0
  const remainingNights = nights - elapsedNights
  const upgradeNewPerNight = upgradePreview ? upgradePreview.pricePerNight : null
  const upgradeNewAmount = upgradeNewPerNight != null
    ? (Number(booking.amount || 0) / (nights || 1)) * elapsedNights + upgradeNewPerNight * remainingNights
    : null
  const upgradeDelta = upgradeNewAmount != null ? upgradeNewAmount - Number(booking.amount || 0) : null
  const canChangeRoom = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN'

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
            <div>
              <dt className="text-charcoal/50">Room number</dt>
              <dd>
                <Select
                  value={booking.roomNumber || ''}
                  onChange={(e) => saveRoomNumber(e.target.value)}
                  disabled={booking.status === 'CHECKED_OUT' || booking.status === 'CANCELLED'}
                  className="mt-0.5 w-28 text-sm px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {roomNumbers.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
                {roomNumberError && <p className="text-xs text-red-600 mt-1 break-words">{roomNumberError}</p>}
              </dd>
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
                {booking.paymentStatus !== 'PAID' && amountPaidSoFar > 0 && (
                  <p className="text-sm text-olive w-full">
                    Already paid ₹{amountPaidSoFar.toLocaleString()} &middot; Balance due ₹{balanceDue.toLocaleString()}
                  </p>
                )}
                {booking.paymentStatus !== 'PAID' && !showPaymentForm && (
                  <button
                    onClick={() => { setPaymentAmount(balanceDue > 0 ? String(balanceDue) : ''); setShowPaymentForm(true) }}
                    className="text-sm text-olive hover:underline"
                  >
                    {amountPaidSoFar > 0 ? `Record remaining ₹${balanceDue.toLocaleString()}` : 'Mark as paid'}
                  </button>
                )}
              </div>

              {booking.payments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone">
                  <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Payment history</p>
                  <div className="space-y-1.5">
                    {booking.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                        <span className="text-charcoal/80">
                          ₹{Number(p.amount).toLocaleString()} &middot; {p.method}
                          {p.reference ? ` (${p.reference})` : ''}
                        </span>
                        <span className="text-charcoal/50 text-xs">
                          {new Date(p.paidAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showPaymentForm && (
                <form onSubmit={markAsPaid} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone">
                  <label className="text-sm text-charcoal/70">
                    Amount
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                    />
                  </label>
                  <label className="text-sm text-charcoal/70">
                    Method
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 px-3 py-2.5"
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                      <option>Card</option>
                      <option>Other</option>
                    </Select>
                  </label>
                  <label className="text-sm text-charcoal/70 col-span-1 sm:col-span-2">
                    Reference <span className="text-charcoal/40">(optional)</span>
                    <input
                      placeholder="txn id / notes"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                    />
                  </label>
                  <div className="col-span-1 sm:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={actionStatus === 'running'}
                      className="px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 text-sm"
                    >
                      Confirm payment
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPaymentForm(false); setPaymentAmount('') }}
                      className="text-sm text-charcoal/60 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {!booking.bookingGroupId && canChangeRoom && (
            <div className="mb-6 border border-stone rounded-lg p-4 overflow-hidden">
              {!showUpgrade ? (
                <button onClick={() => setShowUpgrade(true)} className="text-sm text-olive hover:underline">
                  Change room
                </button>
              ) : (
                <div>
                  <p className="text-sm text-charcoal/70 mb-3">
                    {booking.status === 'CHECKED_IN'
                      ? 'Move this guest to a different room for the rest of their stay.'
                      : 'Move this booking to a different room type before checking in.'}
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                    <div>
                      <dt className="text-charcoal/50 text-xs">Current room</dt>
                      <dd className="text-charcoal/80">{booking.propertyName}</dd>
                    </div>
                    <div>
                      <dt className="text-charcoal/50 text-xs">Change to</dt>
                      <dd>
                        <Select
                          value={upgradePropertyId}
                          onChange={(e) => setUpgradePropertyId(e.target.value)}
                          className="w-full px-3 py-2 text-sm"
                        >
                          <option value="">Select a room</option>
                          {otherProperties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </Select>
                      </dd>
                    </div>
                  </dl>
                  {elapsedNights > 0 && (
                    <p className="text-xs text-charcoal/50 mb-3">
                      {elapsedNights} night{elapsedNights === 1 ? '' : 's'} already stayed (billed at the current room's rate) &middot;{' '}
                      {remainingNights} night{remainingNights === 1 ? '' : 's'} remaining at the new room's rate.
                    </p>
                  )}
                  {upgradePropertyId && upgradeNewAmount != null && (
                    <p className="text-sm text-olive mb-3 break-words">
                      {booking.paymentStatus === 'PAID'
                        ? upgradeDelta > 0
                          ? `Remaining to collect: ₹${Math.round(upgradeDelta).toLocaleString()} (new total ₹${Math.round(upgradeNewAmount).toLocaleString()})`
                          : `Refund due: ₹${Math.round(Math.abs(upgradeDelta)).toLocaleString()} (new total ₹${Math.round(upgradeNewAmount).toLocaleString()})`
                        : `New total: ₹${Math.round(upgradeNewAmount).toLocaleString()}`}
                    </p>
                  )}
                  {upgradeError && <p className="text-sm text-red-600 mb-3 break-words">{upgradeError}</p>}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={confirmUpgrade}
                      disabled={!upgradePropertyId || upgradeStatus === 'running'}
                      className="px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 text-sm"
                    >
                      {booking.status === 'CONFIRMED' ? 'Confirm change & check in' : 'Confirm change'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowUpgrade(false); setUpgradePropertyId(''); setUpgradePreview(null); setUpgradeError('') }}
                      className="text-sm text-charcoal/60 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!booking.bookingGroupId && (
            <div className="flex flex-wrap gap-3 items-center">
              {booking.status === 'CONFIRMED' && (
                <>
                  <button
                    onClick={() => runAction('check-in')}
                    disabled={actionStatus === 'running' || !booking.roomNumber}
                    className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
                  >
                    Check-in
                  </button>
                  {!booking.roomNumber && (
                    <p className="text-xs text-charcoal/50">Assign a room number above before checking in.</p>
                  )}
                </>
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
                  onClick={() => window.confirm('Cancel this booking? This can\'t be undone.') && runAction('cancel')}
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
