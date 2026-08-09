import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import Select from '../components/Select'
import GuestDocuments from '../components/GuestDocuments'
import ActivityLog from '../components/ActivityLog'
import { roomNumberOptions } from '../lib/roomNumbers'
import { todayIso } from '../lib/dates'
import { cancellationConfirmMessage } from '../lib/cancellationPolicy'

export default function AdminTripDetail() {
  const { groupId } = useParams()
  const [bookings, setBookings] = useState(null)
  const [properties, setProperties] = useState([])
  const [docCounts, setDocCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionStatus, setActionStatus] = useState('idle')
  const [actionError, setActionError] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [upgradingBookingId, setUpgradingBookingId] = useState(null)
  const [upgradePropertyId, setUpgradePropertyId] = useState('')
  const [upgradePreview, setUpgradePreview] = useState(null)
  const [upgradeStatus, setUpgradeStatus] = useState('idle')
  const [upgradeError, setUpgradeError] = useState('')
  const [roomNumberErrors, setRoomNumberErrors] = useState({})

  const load = () => apiClient.get(`/admin/bookings/group/${groupId}`)
    .then(({ data }) => setBookings(data))
    .catch(() => setNotFound(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => {
    apiClient.get('/properties').then(({ data }) => setProperties(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!upgradePropertyId || !upgradingBookingId || !bookings) { setUpgradePreview(null); return }
    const b = bookings.find((x) => x.id === upgradingBookingId)
    if (!b) return
    apiClient.get(`/properties/${upgradePropertyId}/availability`, {
      params: { checkIn: b.checkIn, checkOut: b.checkOut },
    }).then(({ data }) => setUpgradePreview(data)).catch(() => setUpgradePreview(null))
  }, [upgradePropertyId, upgradingBookingId, bookings])

  const startUpgrade = (bookingId) => {
    setUpgradingBookingId(bookingId)
    setUpgradePropertyId('')
    setUpgradePreview(null)
    setUpgradeError('')
  }

  const cancelUpgrade = () => {
    setUpgradingBookingId(null)
    setUpgradePropertyId('')
    setUpgradePreview(null)
    setUpgradeError('')
  }

  const confirmUpgrade = async () => {
    setUpgradeStatus('running')
    setUpgradeError('')
    try {
      await apiClient.post(`/admin/bookings/${upgradingBookingId}/upgrade`, { newPropertyId: Number(upgradePropertyId) })
      cancelUpgrade()
      await load()
    } catch (err) {
      setUpgradeError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setUpgradeStatus('idle')
    }
  }

  const runAction = async (action) => {
    setActionStatus('running')
    setActionError('')
    try {
      await apiClient.post(`/admin/bookings/group/${groupId}/${action}`)
      await load()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setActionStatus('idle')
    }
  }

  const saveRoomNumber = async (bookingId, roomNumber) => {
    setRoomNumberErrors((prev) => ({ ...prev, [bookingId]: '' }))
    try {
      await apiClient.post(`/admin/bookings/${bookingId}/room-number`, { roomNumber })
      await load()
    } catch (err) {
      setRoomNumberErrors((prev) => ({
        ...prev,
        [bookingId]: err.response?.data?.message || 'Could not save that room number, please try again.',
      }))
    }
  }

  const markAsPaid = async (e) => {
    e.preventDefault()
    setActionStatus('running')
    setActionError('')
    try {
      await apiClient.post(`/admin/bookings/group/${groupId}/payment`, {
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

  if (loading) return <LoadingScreen label="Loading trip" />
  if (notFound || !bookings || bookings.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">This trip doesn't exist.</h1>
        <Link to="/admin/bookings" className="text-olive hover:underline">Back to Admin</Link>
      </div>
    )
  }

  const first = bookings[0]
  const guestContactLine = [first.guestEmail, first.guestPhone].filter(Boolean).join(' · ')
  const notes = bookings.map((b) => b.notes).find(Boolean)

  const anyConfirmed = bookings.some((b) => b.status === 'CONFIRMED')
  const anyCheckedIn = bookings.some((b) => b.status === 'CHECKED_IN')
  const missingRoomForCheckIn = bookings.some((b) => b.status === 'CONFIRMED' && !b.roomNumber)
  const missingDocForCheckIn = bookings.some((b) => b.status === 'CONFIRMED' && !docCounts[b.id])
  const tooEarlyForCheckIn = bookings.some((b) => b.status === 'CONFIRMED' && todayIso() < b.checkIn)
  const tooEarlyForCheckOut = bookings.some((b) => b.status === 'CHECKED_IN' && todayIso() < b.checkOut)
  const anyActive = anyConfirmed || anyCheckedIn
  const totalAmount = bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0)
    + Number(first.childcareFee || 0)
    + Number(first.fullBoardFee || 0)
  const amountPaidTotal = bookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0)
  const balanceDue = totalAmount - amountPaidTotal
  // Every active room must be individually PAID for the trip to be settled - a room
  // change can reset just one room to PENDING while the others stay PAID, so reading
  // only bookings[0]'s status (as this used to) can miss an outstanding balance entirely.
  const allActivePaid = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .every((b) => b.paymentStatus === 'PAID')
  const paymentStatus = allActivePaid ? 'PAID' : 'PENDING'
  const allPayments = bookings
    .flatMap((b) => (b.payments || []).map((p) => ({ ...p, roomName: b.propertyName })))
    .sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt))

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/admin/bookings" className="text-sm text-olive hover:underline">&larr; Back to Admin</Link>

      <div className="mt-6 bg-white border border-stone rounded-xl2 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Trip &middot; {bookings.length} rooms</p>
            <h1 className="font-serif text-2xl break-words">{first.guestName || 'Guest'}</h1>
            {guestContactLine && (
              <p className="text-sm text-charcoal/60 break-words">{guestContactLine}</p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <dt className="text-charcoal/50">Check-in</dt>
            <dd className="text-charcoal/80">{first.checkIn}</dd>
          </div>
          <div>
            <dt className="text-charcoal/50">Check-out</dt>
            <dd className="text-charcoal/80">{first.checkOut}</dd>
          </div>
        </dl>

        {notes && (
          <div className="mb-6 bg-stone/50 border border-stone rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Special request</p>
            <p className="text-charcoal/80 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {bookings.every((b) => b.status === 'CANCELLED') && bookings.some((b) => Number(b.cancellationPenaltyAmount) > 0) && (
          <div className="mb-6 bg-stone/50 border border-stone rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Cancellation penalty</p>
            <p className="text-charcoal/80">
              ₹{bookings.reduce((sum, b) => sum + Number(b.cancellationPenaltyAmount || 0), 0).toLocaleString()} — cancelled within the free-cancellation window.
            </p>
          </div>
        )}

        <div className="mb-6 border border-stone rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg">₹{totalAmount.toLocaleString()}</span>
              {anyActive && <PaymentBadge status={paymentStatus} />}
              {anyActive && paymentStatus === 'PAID' && (
                <Link to={`/admin/invoice/trip/${groupId}`} className="text-sm text-olive hover:underline">
                  View invoice
                </Link>
              )}
            </div>
            {first.childrenCount > 0 && (
              <p className="text-sm text-charcoal/60">
                incl. Kids Play Zone &middot; {first.childrenCount} child{first.childrenCount === 1 ? '' : 'ren'} &middot; ₹{Number(first.childcareFee).toLocaleString()}
              </p>
            )}
            {first.fullBoard && (
              <p className="text-sm text-charcoal/60">
                incl. Full Board &middot; ₹{Number(first.fullBoardFee).toLocaleString()}
              </p>
            )}
            {anyActive && paymentStatus !== 'PAID' && amountPaidTotal > 0 && (
              <p className="text-sm text-olive w-full">
                Already paid ₹{amountPaidTotal.toLocaleString()}
                {balanceDue > 0 && ` · Balance due ₹${balanceDue.toLocaleString()}`}
                {balanceDue < 0 && ` · Refund due ₹${Math.abs(balanceDue).toLocaleString()}`}
              </p>
            )}
            {anyActive && paymentStatus !== 'PAID' && !showPaymentForm && (
              <button
                onClick={() => { setPaymentAmount(balanceDue !== 0 ? String(balanceDue) : ''); setShowPaymentForm(true) }}
                className="text-sm text-olive hover:underline"
              >
                {balanceDue < 0
                  ? `Record refund of ₹${Math.abs(balanceDue).toLocaleString()}`
                  : amountPaidTotal > 0
                    ? `Record remaining ₹${balanceDue.toLocaleString()}`
                    : 'Mark as paid'}
              </button>
            )}
          </div>

          {allPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone">
              <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Payment history</p>
              <div className="space-y-1.5">
                {allPayments.map((p) => {
                  const isRefund = Number(p.amount) < 0
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                      <span className={isRefund ? 'text-red-600' : 'text-charcoal/80'}>
                        {isRefund ? '−' : ''}₹{Math.abs(Number(p.amount)).toLocaleString()} &middot; {p.method}
                        {isRefund ? ' · Refund' : ''}
                        {p.reference ? ` (${p.reference})` : ''}
                        {bookings.length > 1 ? ` — ${p.roomName}` : ''}
                      </span>
                      <span className="text-charcoal/50 text-xs">
                        {new Date(p.paidAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {showPaymentForm && (
            <form onSubmit={markAsPaid} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone">
              <label className="text-sm text-charcoal/70">
                Amount
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                />
                {Number(paymentAmount) < 0 && (
                  <span className="block text-xs text-red-600 mt-1">Negative amount — this will be recorded as a refund.</span>
                )}
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

        <div className="space-y-3 mb-6">
          {bookings.map((b) => {
            const property = properties.find((p) => p.id === b.propertyId)
            const roomNumbers = roomNumberOptions(property)
            const otherProperties = properties.filter((p) => p.id !== b.propertyId)
            const nights = b.checkIn && b.checkOut
              ? Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000)
              : 0
            const elapsedNights = b.checkIn
              ? Math.min(Math.max(Math.round((new Date(todayIso()) - new Date(b.checkIn)) / 86400000), 0), nights)
              : 0
            const remainingNights = nights - elapsedNights
            const upgradeNewPerNight = upgradingBookingId === b.id && upgradePreview ? upgradePreview.pricePerNight : null
            const upgradeNewAmount = upgradeNewPerNight != null
              ? (Number(b.amount || 0) / (nights || 1)) * elapsedNights + upgradeNewPerNight * remainingNights
              : null
            const upgradeDelta = upgradeNewAmount != null ? upgradeNewAmount - Number(b.amount || 0) : null
            const canChangeRoom = (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') && !b.roomUpgraded
            return (
              <div key={b.id} className="border border-stone rounded-xl2 p-4 overflow-hidden">
                <div className="flex gap-4 items-center">
                  <div
                    className="w-16 h-16 rounded-lg bg-stone bg-cover bg-center shrink-0"
                    style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
                    <p className="text-charcoal/60 text-sm">{b.guests} guest{b.guests === 1 ? '' : 's'}</p>
                    <Select
                      value={b.roomNumber || ''}
                      onChange={(e) => saveRoomNumber(b.id, e.target.value)}
                      disabled={b.status === 'CHECKED_OUT' || b.status === 'CANCELLED'}
                      className="mt-1.5 w-28 text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Unassigned</option>
                      {roomNumbers.map((n) => <option key={n} value={n}>{n}</option>)}
                    </Select>
                    {roomNumberErrors[b.id] && (
                      <p className="text-xs text-red-600 mt-1 break-words">{roomNumberErrors[b.id]}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={b.status} />
                    {canChangeRoom && upgradingBookingId !== b.id && (
                      <button onClick={() => startUpgrade(b.id)} className="text-xs text-olive hover:underline">
                        Change room
                      </button>
                    )}
                    {b.roomUpgraded && (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') && (
                      <p className="text-xs text-charcoal/40 text-right max-w-[10rem]">
                        Room already changed once for this stay
                      </p>
                    )}
                  </div>
                </div>

                {b.status !== 'CANCELLED' && (
                  <div className="mt-4 pt-4 border-t border-stone">
                    <GuestDocuments bookingId={b.id} onCountChange={(n) => setDocCounts((prev) => ({ ...prev, [b.id]: n }))} />
                  </div>
                )}

                {upgradingBookingId === b.id && (
                  <div className="mt-4 pt-4 border-t border-stone">
                    <p className="text-sm text-charcoal/70 mb-3">
                      {b.status === 'CHECKED_IN'
                        ? 'Move this guest to a different room for the rest of their stay.'
                        : 'Move this booking to a different room type before checking in.'}
                    </p>
                    <Select
                      value={upgradePropertyId}
                      onChange={(e) => setUpgradePropertyId(e.target.value)}
                      className="w-full px-3 py-2.5 mb-3"
                    >
                      <option value="">Select a room</option>
                      {otherProperties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                    {elapsedNights > 0 && (
                      <p className="text-xs text-charcoal/50 mb-3">
                        {elapsedNights} night{elapsedNights === 1 ? '' : 's'} already stayed (billed at the current room's rate) &middot;{' '}
                        {remainingNights} night{remainingNights === 1 ? '' : 's'} remaining at the new room's rate.
                      </p>
                    )}
                    {upgradePropertyId && upgradeNewAmount != null && (
                      <p className="text-sm text-olive mb-3 break-words">
                        {b.paymentStatus === 'PAID'
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
                        Confirm change
                      </button>
                      <button type="button" onClick={cancelUpgrade} className="text-sm text-charcoal/60 hover:underline">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {anyConfirmed && (
            <>
              <button
                onClick={() => runAction('check-in')}
                disabled={actionStatus === 'running' || missingRoomForCheckIn || missingDocForCheckIn || tooEarlyForCheckIn}
                className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
              >
                Check-in trip
              </button>
              {missingRoomForCheckIn && (
                <p className="text-xs text-charcoal/50">Assign a room number to every room before checking in.</p>
              )}
              {!missingRoomForCheckIn && missingDocForCheckIn && (
                <p className="text-xs text-charcoal/50">Upload a guest ID document for every room before checking in.</p>
              )}
              {!missingRoomForCheckIn && !missingDocForCheckIn && tooEarlyForCheckIn && (
                <p className="text-xs text-charcoal/50">Check-in opens on the scheduled arrival date.</p>
              )}
            </>
          )}
          {anyCheckedIn && (
            <>
              <button
                onClick={() => runAction('check-out')}
                disabled={actionStatus === 'running' || tooEarlyForCheckOut}
                className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
              >
                Check-out trip
              </button>
              {tooEarlyForCheckOut && (
                <p className="text-xs text-charcoal/50">Check-out opens on the scheduled departure date.</p>
              )}
            </>
          )}
          {anyActive && (
            <button
              onClick={() => {
                const message = cancellationConfirmMessage(first.checkIn, first.checkOut, true)
                if (window.confirm(message)) runAction('cancel')
              }}
              disabled={actionStatus === 'running'}
              className="px-6 py-2.5 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel trip
            </button>
          )}
          {anyActive && (
            <button
              onClick={() => {
                if (window.confirm("Cancel this whole trip with no refund? Use this only when the rooms and payment are being handled offline. This can't be undone.")) {
                  runAction('cancel-no-refund')
                }
              }}
              disabled={actionStatus === 'running'}
              className="px-6 py-2.5 rounded-full text-sm text-charcoal/50 hover:text-red-600 hover:underline transition-colors disabled:opacity-50"
            >
              Cancel trip (no refund)
            </button>
          )}
        </div>

        {actionError && <p className="text-red-600 text-sm mt-4">{actionError}</p>}

        <div className="mt-6">
          <ActivityLog groupId={groupId} />
        </div>
      </div>
    </div>
  )
}
