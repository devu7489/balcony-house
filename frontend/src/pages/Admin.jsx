import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import Select from '../components/Select'
import { groupBookings } from '../lib/groupBookings'
import { useHotelConfig } from '../context/HotelConfigContext'

const todayIso = () => new Date().toISOString().slice(0, 10)
const nextDayIso = (dateStr) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
const tomorrowIso = () => nextDayIso(todayIso())
const emptyForm = () => ({
  propertyId: '', guestName: '', guestPhone: '', guestEmail: '', checkIn: todayIso(), checkOut: tomorrowIso(), guests: 1, notes: '',
  paymentReceived: false, paymentMethod: 'Cash', paymentReference: '', childrenCount: 0,
  fullBoard: false, discountPercent: 0,
})
const totalAmount = (bookings) =>
  bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  + Number(bookings[0]?.childcareFee || 0)
  + Number(bookings[0]?.fullBoardFee || 0)
  - Number(bookings[0]?.discountAmount || 0)

function AdminBookingRow({ b, to, compact = false }) {
  return (
    <Link
      to={to || `/admin/bookings/${b.id}`}
      className="flex gap-4 items-center bg-white hover:shadow-lg transition-shadow p-4 rounded-xl2"
    >
      <div
        className="w-20 h-20 rounded-lg bg-stone bg-cover bg-center shrink-0"
        style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
      />
      <div className="flex-1">
        <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
        {!compact && (
          <p className="text-charcoal/70 text-sm">
            {[b.guestName, b.guestEmail, b.guestPhone].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-charcoal/60 text-sm">
          {!compact && <>{b.checkIn} &rarr; {b.checkOut} &middot; </>}
          {b.guests} guest{b.guests === 1 ? '' : 's'}
          {!compact && b.amount != null && <> &middot; ₹{totalAmount([b]).toLocaleString()}</>}
        </p>
        {!compact && b.childrenCount > 0 && (
          <p className="text-charcoal/50 text-xs mt-0.5">Kids Play Zone &middot; {b.childrenCount} child{b.childrenCount === 1 ? '' : 'ren'}</p>
        )}
        {!compact && b.fullBoard && (
          <p className="text-charcoal/50 text-xs mt-0.5">Full Board</p>
        )}
        {!compact && b.discountPercent > 0 && (
          <p className="text-charcoal/50 text-xs mt-0.5">{b.discountPercent}% discount applied</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={b.status} />
        {!compact && b.status !== 'CANCELLED' && <PaymentBadge status={b.paymentStatus} />}
      </div>
    </Link>
  )
}

export default function Admin() {
  const { childcareEnabled, fullBoardEnabled } = useHotelConfig()
  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('bookingTime')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [childcarePricing, setChildcarePricing] = useState({ perDayRate: 0, totalPerChild: 0, maxChildren: 2 })
  const [fullBoardPricing, setFullBoardPricing] = useState({ pricePerPersonPerDay: 0 })

  const loadBookings = () => apiClient.get('/admin/bookings').then(({ data }) => setBookings(data))

  useEffect(() => {
    Promise.all([
      loadBookings(),
      apiClient.get('/properties').then(({ data }) => setProperties(data)),
      apiClient.get('/addons/fullboard').then(({ data }) => setFullBoardPricing(data)).catch(() => {}),
    ]).finally(() => setLoading(false))
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

  const formNights = form.checkIn && form.checkOut && form.checkOut > form.checkIn
    ? Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000)
    : 0

  useEffect(() => {
    if (formNights <= 0) return
    apiClient.get('/addons/childcare', { params: { nights: formNights } }).then(({ data }) => setChildcarePricing(data)).catch(() => {})
  }, [formNights])

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
        paymentReceived: form.paymentReceived,
        paymentMethod: form.paymentReceived ? form.paymentMethod : null,
        paymentReference: form.paymentReceived ? (form.paymentReference || null) : null,
        childrenCount: form.childrenCount,
        fullBoard: form.fullBoard,
        discountPercent: form.discountPercent,
      })
      setSubmitStatus('idle')
      setForm(emptyForm())
      setAvailability(null)
      setShowForm(false)
      await loadBookings()
    } catch (err) {
      setSubmitStatus('error')
      const data = err.response?.data
      const details = data?.details?.length ? `: ${data.details.join(', ')}` : ''
      setSubmitError((data?.message || 'Something went wrong, please try again.') + details)
    }
  }

  const canSubmit = form.propertyId && form.guestName && form.guestPhone && form.checkIn && form.checkOut
    && form.checkOut > form.checkIn && availability?.available === true

  const query = search.trim().toLowerCase()
  const searchedBookings = query
    ? bookings.filter((b) => [b.id, b.guestName, b.guestEmail, b.guestPhone, b.propertyName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)))
    : bookings
  const filteredBookings = sortBy === 'checkIn'
    ? [...searchedBookings].sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    : [...searchedBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (loading) return <LoadingScreen label="Loading admin dashboard" />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl">Bookings</h1>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors"
          >
            {showForm ? 'Cancel' : '+ New phone booking'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-stone rounded-xl2 p-6 mb-10 space-y-4">
          <label className="block text-sm text-charcoal/70">
            Room
            <Select
              required
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              className="mt-1 px-3 py-2.5"
            >
              <option value="" disabled>Select a room</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — up to {p.maxGuests} guests</option>
              ))}
            </Select>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">
            <label className="text-sm text-charcoal/70 min-w-0">
              Check-in
              <input
                required
                type="date"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value, checkOut: nextDayIso(e.target.value) })}
                className="mt-1 w-full min-w-0 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-3 focus:outline-none focus:border-olive"
              />
            </label>
            <label className="text-sm text-charcoal/70 min-w-0">
              Check-out
              <input
                required
                type="date"
                min={form.checkIn || undefined}
                disabled={!form.checkIn}
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="mt-1 w-full min-w-0 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-3 focus:outline-none focus:border-olive disabled:opacity-50"
              />
            </label>
          </div>

          <label className="block text-sm text-charcoal/70">
            Adults
            <Select
              required
              value={Math.min(Number(form.guests), selectedProperty?.maxGuests || 1)}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
              className="mt-1 px-3 py-2.5"
            >
              {Array.from({ length: selectedProperty?.maxGuests || 1 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
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

          {childcareEnabled && (
          <div className="border-t border-stone pt-4">
            <p className="text-sm text-charcoal/70 mb-2">Kids Play Zone <span className="text-charcoal/40">(optional)</span></p>
            {formNights <= 0 ? (
              <p className="text-xs text-charcoal/40">Pick check-in/check-out above to price this.</p>
            ) : (
              <>
                <p className="text-xs text-charcoal/50 mb-2">For kids under 12 — ₹{childcarePricing.perDayRate}/day per child for this {formNights}-night stay.</p>
                <div className="flex items-center gap-2">
                  {Array.from({ length: childcarePricing.maxChildren + 1 }, (_, n) => n).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, childrenCount: n })}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        form.childrenCount === n ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
                      }`}
                    >
                      {n === 0 ? 'None' : `${n} child${n === 1 ? '' : 'ren'}`}
                    </button>
                  ))}
                </div>
                {form.childrenCount > 0 && (
                  <p className="text-sm text-olive mt-2">
                    + ₹{(childcarePricing.totalPerChild * form.childrenCount).toLocaleString()} for {form.childrenCount} child{form.childrenCount === 1 ? '' : 'ren'}
                    {' '}(₹{childcarePricing.perDayRate}/day × {formNights} night{formNights === 1 ? '' : 's'} each)
                  </p>
                )}
              </>
            )}
          </div>
          )}

          {fullBoardEnabled && (
          <div className="border-t border-stone pt-4">
            <p className="text-sm text-charcoal/70 mb-2">Full Board <span className="text-charcoal/40">(optional)</span></p>
            {formNights <= 0 ? (
              <p className="text-xs text-charcoal/40">Pick check-in/check-out above to price this.</p>
            ) : (
              <>
                <p className="text-xs text-charcoal/50 mb-2">
                  Lunch &amp; dinner for adults &mdash; ₹{fullBoardPricing.pricePerPersonPerDay}/person/day. Kids under 12 eat free.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, fullBoard: false })}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      !form.fullBoard ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, fullBoard: true })}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      form.fullBoard ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
                    }`}
                  >
                    Yes
                  </button>
                </div>
                {form.fullBoard && (
                  <p className="text-sm text-olive mt-2">
                    + ₹{(fullBoardPricing.pricePerPersonPerDay * Number(form.guests) * formNights).toLocaleString()}
                    {' '}for {form.guests} adult{Number(form.guests) === 1 ? '' : 's'}
                    {' '}(₹{fullBoardPricing.pricePerPersonPerDay}/person/day × {formNights} night{formNights === 1 ? '' : 's'})
                  </p>
                )}
              </>
            )}
          </div>
          )}

          <div className="border-t border-stone pt-4">
            <p className="text-sm text-charcoal/70 mb-2">Discount <span className="text-charcoal/40">(optional)</span></p>
            <div className="flex items-center gap-2">
              {[0, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setForm({ ...form, discountPercent: pct })}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    form.discountPercent === pct ? 'bg-olive text-warmwhite border-olive' : 'border-stone text-charcoal/70 hover:border-olive'
                  }`}
                >
                  {pct === 0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone pt-4">
            <label className="flex items-center gap-2 text-sm text-charcoal/70">
              <input
                type="checkbox"
                checked={form.paymentReceived}
                onChange={(e) => setForm({ ...form, paymentReceived: e.target.checked })}
                className="rounded border-stone"
              />
              Payment received
            </label>
            {form.paymentReceived && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="text-sm text-charcoal/70">
                  Method
                  <Select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="mt-1 px-3 py-2.5"
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Other</option>
                  </Select>
                </label>
                <label className="text-sm text-charcoal/70">
                  Reference <span className="text-charcoal/40">(optional)</span>
                  <input
                    placeholder="txn id / notes"
                    value={form.paymentReference}
                    onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                    className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
                  />
                </label>
              </div>
            )}
          </div>

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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by guest name, email, phone, or room…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive bg-white"
        />
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sm:w-56 px-4 py-3"
        >
          <option value="bookingTime">Sort: Booking time (newest)</option>
          <option value="checkIn">Sort: Check-in date</option>
        </Select>
      </div>

      {filteredBookings.length === 0 ? (
        <p className="text-charcoal/70">{bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your search.'}</p>
      ) : (
        <div className="space-y-4">
          {groupBookings(filteredBookings).map((entry) =>
            entry.type === 'single' ? (
              <AdminBookingRow key={entry.booking.id} b={entry.booking} />
            ) : (
              <div key={entry.bookingGroupId} className="bg-stone/40 border border-stone rounded-xl2 p-4">
                <div className="flex items-start justify-between gap-4 mb-3 px-1">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">
                      Trip &middot; {entry.bookings.length} rooms
                    </p>
                    <p className="text-sm text-charcoal/70">
                      {[entry.bookings[0].guestName, entry.bookings[0].guestEmail, entry.bookings[0].guestPhone].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-sm text-charcoal/60 mb-2">{entry.bookings[0].checkIn} &rarr; {entry.bookings[0].checkOut}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-charcoal/70">₹{totalAmount(entry.bookings).toLocaleString()}</span>
                      {entry.bookings.some((b) => b.status !== 'CANCELLED') && (
                        <PaymentBadge status={
                          entry.bookings.filter((b) => b.status !== 'CANCELLED').every((b) => b.paymentStatus === 'PAID')
                            ? 'PAID' : 'PENDING'
                        } />
                      )}
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
                  <Link to={`/admin/trips/${entry.bookingGroupId}`} className="text-xs text-olive hover:underline shrink-0">
                    View trip &rarr;
                  </Link>
                </div>
                <div className="space-y-3">
                  {entry.bookings.map((b) => (
                    <AdminBookingRow key={b.id} b={b} to={`/admin/trips/${entry.bookingGroupId}`} compact />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
