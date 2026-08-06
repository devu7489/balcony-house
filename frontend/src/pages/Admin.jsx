import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'

const emptyForm = { propertyId: '', guestName: '', guestPhone: '', guestEmail: '', checkIn: '', checkOut: '', guests: 1, notes: '' }

export default function Admin() {
  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  const loadBookings = () => apiClient.get('/admin/bookings').then(({ data }) => setBookings(data))

  useEffect(() => {
    Promise.all([loadBookings(), apiClient.get('/properties').then(({ data }) => setProperties(data))])
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.propertyId || !form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
      setAvailability(null)
      return
    }
    setCheckingAvailability(true)
    apiClient.get(`/properties/${form.propertyId}/availability`, { params: { checkIn: form.checkIn, checkOut: form.checkOut } })
      .then(({ data }) => setAvailability(data))
      .catch(() => setAvailability(null))
      .finally(() => setCheckingAvailability(false))
  }, [form.propertyId, form.checkIn, form.checkOut])

  const selectedProperty = properties.find((p) => String(p.id) === String(form.propertyId))

  const submit = async (e) => {
    e.preventDefault()
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      await apiClient.post('/admin/bookings', {
        propertyId: Number(form.propertyId),
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail || null,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        notes: form.notes || null,
      })
      setSubmitStatus('idle')
      setForm(emptyForm)
      setAvailability(null)
      setShowForm(false)
      await loadBookings()
    } catch (err) {
      setSubmitStatus('error')
      setSubmitError(err.response?.data?.message || 'Something went wrong, please try again.')
    }
  }

  const canSubmit = form.propertyId && form.guestName && form.guestPhone && form.checkIn && form.checkOut
    && form.checkOut > form.checkIn && availability?.available !== false

  const query = search.trim().toLowerCase()
  const filteredBookings = query
    ? bookings.filter((b) => [b.id, b.guestName, b.guestEmail, b.guestPhone, b.propertyName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)))
    : bookings

  if (loading) return <LoadingScreen label="Loading admin dashboard" />

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-serif text-4xl">Admin — Bookings</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors"
        >
          {showForm ? 'Cancel' : '+ New phone booking'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-stone rounded-xl2 p-6 mb-10 space-y-4">
          <label className="block text-sm text-charcoal/70">
            Room
            <select
              required
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive bg-white"
            >
              <option value="" disabled>Select a room</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — up to {p.maxGuests} guests</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-charcoal/70">
              Guest name
              <input
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
              />
            </label>
            <label className="text-sm text-charcoal/70">
              Guest phone
              <input
                required
                value={form.guestPhone}
                onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
              />
            </label>
          </div>

          <label className="block text-sm text-charcoal/70">
            Guest email <span className="text-charcoal/40">(optional)</span>
            <input
              type="email"
              value={form.guestEmail}
              onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
              className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-charcoal/70">
              Check-in
              <input
                required
                type="date"
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
                min={form.checkIn || undefined}
                disabled={!form.checkIn}
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
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
              max={selectedProperty?.maxGuests}
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
              className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>

          <label className="block text-sm text-charcoal/70">
            Notes / special request <span className="text-charcoal/40">(optional)</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>

          {checkingAvailability && <p className="text-sm text-charcoal/50">Checking availability…</p>}
          {!checkingAvailability && availability?.available === true && (
            <p className="text-sm text-olive">Available — {availability.unitsLeft} room{availability.unitsLeft === 1 ? '' : 's'} left.</p>
          )}
          {!checkingAvailability && availability?.available === false && (
            <p className="text-sm text-red-600">Fully booked for these dates.</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitStatus === 'submitting'}
            className="px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitStatus === 'submitting' ? 'Booking…' : 'Create booking'}
          </button>
          {submitStatus === 'error' && <p className="text-red-600 text-sm">{submitError}</p>}
        </form>
      )}

      <input
        type="search"
        placeholder="Search by guest name, email, phone, or room…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-stone rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-olive bg-white"
      />

      {filteredBookings.length === 0 ? (
        <p className="text-charcoal/70">{bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your search.'}</p>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <Link
              to={`/admin/bookings/${b.id}`}
              key={b.id}
              className="flex gap-4 items-center bg-white border border-stone rounded-xl2 p-4 hover:shadow-lg transition-shadow"
            >
              <div
                className="w-20 h-20 rounded-lg bg-stone bg-cover bg-center shrink-0"
                style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
              />
              <div className="flex-1">
                <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
                <p className="text-charcoal/70 text-sm">
                  {[b.guestName, b.guestEmail, b.guestPhone].filter(Boolean).join(' · ')}
                </p>
                <p className="text-charcoal/60 text-sm">{b.checkIn} &rarr; {b.checkOut} &middot; {b.guests} guest{b.guests === 1 ? '' : 's'}</p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
