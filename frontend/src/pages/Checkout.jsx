import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'
import { getCart, setNotes as saveNotes, removeRoom, clearCart } from '../lib/cart'
import PaymentBadge from '../components/PaymentBadge'

const roomTotal = (bookings) => bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0)
const tripTotal = (bookings) => roomTotal(bookings) + Number(bookings[0]?.childcareFee || 0)

export default function Checkout() {
  const { user, login } = useAuth()
  const location = useLocation()

  const [cart, setCartState] = useState(getCart())
  const [notes, setNotesState] = useState(cart.notes)
  const [availability, setAvailability] = useState({})
  const [checkingAvailability, setCheckingAvailability] = useState(true)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [confirmed, setConfirmed] = useState(null)
  const [payStatus, setPayStatus] = useState('idle')
  const [payError, setPayError] = useState('')
  const [childrenCount, setChildrenCount] = useState(0)
  const [childcarePricing, setChildcarePricing] = useState({ pricePerChild: 0, maxChildren: 2 })

  useEffect(() => {
    apiClient.get('/addons/childcare').then(({ data }) => setChildcarePricing(data)).catch(() => {})
  }, [])

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
        rooms: cart.rooms.map((r) => ({ propertyId: r.propertyId, guests: r.guests })),
        childrenCount,
      })
      clearCart()
      setConfirmed(data)
      setSubmitStatus('payment')
    } catch (err) {
      setSubmitStatus('error')
      setSubmitError(err.response?.data?.message || 'Something went wrong, please try again.')
    }
  }

  const pay = async () => {
    setPayStatus('paying')
    setPayError('')
    try {
      const groupId = confirmed[0].bookingGroupId
      const { data } = await apiClient.post(`/bookings/group/${groupId}/pay`)
      setConfirmed(data)
      setSubmitStatus('success')
    } catch (err) {
      setPayStatus('idle')
      setPayError(err.response?.data?.message || 'Something went wrong, please try again.')
    }
  }

  if (submitStatus === 'payment' && confirmed) {
    const total = tripTotal(confirmed)
    const childcareFee = Number(confirmed[0]?.childcareFee || 0)
    const bookedChildren = confirmed[0]?.childrenCount || 0
    return (
      <div className="max-w-xl mx-auto px-6 lg:px-10 py-20 text-center">
        <h1 className="font-serif text-3xl mb-2">Your room is held.</h1>
        <p className="text-charcoal/70 mb-8">Pay now to confirm, or settle up later from your bookings.</p>

        <div className="bg-white border border-stone rounded-xl2 p-6 mb-6 text-left">
          {confirmed.map((b) => (
            <div key={b.id} className="flex justify-between text-sm py-2 border-b border-stone last:border-0">
              <span className="text-charcoal/70">{b.propertyName} &middot; {b.checkIn} &rarr; {b.checkOut}</span>
              <span className="text-charcoal/80">₹{Number(b.amount).toLocaleString()}</span>
            </div>
          ))}
          {bookedChildren > 0 && (
            <div className="flex justify-between text-sm py-2 border-b border-stone last:border-0">
              <span className="text-charcoal/70">Kids Play Zone &middot; {bookedChildren} child{bookedChildren === 1 ? '' : 'ren'}</span>
              <span className="text-charcoal/80">₹{childcareFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 mt-1 font-serif text-lg">
            <span>Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={pay}
          disabled={payStatus === 'paying'}
          className="w-full px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 mb-3"
        >
          {payStatus === 'paying' ? 'Processing…' : `Pay ₹${total.toLocaleString()} now`}
        </button>
        <button onClick={() => setSubmitStatus('success')} className="text-sm text-charcoal/60 hover:underline">
          I'll pay later
        </button>
        {payError && <p className="text-red-600 text-sm mt-3">{payError}</p>}
      </div>
    )
  }

  if (submitStatus === 'success' && confirmed) {
    const allPaid = confirmed.every((b) => b.paymentStatus === 'PAID')
    const bookedChildren = confirmed[0]?.childrenCount || 0
    return (
      <div className="max-w-2xl mx-auto px-6 lg:px-10 py-20">
        <h1 className="font-serif text-3xl mb-4">{allPaid ? 'Trip confirmed & paid — see you soon.' : 'Trip confirmed — see you soon.'}</h1>
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
      <p className="text-charcoal/70 mb-8">{cart.checkIn} &rarr; {cart.checkOut}</p>

      <div className="space-y-4 mb-6">
        {cart.rooms.map((r) => {
          const avail = availability[r.propertyId]
          const unavailable = avail?.available === false
          return (
            <div key={r.propertyId} className={`bg-white border rounded-xl2 p-4 ${unavailable ? 'border-red-300' : 'border-stone'}`}>
              <div className="flex gap-4 items-center">
                <div
                  className="w-20 h-20 rounded-lg bg-stone bg-cover bg-center shrink-0"
                  style={{ backgroundImage: r.propertyHeroImageUrl ? `url(${r.propertyHeroImageUrl})` : undefined }}
                />
                <div className="flex-1">
                  <h2 className="font-serif text-lg">{r.propertyName}</h2>
                  <p className="text-charcoal/60 text-sm">{r.guests} guest{r.guests === 1 ? '' : 's'}</p>
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
            </div>
          )
        })}
      </div>

      <div className="bg-white border border-stone rounded-xl2 p-6 mb-6">
        <h2 className="font-serif text-lg mb-1">Kids Play Zone <span className="text-charcoal/40 text-sm font-sans">(optional)</span></h2>
        <p className="text-charcoal/60 text-sm mb-4">
          Supervised on-site play zone — one flat fee covers your whole trip, however many nights you stay.
        </p>
        <div className="flex items-center gap-2">
          {Array.from({ length: childcarePricing.maxChildren + 1 }, (_, n) => n).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setChildrenCount(n)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                childrenCount === n ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
              }`}
            >
              {n === 0 ? 'None' : `${n} child${n === 1 ? '' : 'ren'}`}
            </button>
          ))}
        </div>
        {childrenCount > 0 && (
          <p className="text-sm text-olive mt-3">
            + ₹{(childcarePricing.pricePerChild * childrenCount).toLocaleString()} for {childrenCount} child{childrenCount === 1 ? '' : 'ren'}, whole trip
          </p>
        )}
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

        <button
          type="submit"
          disabled={submitStatus === 'submitting' || checkingAvailability || hasUnavailableRoom || (user && !user.phone)}
          className="w-full px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitStatus === 'submitting' ? 'Booking…' : user ? `Book all ${cart.rooms.length} room${cart.rooms.length === 1 ? '' : 's'}` : 'Sign in to book'}
        </button>

        {submitStatus === 'error' && <p className="text-red-600 text-sm">{submitError}</p>}
        {!user && <p className="text-xs text-charcoal/50">You'll be asked to sign in with Google before your trip is confirmed.</p>}
      </form>
    </div>
  )
}
