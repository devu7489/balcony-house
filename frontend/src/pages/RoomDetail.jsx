import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../context/AuthContext'

const todayIso = () => new Date().toISOString().slice(0, 10)
const pendingKey = (id) => `balconyhouse:pendingBooking:${id}`

export default function RoomDetail() {
  const { id } = useParams()
  const { user, login } = useAuth()
  const location = useLocation()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 1, notes: '' })
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    apiClient.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))

    const saved = sessionStorage.getItem(pendingKey(id))
    if (saved) {
      sessionStorage.removeItem(pendingKey(id))
      try {
        const parsed = JSON.parse(saved)
        setForm({
          checkIn: parsed.checkIn || '',
          checkOut: parsed.checkOut || '',
          guests: parsed.guests || 1,
          notes: parsed.notes || '',
        })
      } catch {
        // ignore malformed sessionStorage content
      }
    }
  }, [id])

  useEffect(() => {
    if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
      setAvailability(null)
      return
    }
    setCheckingAvailability(true)
    apiClient.get(`/properties/${id}/availability`, { params: { checkIn: form.checkIn, checkOut: form.checkOut } })
      .then(({ data }) => setAvailability(data))
      .catch(() => setAvailability(null))
      .finally(() => setCheckingAvailability(false))
  }, [id, form.checkIn, form.checkOut])

  if (loading) return <LoadingScreen label="Loading room" />
  if (notFound || !property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">This room doesn't exist.</h1>
        <Link to="/stay" className="text-olive hover:underline">Back to Stay</Link>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!user) {
      sessionStorage.setItem(pendingKey(id), JSON.stringify(form))
      login()
      return
    }
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      await apiClient.post('/bookings', {
        propertyId: Number(id),
        guestPhone: user.phone,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        notes: form.notes || null,
      })
      setSubmitStatus('success')
    } catch (err) {
      setSubmitStatus('error')
      setSubmitError(err.response?.data?.message || 'Something went wrong, please try again.')
    }
  }

  const canSubmit = form.checkIn && form.checkOut && form.checkOut > form.checkIn
    && (!user || user.phone) && availability?.available !== false

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/stay" className="text-sm text-olive hover:underline">&larr; Back to Stay</Link>

      <div className="grid md:grid-cols-2 gap-10 mt-6">
        <div>
          <div
            className="h-72 md:h-96 rounded-xl2 bg-cover bg-center bg-stone"
            style={{ backgroundImage: property.heroImageUrl ? `url(${property.heroImageUrl})` : undefined }}
          />
          <h1 className="font-serif text-3xl mt-6 mb-2">{property.name}</h1>
          <p className="text-charcoal/70 mb-4">{property.description}</p>
          <ul className="flex flex-wrap gap-2 text-xs text-charcoal/60 mb-4">
            {property.privateBalcony && <li className="px-3 py-1 bg-stone rounded-full">Private balcony</li>}
            {property.workspaceAvailable && <li className="px-3 py-1 bg-stone rounded-full">Workspace</li>}
            <li className="px-3 py-1 bg-stone rounded-full">Up to {property.maxGuests} guests</li>
          </ul>
          <p className="font-serif text-xl">₹{property.pricePerNight?.toLocaleString?.() ?? property.pricePerNight} / night</p>
        </div>

        <div className="bg-white border border-stone rounded-xl2 p-6 h-fit">
          <h2 className="font-serif text-xl mb-6">Book this stay</h2>

          {submitStatus === 'success' ? (
            <div>
              <p className="text-olive mb-4">Booking confirmed — see you soon.</p>
              <Link to="/my-bookings" className="inline-block px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors">
                View my bookings
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-charcoal/70">
                  Check-in
                  <input
                    required
                    type="date"
                    min={todayIso()}
                    value={form.checkIn}
                    onChange={(e) => setForm({ ...form, checkIn: e.target.value, checkOut: '' })}
                    className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                  />
                </label>
                <label className="text-sm text-charcoal/70">
                  Check-out
                  <input
                    required
                    type="date"
                    min={form.checkIn || todayIso()}
                    value={form.checkOut}
                    onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    disabled={!form.checkIn}
                    className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive disabled:opacity-50"
                  />
                </label>
              </div>

              <label className="block text-sm text-charcoal/70">
                Guests
                <input
                  required
                  type="number"
                  min={1}
                  max={property.maxGuests}
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                />
              </label>

              <label className="block text-sm text-charcoal/70">
                Anything we should know? <span className="text-charcoal/40">(optional)</span>
                <textarea
                  rows={3}
                  placeholder="Special requests, arrival time, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

              {checkingAvailability && <p className="text-sm text-charcoal/50">Checking availability…</p>}
              {!checkingAvailability && availability?.available === true && (
                <p className="text-sm text-olive">Available — {availability.unitsLeft} room{availability.unitsLeft === 1 ? '' : 's'} left for these dates.</p>
              )}
              {!checkingAvailability && availability?.available === false && (
                <p className="text-sm text-red-600">Fully booked for these dates — try a different range.</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || submitStatus === 'submitting'}
                className="w-full px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitStatus === 'submitting' ? 'Booking…' : user ? 'Book Now' : 'Sign in to book'}
              </button>

              {submitStatus === 'error' && <p className="text-red-600 text-sm">{submitError}</p>}
              {!user && <p className="text-xs text-charcoal/50">You'll be asked to sign in with Google before your booking is confirmed.</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
