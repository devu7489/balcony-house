import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import PaymentBadge from '../components/PaymentBadge'

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
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = () => apiClient.get('/admin/schedule/today').then(({ data }) => setSchedule(data))

  useEffect(() => {
    load().finally(() => setLoading(false))
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

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-1">Today</h1>
      <p className="text-charcoal/50 text-sm mb-10">{todayLabel}</p>

      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

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
