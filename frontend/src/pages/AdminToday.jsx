import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import PaymentBadge from '../components/PaymentBadge'

const money = (n) => `${Number(n) < 0 ? '−' : ''}₹${Math.abs(Number(n || 0)).toLocaleString()}`

function CollectionSummary({ collection }) {
  if (!collection) return null
  const methods = Object.entries(collection.byMethod).sort(([a], [b]) => {
    if (a === 'Cash') return -1
    if (b === 'Cash') return 1
    return a.localeCompare(b)
  })
  return (
    <section className="mb-10 bg-white border border-stone rounded-xl2 p-5">
      <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Collected today</p>
      <p className={`font-serif text-3xl ${Number(collection.total) < 0 ? 'text-red-600' : 'text-olive'}`}>
        {money(collection.total)}
      </p>
      {methods.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {methods.map(([method, amount]) => (
            <span key={method} className="text-xs px-2.5 py-1 rounded-full bg-stone text-charcoal/70">
              {method} &middot; {money(amount)}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

function ScheduleRow({ b, actionLabel, onAction, busy }) {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-white border border-stone rounded-xl2 p-4">
      <div className="flex-1 min-w-[10rem]">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-serif text-base">{b.propertyName || `Room #${b.propertyId}`}</h3>
          {b.roomNumber && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone text-charcoal/70">{b.roomNumber}</span>
          )}
        </div>
        <p className="text-charcoal/70 text-sm">{[b.guestName, b.guestPhone].filter(Boolean).join(' · ')}</p>
        <p className="text-charcoal/50 text-xs mt-0.5">
          {b.guests} guest{b.guests === 1 ? '' : 's'}{b.notes ? ` · ${b.notes}` : ''}
        </p>
      </div>
      <PaymentBadge status={b.paymentStatus} />
      <div className="flex items-center gap-3">
        <button
          onClick={() => onAction(b.id)}
          disabled={busy}
          className="text-sm px-4 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          {actionLabel}
        </button>
        <Link
          to={b.bookingGroupId ? `/admin/trips/${b.bookingGroupId}` : `/admin/bookings/${b.id}`}
          className="text-xs text-olive hover:underline whitespace-nowrap"
        >
          Details &rarr;
        </Link>
      </div>
    </div>
  )
}

export default function AdminToday() {
  const [schedule, setSchedule] = useState(null)
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = () => apiClient.get('/admin/schedule/today')
    .then(({ data }) => { setSchedule(data); setLoadError(false) })
    .catch(() => setLoadError(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
    // Non-critical: today's schedule (arrivals/departures) is the page's core purpose and
    // fails loudly via loadError, but the cash summary is supplementary - if it fails to load
    // the page should still work for check-in/out, just without that section.
    apiClient.get('/admin/reports/collections/today').then(({ data }) => setCollection(data)).catch(() => {})
  }, [])

  const act = async (id, action) => {
    setBusyId(id)
    setError('')
    try {
      await apiClient.post(`/admin/bookings/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong, please try again.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <LoadingScreen label="Loading today's schedule" />
  if (loadError || !schedule) return <p className="text-red-600">Couldn't load today's schedule — please try refreshing the page.</p>

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-1">Today</h1>
      <p className="text-charcoal/50 text-sm mb-10">{todayLabel}</p>

      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

      <CollectionSummary collection={collection} />

      <section className="mb-12">
        <h2 className="font-serif text-xl mb-4">
          Arrivals <span className="text-charcoal/40 text-sm font-sans">({schedule.arrivals.length})</span>
        </h2>
        {schedule.arrivals.length === 0 ? (
          <p className="text-charcoal/50 text-sm">No check-ins scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {schedule.arrivals.map((b) => (
              <ScheduleRow key={b.id} b={b} actionLabel="Check in" onAction={(id) => act(id, 'check-in')} busy={busyId === b.id} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">
          Departures <span className="text-charcoal/40 text-sm font-sans">({schedule.departures.length})</span>
        </h2>
        {schedule.departures.length === 0 ? (
          <p className="text-charcoal/50 text-sm">No check-outs scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {schedule.departures.map((b) => (
              <ScheduleRow key={b.id} b={b} actionLabel="Check out" onAction={(id) => act(id, 'check-out')} busy={busyId === b.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
