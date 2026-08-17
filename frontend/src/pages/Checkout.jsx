import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'
import { useHotelConfig } from '../context/HotelConfigContext'
import { getCart, setNotes as saveNotes, removeRoom, clearCart } from '../lib/cart'
import PaymentBadge from '../components/PaymentBadge'
import Select from '../components/Select'

export default function Checkout() {
  const { user, login } = useAuth()
  const { childcareEnabled, fullBoardEnabled, checkInTime, checkOutTime, policyNotes } = useHotelConfig()
  const location = useLocation()

  const [cart, setCartState] = useState(getCart())
  const [notes, setNotesState] = useState(cart.notes)
  const [availability, setAvailability] = useState({})
  const [checkingAvailability, setCheckingAvailability] = useState(true)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [confirmed, setConfirmed] = useState(null)
  const [childrenCount, setChildrenCount] = useState(0)
  const [childcarePricing, setChildcarePricing] = useState({ perDayRate: 0, totalPerChild: 0, maxChildren: 2 })
  const [fullBoard, setFullBoard] = useState(false)
  const [fullBoardPricing, setFullBoardPricing] = useState({ pricePerPersonPerDay: 0 })

  const nights = cart.checkIn && cart.checkOut
    ? Math.round((new Date(cart.checkOut) - new Date(cart.checkIn)) / 86400000)
    : 0
  const totalRoomUnits = cart.rooms.reduce((sum, r) => sum + (r.quantity || 1), 0)
  const totalGuests = cart.rooms.reduce((sum, r) => sum + r.guests * (r.quantity || 1), 0)
  const fullBoardTotal = fullBoardPricing.pricePerPersonPerDay * totalGuests * nights
  const maxChildrenForTrip = Math.max(totalRoomUnits, 1) * childcarePricing.maxChildren

  useEffect(() => {
    if (nights <= 0) return
    apiClient.get('/addons/childcare', { params: { nights } }).then(({ data }) => setChildcarePricing(data)).catch(() => {})
  }, [nights])

  useEffect(() => {
    apiClient.get('/addons/fullboard').then(({ data }) => setFullBoardPricing(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (childrenCount > maxChildrenForTrip) setChildrenCount(maxChildrenForTrip)
  }, [maxChildrenForTrip, childrenCount])

  useEffect(() => {
    if (cart.rooms.length === 0 || !cart.checkIn || !cart.checkOut) {
      setCheckingAvailability(false)
      return
    }
    setCheckingAvailability(true)
    Promise.all(cart.rooms.map((r) =>
      apiClient.get(`/properties/${r.propertyId}/availability`, { params: { checkIn: cart.checkIn, checkOut: cart.checkOut } })
        .then(({ data }) => [r.propertyId, data])
        .catch(() => [r.propertyId, null])
    )).then((results) => setAvailability(Object.fromEntries(results)))
      .finally(() => setCheckingAvailability(false))
  }, [cart.rooms, cart.checkIn, cart.checkOut])

  const handleRemove = (propertyId) => {
    const updated = removeRoom(propertyId)
    setCartState(updated)
  }

  const hasUnavailableRoom = cart.rooms.some((r) => availability[r.propertyId]?.available === false)
  const hasInsufficientUnits = cart.rooms.some((r) => {
    const avail = availability[r.propertyId]
    return avail?.available && (r.quantity || 1) > avail.unitsLeft
  })

  const [retryStatus, setRetryStatus] = useState('idle')

  // Payment happens in two steps behind the scenes: the booking is created (holding the
  // rooms) and a first payment attempt is made in that same request. The mock gateway
  // always fails that first attempt on purpose, so guests normally land on the retry screen
  // once - this mirrors exactly what a real gateway's "declined, try again" flow looks like.
  const settle = (bookings) => {
    const allPaid = bookings.every((b) => b.paymentStatus === 'PAID')
    setConfirmed(bookings)
    setSubmitStatus(allPaid ? 'success' : 'payment-failed')
  }

  const submit = async (e) => {
    e.preventDefault()
    saveNotes(notes)
    if (!user) {
      login()
      return
    }
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      const { data } = await apiClient.post('/bookings/group', {
        guestPhone: user.phone,
        checkIn: cart.checkIn,
        checkOut: cart.checkOut,
        notes: notes || null,
        rooms: cart.rooms.flatMap((r) =>
          Array.from({ length: r.quantity || 1 }, () => ({ propertyId: r.propertyId, guests: r.guests }))
        ),
        childrenCount,
        fullBoard,
      })
      clearCart()
      settle(data)
    } catch (err) {
      setSubmitStatus('error')
      const data = err.response?.data
      const details = data?.details?.length ? `: ${data.details.join(', ')}` : ''
      setSubmitError((data?.message || 'Something went wrong, please try again.') + details)
    }
  }

  const retryPayment = async () => {
    setRetryStatus('retrying')
    try {
      const groupId = confirmed[0].bookingGroupId
      const { data } = await apiClient.post(`/bookings/group/${groupId}/pay`)
      settle(data)
    } finally {
      setRetryStatus('idle')
    }
  }

  if (submitStatus === 'payment-failed' && confirmed) {
    return (
      <div className="max-w-xl mx-auto px-6 lg:px-10 py-20 text-center">
        <h1 className="font-serif text-3xl mb-2">Payment failed</h1>
        <p className="text-charcoal/70 mb-8">
          Your rooms are still held — nothing was charged. Try the payment again.
        </p>
        <div className="bg-white border border-stone rounded-xl2 p-6 mb-6 text-left">
          {confirmed.map((b, i) => {
            // Kids Play Zone/Full Board/In-Room Dining are trip-wide charges billed entirely
            // to the first room added, not split across rooms - so that room's amount looks
            // disproportionately large next to the others with no explanation unless we say why.
            const bearerAddonLabel = i === 0 && confirmed.length > 1
              ? [
                  b.childrenCount > 0 ? 'Kids Play Zone' : null,
                  b.fullBoard ? 'Full Board' : null,
                  Number(b.foodOrdersFee) > 0 ? 'In-Room Dining' : null,
                ].filter(Boolean).join(' & ')
              : ''
            return (
              <div key={b.id} className="flex justify-between text-sm py-2 border-b border-stone last:border-0">
                <span className="text-charcoal/70">
                  {b.propertyName} &middot; {b.checkIn} &rarr; {b.checkOut}
                  {bearerAddonLabel && ` (incl. ${bearerAddonLabel})`}
                </span>
                <span className="text-charcoal/80">₹{Number(b.payableTotal ?? b.amount).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
        <button
          onClick={retryPayment}
          disabled={retryStatus === 'retrying'}
          className="w-full px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          {retryStatus === 'retrying' ? 'Retrying…' : 'Retry payment'}
        </button>
      </div>
    )
  }

  if (submitStatus === 'success' && confirmed) {
    const bookedChildren = confirmed[0]?.childrenCount || 0
    const bookedFullBoard = confirmed[0]?.fullBoard
    return (
      <div className="max-w-2xl mx-auto px-6 lg:px-10 py-20">
        <h1 className="font-serif text-3xl mb-4">Trip confirmed & paid — see you soon.</h1>
        <div className="space-y-3 mb-8">
          {confirmed.map((b) => (
            <div key={b.id} className="flex gap-4 items-center bg-white border border-stone rounded-xl2 p-4">
              <div
                className="w-16 h-16 rounded-lg bg-stone bg-cover bg-center shrink-0"
                style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
              />
              <div className="flex-1">
                <h2 className="font-serif text-lg">{b.propertyName}</h2>
                <p className="text-charcoal/60 text-sm">{b.checkIn} &rarr; {b.checkOut} &middot; {b.guests} guest{b.guests === 1 ? '' : 's'}</p>
              </div>
              <PaymentBadge status={b.paymentStatus} />
            </div>
          ))}
          {bookedChildren > 0 && (
            <p className="text-sm text-charcoal/60 px-1">
              + Kids Play Zone &middot; {bookedChildren} child{bookedChildren === 1 ? '' : 'ren'} for the whole trip
            </p>
          )}
          {bookedFullBoard && (
            <p className="text-sm text-charcoal/60 px-1">+ Full Board for everyone, whole trip</p>
          )}
          <p className="text-sm text-charcoal/50 px-1">Breakfast included every morning.</p>
        </div>
        <Link to="/my-bookings" className="inline-block px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors">
          View my bookings
        </Link>
      </div>
    )
  }

  if (cart.rooms.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">Your trip is empty.</h1>
        <Link to="/stay" className="text-olive hover:underline">Browse rooms</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/stay" className="text-sm text-olive hover:underline">&larr; Back to Stay</Link>

      <h1 className="font-serif text-3xl mt-6 mb-2">Review your trip</h1>
      <p className="text-charcoal/70 mb-1">{cart.checkIn} &rarr; {cart.checkOut}</p>
      <p className="text-charcoal/50 text-sm mb-8">Breakfast included every morning.</p>

      <div className="space-y-4 mb-6">
        {cart.rooms.map((r) => {
          const avail = availability[r.propertyId]
          const unavailable = avail?.available === false
          const quantity = r.quantity || 1
          const insufficientUnits = avail?.available && quantity > avail.unitsLeft
          return (
            <div key={r.propertyId} className={`bg-white border rounded-xl2 p-4 ${unavailable || insufficientUnits ? 'border-red-300' : 'border-stone'}`}>
              <div className="flex gap-4 items-center">
                <div
                  className="w-20 h-20 rounded-lg bg-stone bg-cover bg-center shrink-0"
                  style={{ backgroundImage: r.propertyHeroImageUrl ? `url(${r.propertyHeroImageUrl})` : undefined }}
                />
                <div className="flex-1">
                  <h2 className="font-serif text-lg">
                    {r.propertyName}{quantity > 1 ? <span className="text-charcoal/50 font-sans text-sm"> &times; {quantity}</span> : null}
                  </h2>
                  <p className="text-charcoal/60 text-sm">{r.guests} adult{r.guests === 1 ? '' : 's'}{quantity > 1 ? ' each' : ''}</p>
                  {avail?.pricePerNight != null && nights > 0 && (
                    <p className="text-charcoal/50 text-xs mt-0.5">
                      ₹{avail.pricePerNight.toLocaleString()}/night × {nights} night{nights === 1 ? '' : 's'}
                      {quantity > 1 ? ` × ${quantity} rooms` : ''} = ₹{(avail.pricePerNight * nights * quantity).toLocaleString()}
                    </p>
                  )}
                </div>
                <button onClick={() => handleRemove(r.propertyId)} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </div>
              {unavailable && (
                <p className="text-xs text-red-600 mt-3">
                  This room became fully booked for these dates — remove it or pick different dates.
                </p>
              )}
              {!unavailable && insufficientUnits && (
                <p className="text-xs text-red-600 mt-3">
                  Only {avail.unitsLeft} left for these dates — lower the room count or pick different dates.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {childcareEnabled && (
      <div className="bg-white border border-stone rounded-xl2 p-6 mb-6">
        <h2 className="font-serif text-lg mb-1">Kids Play Zone <span className="text-charcoal/40 text-sm font-sans">(optional)</span></h2>
        <p className="text-charcoal/60 text-sm mb-4">
          Supervised on-site play zone for kids under 12, priced per day per child — ₹{childcarePricing.perDayRate}/day for this {nights}-night stay.
        </p>
        <Select
          value={childrenCount}
          onChange={(e) => setChildrenCount(Number(e.target.value))}
          className="w-40 px-4 py-2 text-sm"
        >
          {Array.from({ length: maxChildrenForTrip + 1 }, (_, n) => n).map((n) => (
            <option key={n} value={n}>{n === 0 ? 'None' : `${n} child${n === 1 ? '' : 'ren'}`}</option>
          ))}
        </Select>
        <p className="text-xs text-charcoal/40 mt-2">Up to {childcarePricing.maxChildren} per room ({totalRoomUnits} room{totalRoomUnits === 1 ? '' : 's'} in this trip).</p>
        {childrenCount > 0 && (
          <p className="text-sm text-olive mt-3">
            + ₹{(childcarePricing.totalPerChild * childrenCount).toLocaleString()} for {childrenCount} child{childrenCount === 1 ? '' : 'ren'}
            {' '}(₹{childcarePricing.perDayRate}/day × {nights} night{nights === 1 ? '' : 's'} each)
          </p>
        )}
      </div>
      )}

      {fullBoardEnabled && (
      <div className="bg-white border border-stone rounded-xl2 p-6 mb-6">
        <h2 className="font-serif text-lg mb-1">Full Board <span className="text-charcoal/40 text-sm font-sans">(optional)</span></h2>
        <p className="text-charcoal/60 text-sm mb-4">
          Buffet lunch and dinner for all adults on the trip — ₹{fullBoardPricing.pricePerPersonPerDay}/person/day. Kids under 12 eat free.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFullBoard(false)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              !fullBoard ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => setFullBoard(true)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              fullBoard ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
            }`}
          >
            Yes
          </button>
        </div>
        {fullBoard && (
          <p className="text-sm text-olive mt-3">
            + ₹{fullBoardTotal.toLocaleString()} for {totalGuests} adult{totalGuests === 1 ? '' : 's'}
            {' '}(₹{fullBoardPricing.pricePerPersonPerDay}/person/day × {nights} night{nights === 1 ? '' : 's'})
          </p>
        )}
      </div>
      )}

      <div className="bg-stone/40 border border-stone rounded-xl2 p-5 mb-6">
        <h2 className="text-sm font-medium text-charcoal/80 mb-1.5">Good to know</h2>
        <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-charcoal/60 mb-2">
          <div className="flex gap-1.5">
            <dt className="text-charcoal/50">Check-in from</dt>
            <dd className="text-charcoal/80">{checkInTime}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-charcoal/50">Check-out by</dt>
            <dd className="text-charcoal/80">{checkOutTime}</dd>
          </div>
        </dl>
        {policyNotes?.length > 0 && (
          <ul className="list-disc list-inside text-sm text-charcoal/60 space-y-1">
            {policyNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        )}
      </div>

      <div className="bg-stone/40 border border-stone rounded-xl2 p-5 mb-6">
        <h2 className="text-sm font-medium text-charcoal/80 mb-1.5">Cancellation policy</h2>
        <p className="text-sm text-charcoal/60">
          Cancel any time before your check-in date, and before {checkInTime} on the check-in date
          itself, for a full refund. Cancelling after that (or not showing up) refunds you for any
          nights you haven't used yet, day by day.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone rounded-xl2 p-6 space-y-4">
        <label className="block text-sm text-charcoal/70">
          Anything we should know? <span className="text-charcoal/40">(optional)</span>
          <textarea
            rows={3}
            placeholder="Special requests, arrival time, etc."
            value={notes}
            onChange={(e) => setNotesState(e.target.value)}
            className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
          />
        </label>

        {user && !user.phone && (
          <p className="text-sm text-red-600">
            We don't have a phone number on file yet —{' '}
            <Link to="/complete-profile" state={{ from: location }} className="underline">
              add one to your profile
            </Link>{' '}
            before booking.
          </p>
        )}

        {checkingAvailability && <p className="text-sm text-charcoal/50">Confirming availability…</p>}
        {!checkingAvailability && hasInsufficientUnits && !hasUnavailableRoom && (
          <p className="text-sm text-red-600">
            One or more rooms don't have enough units left for the number you've selected — lower the room count or pick different dates.
          </p>
        )}

        <button
          type="submit"
          disabled={submitStatus === 'submitting' || checkingAvailability || hasUnavailableRoom || hasInsufficientUnits || (user && !user.phone)}
          className="w-full px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitStatus === 'submitting' ? 'Booking…' : user ? `Book & pay for ${totalRoomUnits} room${totalRoomUnits === 1 ? '' : 's'}` : 'Sign in to book'}
        </button>

        {submitStatus === 'error' && <p className="text-red-600 text-sm">{submitError}</p>}
        {!user && <p className="text-xs text-charcoal/50">You'll be asked to sign in with Google before your trip is confirmed.</p>}
        {user && <p className="text-xs text-charcoal/50">Payment is collected now to confirm your rooms.</p>}
      </form>
    </div>
  )
}
