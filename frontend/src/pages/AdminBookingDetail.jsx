import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import Select from '../components/Select'
import GuestDocuments from '../components/GuestDocuments'
import ActivityLog from '../components/ActivityLog'
import ConfirmDialog from '../components/ConfirmDialog'
import { roomNumberOptions } from '../lib/roomNumbers'
import { todayIso } from '../lib/dates'
import { cancellationConfirmMessage, cancellationTypeLabel } from '../lib/cancellationPolicy'
import { useHotelConfig } from '../context/HotelConfigContext'

export default function AdminBookingDetail() {
  const { id } = useParams()
  const { childcareEnabled, fullBoardEnabled } = useHotelConfig()
  const [booking, setBooking] = useState(null)
  const [properties, setProperties] = useState([])
  const [docCount, setDocCount] = useState(0)
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
  const [showAddons, setShowAddons] = useState(false)
  const [addonsChildren, setAddonsChildren] = useState(0)
  const [addonsChildcareSessions, setAddonsChildcareSessions] = useState(0)
  const [addonsBuffetSessions, setAddonsBuffetSessions] = useState(0)
  const [addonsStatus, setAddonsStatus] = useState('idle')
  const [addonsError, setAddonsError] = useState('')
  const [childcarePricing, setChildcarePricing] = useState({ perDayRate: 0, totalPerChild: 0, maxChildren: 2 })
  const [fullBoardPricing, setFullBoardPricing] = useState({ pricePerPersonPerDay: 0, pricePerSession: 0 })
  const [cafeItems, setCafeItems] = useState([])
  const [orderQuantities, setOrderQuantities] = useState({})
  const [foodOrderStatus, setFoodOrderStatus] = useState('idle')
  const [foodOrderError, setFoodOrderError] = useState('')
  const [showFoodMenu, setShowFoodMenu] = useState(false)
  const [activityVersion, setActivityVersion] = useState(0)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const askConfirm = (message, onConfirm, opts = {}) => {
    setConfirmDialog({
      message,
      danger: true,
      confirmLabel: 'Confirm',
      ...opts,
      onConfirm: () => { setConfirmDialog(null); onConfirm() },
    })
  }

  const load = () => apiClient.get(`/admin/bookings/${id}`)
    .then(({ data }) => { setBooking(data); setActivityVersion((v) => v + 1) })
    .catch(() => setNotFound(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    apiClient.get('/properties').then(({ data }) => setProperties(data)).catch(() => {})
  }, [])

  useEffect(() => {
    apiClient.get('/cafe').then(({ data }) => setCafeItems(data)).catch(() => {})
    apiClient.get('/addons/fullboard').then(({ data }) => setFullBoardPricing(data)).catch(() => {})
  }, [])

  const nightsForAddons = booking?.checkIn && booking?.checkOut
    ? Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)
    : 0

  useEffect(() => {
    if (!showAddons || nightsForAddons <= 0) return
    apiClient.get('/addons/childcare', { params: { nights: nightsForAddons } })
      .then(({ data }) => setChildcarePricing(data)).catch(() => {})
  }, [showAddons, nightsForAddons])

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

  const saveAddons = async () => {
    setAddonsStatus('running')
    setAddonsError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/addons`, {
        childrenCount: addonsChildren,
        childcareSessions: addonsChildcareSessions,
        buffetSessions: addonsBuffetSessions,
      })
      setShowAddons(false)
      await load()
    } catch (err) {
      setAddonsError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setAddonsStatus('idle')
    }
  }

  const addFoodOrder = async (cafeItemId) => {
    const quantity = orderQuantities[cafeItemId] || 1
    setFoodOrderStatus('running')
    setFoodOrderError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/food-orders`, { cafeItemId, quantity })
      await load()
    } catch (err) {
      setFoodOrderError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setFoodOrderStatus('idle')
    }
  }

  const removeFoodOrder = async (orderId) => {
    setFoodOrderStatus('running')
    setFoodOrderError('')
    try {
      await apiClient.delete(`/admin/bookings/${id}/food-orders/${orderId}`)
      await load()
    } catch (err) {
      setFoodOrderError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setFoodOrderStatus('idle')
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
        <Link to="/admin/bookings" className="text-olive hover:underline">Back to Admin</Link>
      </div>
    )
  }

  const guestLine = [booking.guestName, booking.guestEmail, booking.guestPhone].filter(Boolean).join(' · ')
  // payableTotal comes from the backend, not a local recompute of amount + childcareFee +
  // fullBoardFee - discountAmount: those addon fees are trip-wide and denormalized onto
  // every room in a multi-room trip, so only one room in the trip actually owes them -
  // recomputing locally double-counts them for every other room (see BookingDto's comment).
  const fullTotal = booking.payableTotal != null ? Number(booking.payableTotal) : 0
  const amountPaidSoFar = Number(booking.amountPaid || 0)
  const balanceDue = fullTotal - amountPaidSoFar
  // Trip-wide Kids Play Zone / Full Board fees only actually belong to one room's bill
  // (whichever the backend picked as the addon bearer) - only show those "incl." lines
  // when this room's own payableTotal is the one that includes them, so the line item
  // and the headline total agree instead of contradicting each other.
  const roomOnlyTotal = Number(booking.amount || 0) - Number(booking.discountAmount || 0)
  const isAddonBearer = fullTotal > roomOnlyTotal
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
  const canChangeRoom = (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && !booking.roomUpgraded

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/admin/bookings" className="text-sm text-olive hover:underline">&larr; Back to Admin</Link>

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

          {booking.status === 'CANCELLED' && (booking.cancellationType || Number(booking.cancellationPenaltyAmount) > 0) && (
            <div className="mb-6 bg-stone/50 border border-stone rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Cancellation</p>
              <p className="text-charcoal/80">
                {cancellationTypeLabel(booking.cancellationType)}
                {Number(booking.cancellationPenaltyAmount) > 0 && (
                  <>{booking.cancellationType ? ' — ' : ''}₹{Number(booking.cancellationPenaltyAmount).toLocaleString()} penalty</>
                )}
              </p>
            </div>
          )}

          {(
            <div className="mb-6 border border-stone rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {booking.amount != null && (
                    <span className="font-serif text-lg">₹{fullTotal.toLocaleString()}</span>
                  )}
                  <PaymentBadge status={booking.paymentStatus} />
                  {(booking.status === 'CHECKED_OUT' || (booking.status === 'CANCELLED' && Number(booking.cancellationPenaltyAmount) > 0)) && (
                    <Link
                      to={booking.bookingGroupId ? `/admin/invoice/trip/${booking.bookingGroupId}` : `/admin/invoice/booking/${booking.id}`}
                      className="text-sm text-olive hover:underline"
                    >
                      View invoice
                    </Link>
                  )}
                </div>
                {booking.status !== 'CANCELLED' && isAddonBearer && booking.childrenCount > 0 && (
                  <p className="text-sm text-charcoal/60">
                    incl. Kids Play Zone &middot; {booking.childrenCount} child{booking.childrenCount === 1 ? '' : 'ren'} &middot; ₹{Number(booking.childcareFee).toLocaleString()}
                  </p>
                )}
                {booking.status !== 'CANCELLED' && isAddonBearer && booking.fullBoard && (
                  <p className="text-sm text-charcoal/60">
                    incl. Full Board &middot; ₹{Number(booking.fullBoardFee).toLocaleString()}
                  </p>
                )}
                {booking.status !== 'CANCELLED' && !isAddonBearer && (booking.childrenCount > 0 || booking.fullBoard) && (
                  <p className="text-sm text-charcoal/60">Kids Play Zone / Full Board for this trip are billed to another room.</p>
                )}
                {booking.discountPercent > 0 && (
                  <p className="text-sm text-charcoal/60">
                    {booking.discountPercent}% discount &middot; -₹{Number(booking.discountAmount).toLocaleString()}
                  </p>
                )}
                {balanceDue !== 0 && amountPaidSoFar > 0 && (
                  <p className="text-sm text-olive w-full">
                    Already paid ₹{amountPaidSoFar.toLocaleString()}
                    {balanceDue > 0 && ` · Balance due ₹${balanceDue.toLocaleString()}`}
                    {balanceDue < 0 && ` · Refund due ₹${Math.abs(balanceDue).toLocaleString()}`}
                  </p>
                )}
                {balanceDue !== 0 && !showPaymentForm && (
                  <button
                    onClick={() => { setPaymentAmount(balanceDue !== 0 ? String(balanceDue) : ''); setShowPaymentForm(true) }}
                    className="text-sm text-olive hover:underline"
                  >
                    {balanceDue < 0
                      ? `Record refund of ₹${Math.abs(balanceDue).toLocaleString()}`
                      : amountPaidSoFar > 0
                        ? `Record remaining ₹${balanceDue.toLocaleString()}`
                        : 'Mark as paid'}
                  </button>
                )}
              </div>

              {booking.payments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone">
                  <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Payment history</p>
                  <div className="space-y-1.5">
                    {booking.payments.map((p) => {
                      const isRefund = Number(p.amount) < 0
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                          <span className={isRefund ? 'text-red-600' : 'text-charcoal/80'}>
                            {isRefund ? '−' : ''}₹{Math.abs(Number(p.amount)).toLocaleString()} &middot; {p.method}
                            {isRefund ? ' · Refund' : ''}
                            {p.reference ? ` (${p.reference})` : ''}
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
                      className="mt-1 w-full px-3 py-2.5"
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

          {!booking.bookingGroupId && booking.roomUpgraded && (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
            <p className="text-xs text-charcoal/50 mb-6">
              This booking's room has already been changed once — only one room change is allowed per stay.
              Need a second change? Use "Cancel (no refund)" below and manage the new room offline.
            </p>
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

          {!booking.bookingGroupId && (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
            <div className="mb-6 border border-stone rounded-lg p-4">
              <h2 className="text-sm font-medium text-charcoal/80 mb-3">Extras</h2>

              {(childcareEnabled || fullBoardEnabled) && (
                <div className={showFoodMenu ? '' : 'pb-4'}>
                  {!showAddons ? (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-sm text-charcoal/60">
                        {booking.childrenCount === 0 && booking.buffetSessions === 0 ? (
                          <p>Kids Play Zone / Full Board — not booked</p>
                        ) : (
                          <>
                            {booking.childrenCount > 0 && (
                              <p>
                                Kids Play Zone &middot; {booking.childrenCount} child{booking.childrenCount === 1 ? '' : 'ren'}, {booking.childcareSessions} session{booking.childcareSessions === 1 ? '' : 's'} &middot; ₹{Number(booking.childcareFee).toLocaleString()}
                              </p>
                            )}
                            {booking.buffetSessions > 0 && (
                              <p>
                                Full Board &middot; {booking.buffetSessions} session{booking.buffetSessions === 1 ? '' : 's'} &middot; ₹{Number(booking.fullBoardFee).toLocaleString()}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {booking.status === 'CHECKED_IN' ? (
                        <button
                          onClick={() => {
                            setAddonsChildren(booking.childrenCount)
                            setAddonsChildcareSessions(booking.childcareSessions)
                            setAddonsBuffetSessions(booking.buffetSessions)
                            setAddonsError('')
                            setShowAddons(true)
                          }}
                          className="text-sm text-olive hover:underline"
                        >
                          Edit
                        </button>
                      ) : (
                        <p className="text-xs text-charcoal/40">Editable after check-in</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        {childcareEnabled && (
                          <div className="bg-stone/40 rounded-lg p-3">
                            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Kids Play Zone</p>
                            <label className="flex items-center justify-between gap-2 text-sm text-charcoal/70 mb-2">
                              Children
                              <Select
                                value={addonsChildren}
                                onChange={(e) => setAddonsChildren(Number(e.target.value))}
                                className="w-20 px-2 py-1.5 text-sm"
                              >
                                {Array.from({ length: childcarePricing.maxChildren + 1 }, (_, n) => n).map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </Select>
                            </label>
                            <label className="flex items-center justify-between gap-2 text-sm text-charcoal/70">
                              Sessions used
                              <Select
                                value={addonsChildcareSessions}
                                onChange={(e) => setAddonsChildcareSessions(Number(e.target.value))}
                                className="w-20 px-2 py-1.5 text-sm"
                              >
                                {Array.from({ length: Math.max(nightsForAddons, 0) + 1 }, (_, n) => n).map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </Select>
                            </label>
                            <p className="text-sm text-olive text-right mt-2">
                              ₹{Math.round(childcarePricing.perDayRate * addonsChildcareSessions * addonsChildren).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {fullBoardEnabled && (
                          <div className="bg-stone/40 rounded-lg p-3">
                            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Full Board</p>
                            <label className="flex items-center justify-between gap-2 text-sm text-charcoal/70">
                              Buffet sessions
                              <Select
                                value={addonsBuffetSessions}
                                onChange={(e) => setAddonsBuffetSessions(Number(e.target.value))}
                                className="w-20 px-2 py-1.5 text-sm"
                              >
                                {Array.from({ length: Math.max(nightsForAddons, 0) * 2 + 1 }, (_, n) => n).map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </Select>
                            </label>
                            <p className="text-xs text-charcoal/50 mt-2">
                              Lunch + dinner combined &middot; ₹{fullBoardPricing.pricePerSession}/session for all {booking.guests} guest{booking.guests === 1 ? '' : 's'}
                            </p>
                            <p className="text-sm text-olive text-right mt-2">
                              ₹{Math.round(fullBoardPricing.pricePerSession * addonsBuffetSessions * booking.guests).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-olive mb-3 break-words">
                        New total: ₹{Math.round(
                          roomOnlyTotal
                            + childcarePricing.perDayRate * addonsChildcareSessions * addonsChildren
                            + fullBoardPricing.pricePerSession * addonsBuffetSessions * booking.guests
                            + Number(booking.foodOrdersFee || 0)
                        ).toLocaleString()}
                      </p>
                      {addonsError && <p className="text-sm text-red-600 mb-3 break-words">{addonsError}</p>}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={saveAddons}
                          disabled={addonsStatus === 'running'}
                          className="px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 text-sm"
                        >
                          Confirm change
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddons(false); setAddonsError('') }}
                          className="text-sm text-charcoal/60 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={(childcareEnabled || fullBoardEnabled) ? 'pt-4 mt-1 border-t border-stone' : ''}>
                <div className="bg-stone/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wide text-charcoal/50">In-Room Dining</p>
                    {booking.status === 'CHECKED_IN' ? (
                      <button onClick={() => setShowFoodMenu((v) => !v)} className="text-sm text-olive hover:underline">
                        {showFoodMenu ? 'Close menu' : '+ Add item'}
                      </button>
                    ) : (
                      <p className="text-xs text-charcoal/40">Available after check-in</p>
                    )}
                  </div>

                  {booking.foodOrders?.length > 0 ? (
                    <div className="space-y-1.5">
                      {booking.foodOrders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-3 text-sm bg-white rounded-md px-2.5 py-1.5">
                          <span className="text-charcoal/80">
                            <span className="text-charcoal/50 tabular-nums">{o.quantity}&times;</span> {o.itemName}
                          </span>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-charcoal/70 tabular-nums">₹{Number(o.lineTotal).toLocaleString()}</span>
                            <button
                              onClick={() => removeFoodOrder(o.id)}
                              disabled={foodOrderStatus === 'running'}
                              aria-label={`Remove ${o.itemName}`}
                              className="text-charcoal/30 hover:text-red-600 disabled:opacity-50 leading-none text-base"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                      <p className="text-sm text-olive text-right pt-1">
                        ₹{Number(booking.foodOrdersFee || 0).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    !showFoodMenu && <p className="text-sm text-charcoal/50">Nothing ordered yet.</p>
                  )}

                  {showFoodMenu && (
                    <div className={`grid gap-2 ${booking.foodOrders?.length > 0 ? 'mt-3 pt-3 border-t border-stone/70' : ''}`}>
                      {cafeItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg p-2.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-md bg-stone bg-cover bg-center shrink-0"
                              style={{ backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-charcoal/80 truncate">{item.name}</p>
                              <p className="text-xs text-charcoal/50">₹{item.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Select
                              value={orderQuantities[item.id] || 1}
                              onChange={(e) => setOrderQuantities((q) => ({ ...q, [item.id]: Number(e.target.value) }))}
                              className="w-16 px-1.5 py-1 text-sm"
                            >
                              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                            </Select>
                            <button
                              onClick={() => addFoodOrder(item.id)}
                              disabled={foodOrderStatus === 'running'}
                              className="px-4 py-1.5 rounded-full bg-olive text-warmwhite text-xs hover:bg-charcoal transition-colors disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {foodOrderError && <p className="text-sm text-red-600 mt-2">{foodOrderError}</p>}
                </div>
              </div>
            </div>
          )}

          {booking.status !== 'CANCELLED' && (
            <div className="mb-6">
              <GuestDocuments bookingId={booking.id} onCountChange={setDocCount} />
            </div>
          )}

          {!booking.bookingGroupId && (
            <div className="flex flex-wrap gap-3 items-center">
              {booking.status === 'CONFIRMED' && (() => {
                const tooEarly = todayIso() < booking.checkIn
                const missingDoc = docCount === 0
                return (
                  <>
                    <button
                      onClick={() => runAction('check-in')}
                      disabled={actionStatus === 'running' || !booking.roomNumber || missingDoc || tooEarly}
                      className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
                    >
                      Check-in
                    </button>
                    {!booking.roomNumber && (
                      <p className="text-xs text-charcoal/50">Assign a room number above before checking in.</p>
                    )}
                    {booking.roomNumber && missingDoc && (
                      <p className="text-xs text-charcoal/50">Upload a guest ID document above before checking in.</p>
                    )}
                    {booking.roomNumber && !missingDoc && tooEarly && (
                      <p className="text-xs text-charcoal/50">Check-in opens on {booking.checkIn}.</p>
                    )}
                  </>
                )
              })()}
              {booking.status === 'CHECKED_IN' && (() => {
                const tooEarly = todayIso() < booking.checkOut
                return (
                  <>
                    <button
                      onClick={() => runAction('check-out')}
                      disabled={actionStatus === 'running' || tooEarly}
                      className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
                    >
                      Check-out
                    </button>
                    {tooEarly && (
                      <p className="text-xs text-charcoal/50">Check-out opens on {booking.checkOut}.</p>
                    )}
                  </>
                )
              })()}
              {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
                <button
                  onClick={() => {
                    const message = cancellationConfirmMessage(booking.checkIn, booking.checkOut, false)
                    askConfirm(message, () => runAction('cancel'), { confirmLabel: 'Cancel booking' })
                  }}
                  disabled={actionStatus === 'running'}
                  className="px-6 py-2.5 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel booking
                </button>
              )}
              {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
                <button
                  onClick={() => {
                    askConfirm(
                      "Cancel this booking with no refund? Use this only when the room and payment are being handled offline (e.g. moved to a different room outside the system). This can't be undone.",
                      () => runAction('cancel-no-refund'),
                      { confirmLabel: 'Cancel, no refund' }
                    )
                  }}
                  disabled={actionStatus === 'running'}
                  className="px-6 py-2.5 rounded-full text-sm text-charcoal/50 hover:text-red-600 hover:underline transition-colors disabled:opacity-50"
                >
                  Cancel (no refund)
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

          <div className="mt-6">
            <ActivityLog bookingId={booking.id} refreshKey={activityVersion} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDialog}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  )
}
