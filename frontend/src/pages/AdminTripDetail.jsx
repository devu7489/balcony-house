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

export default function AdminTripDetail() {
  const { groupId } = useParams()
  const { childcareEnabled, fullBoardEnabled } = useHotelConfig()
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

  const load = () => apiClient.get(`/admin/bookings/group/${groupId}`)
    .then(({ data }) => { setBookings(data); setActivityVersion((v) => v + 1) })
    .catch(() => setNotFound(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => {
    apiClient.get('/properties').then(({ data }) => setProperties(data)).catch(() => {})
  }, [])

  useEffect(() => {
    apiClient.get('/cafe').then(({ data }) => setCafeItems(data)).catch(() => {})
    apiClient.get('/addons/fullboard').then(({ data }) => setFullBoardPricing(data)).catch(() => {})
  }, [])

  const first0 = bookings?.[0]
  const nightsForAddons = first0?.checkIn && first0?.checkOut
    ? Math.round((new Date(first0.checkOut) - new Date(first0.checkIn)) / 86400000)
    : 0

  useEffect(() => {
    if (!showAddons || nightsForAddons <= 0) return
    apiClient.get('/addons/childcare', { params: { nights: nightsForAddons } })
      .then(({ data }) => setChildcarePricing(data)).catch(() => {})
  }, [showAddons, nightsForAddons])

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

  const saveAddons = async () => {
    setAddonsStatus('running')
    setAddonsError('')
    try {
      await apiClient.post(`/admin/bookings/group/${groupId}/addons`, {
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
      await apiClient.post(`/admin/bookings/group/${groupId}/food-orders`, { cafeItemId, quantity })
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
      await apiClient.delete(`/admin/bookings/group/${groupId}/food-orders/${orderId}`)
      await load()
    } catch (err) {
      setFoodOrderError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setFoodOrderStatus('idle')
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
  const allCancelled = bookings.every((b) => b.status === 'CANCELLED')
  // Once every room is cancelled, "what's owed" is no longer the original room+addon sum -
  // it's each room's cancellationPenaltyAmount (already computed server-side, exposed as
  // payableTotal - see BookingService.payableTotal's own comment). The non-cancelled formula
  // stays as-is since it needs the trip-wide addon fees folded in exactly once.
  const totalAmount = allCancelled
    ? bookings.reduce((sum, b) => sum + Number(b.payableTotal || 0), 0)
    : bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0)
      + Number(first.childcareFee || 0)
      + Number(first.fullBoardFee || 0)
      + Number(first.foodOrdersFee || 0)
  const amountPaidTotal = bookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0)
  const balanceDue = totalAmount - amountPaidTotal
  // Every active room must be individually PAID for the trip to be settled - a room
  // change can reset just one room to PENDING while the others stay PAID, so reading
  // only bookings[0]'s status (as this used to) can miss an outstanding balance entirely.
  // When nothing is active (whole trip cancelled), fall back to checking the cancelled
  // rooms themselves - filtering them out here would leave an empty list, which vacuously
  // (and wrongly) satisfies .every().
  const paymentRelevant = anyActive ? bookings.filter((b) => b.status !== 'CANCELLED') : bookings
  const allActivePaid = paymentRelevant.length > 0 && paymentRelevant.every((b) => b.paymentStatus === 'PAID')
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

        {bookings.every((b) => b.status === 'CANCELLED')
          && (bookings.some((b) => b.cancellationType) || bookings.some((b) => Number(b.cancellationPenaltyAmount) > 0)) && (
          <div className="mb-6 bg-stone/50 border border-stone rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Cancellation</p>
            <p className="text-charcoal/80">
              {(() => {
                const distinctTypes = [...new Set(bookings.map((b) => b.cancellationType).filter(Boolean))]
                const typeLabel = distinctTypes.length === 1 ? cancellationTypeLabel(distinctTypes[0]) : null
                const totalPenalty = bookings.reduce((sum, b) => sum + Number(b.cancellationPenaltyAmount || 0), 0)
                return (
                  <>
                    {typeLabel}
                    {totalPenalty > 0 && <>{typeLabel ? ' — ' : ''}₹{totalPenalty.toLocaleString()} penalty</>}
                  </>
                )
              })()}
            </p>
          </div>
        )}

        <div className="mb-6 border border-stone rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg">₹{totalAmount.toLocaleString()}</span>
              {(anyActive || allCancelled) && <PaymentBadge status={paymentStatus} />}
              {(anyActive || allCancelled) && paymentStatus === 'PAID' && !allCancelled && (
                <Link to={`/admin/invoice/trip/${groupId}`} className="text-sm text-olive hover:underline">
                  View invoice
                </Link>
              )}
            </div>
            {!allCancelled && first.childrenCount > 0 && (
              <p className="text-sm text-charcoal/60">
                incl. Kids Play Zone &middot; {first.childrenCount} child{first.childrenCount === 1 ? '' : 'ren'} &middot; ₹{Number(first.childcareFee).toLocaleString()}
              </p>
            )}
            {!allCancelled && first.fullBoard && (
              <p className="text-sm text-charcoal/60">
                incl. Full Board &middot; ₹{Number(first.fullBoardFee).toLocaleString()}
              </p>
            )}
            {(anyActive || allCancelled) && balanceDue !== 0 && amountPaidTotal > 0 && (
              <p className="text-sm text-olive w-full">
                Already paid ₹{amountPaidTotal.toLocaleString()}
                {balanceDue > 0 && ` · Balance due ₹${balanceDue.toLocaleString()}`}
                {balanceDue < 0 && ` · Refund due ₹${Math.abs(balanceDue).toLocaleString()}`}
              </p>
            )}
            {(anyActive || allCancelled) && balanceDue !== 0 && !showPaymentForm && (
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

        {anyActive && (
          <div className="mb-6 border border-stone rounded-lg p-4">
            <h2 className="text-sm font-medium text-charcoal/80 mb-3">Extras</h2>

            {(childcareEnabled || fullBoardEnabled) && (() => {
              const activeGuestCount = bookings.filter((b) => b.status !== 'CANCELLED').reduce((sum, b) => sum + b.guests, 0)
              return (
                <div className={showFoodMenu ? '' : 'pb-4'}>
                  {!showAddons ? (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-sm text-charcoal/60">
                        {first.childrenCount === 0 && first.buffetSessions === 0 ? (
                          <p>Kids Play Zone / Full Board — not booked</p>
                        ) : (
                          <>
                            {first.childrenCount > 0 && (
                              <p>
                                Kids Play Zone &middot; {first.childrenCount} child{first.childrenCount === 1 ? '' : 'ren'}, {first.childcareSessions} session{first.childcareSessions === 1 ? '' : 's'} &middot; ₹{Number(first.childcareFee).toLocaleString()}
                              </p>
                            )}
                            {first.buffetSessions > 0 && (
                              <p>
                                Full Board &middot; {first.buffetSessions} session{first.buffetSessions === 1 ? '' : 's'} &middot; ₹{Number(first.fullBoardFee).toLocaleString()}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {first.status === 'CHECKED_IN' ? (
                        <button
                          onClick={() => {
                            setAddonsChildren(first.childrenCount)
                            setAddonsChildcareSessions(first.childcareSessions)
                            setAddonsBuffetSessions(first.buffetSessions)
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
                                {Array.from({ length: childcarePricing.maxChildren * bookings.length + 1 }, (_, n) => n).map((n) => (
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
                              Lunch + dinner combined &middot; ₹{fullBoardPricing.pricePerSession}/session for all {activeGuestCount} guest{activeGuestCount === 1 ? '' : 's'}
                            </p>
                            <p className="text-sm text-olive text-right mt-2">
                              ₹{Math.round(fullBoardPricing.pricePerSession * addonsBuffetSessions * activeGuestCount).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-olive mb-3 break-words">
                        New total: ₹{Math.round(
                          bookings.reduce((sum, b) => sum + Number(b.amount || 0) - Number(b.discountAmount || 0), 0)
                            + childcarePricing.perDayRate * addonsChildcareSessions * addonsChildren
                            + fullBoardPricing.pricePerSession * addonsBuffetSessions * activeGuestCount
                            + Number(first.foodOrdersFee || 0)
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
              )
            })()}

            <div className={(childcareEnabled || fullBoardEnabled) ? 'pt-4 mt-1 border-t border-stone' : ''}>
              <div className="bg-stone/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wide text-charcoal/50">In-Room Dining</p>
                  {first.status === 'CHECKED_IN' ? (
                    <button onClick={() => setShowFoodMenu((v) => !v)} className="text-sm text-olive hover:underline">
                      {showFoodMenu ? 'Close menu' : '+ Add item'}
                    </button>
                  ) : (
                    <p className="text-xs text-charcoal/40">Available after check-in</p>
                  )}
                </div>

                {first.foodOrders?.length > 0 ? (
                  <div className="space-y-1.5">
                    {first.foodOrders.map((o) => (
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
                      ₹{Number(first.foodOrdersFee || 0).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  !showFoodMenu && <p className="text-sm text-charcoal/50">Nothing ordered yet.</p>
                )}

                {showFoodMenu && (
                  <div className={`grid gap-2 ${first.foodOrders?.length > 0 ? 'mt-3 pt-3 border-t border-stone/70' : ''}`}>
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
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
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
                {/* Full card width rather than squeezed into the flex-1 name/select column above
                    (that column was fighting the status/action sidebar for space, wrapping this
                    into an unreadable single-word-per-line stack on narrow screens). */}
                {roomNumberErrors[b.id] && (
                  <p className="text-xs text-red-600 mt-2">{roomNumberErrors[b.id]}</p>
                )}

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
                askConfirm(message, () => runAction('cancel'))
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
                askConfirm(
                  "Cancel this whole trip with no refund? Use this only when the rooms and payment are being handled offline. This can't be undone.",
                  () => runAction('cancel-no-refund')
                )
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
          <ActivityLog groupId={groupId} refreshKey={activityVersion} />
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
