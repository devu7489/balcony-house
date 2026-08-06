import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/StatusBadge'

export default function AdminTripDetail() {
  const { groupId } = useParams()
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionStatus, setActionStatus] = useState('idle')
  const [actionError, setActionError] = useState('')

  const load = () => apiClient.get(`/admin/bookings/group/${groupId}`)
    .then(({ data }) => setBookings(data))
    .catch(() => setNotFound(true))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [groupId])

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

  if (loading) return <LoadingScreen label="Loading trip" />
  if (notFound || !bookings || bookings.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">This trip doesn't exist.</h1>
        <Link to="/admin" className="text-olive hover:underline">Back to Admin</Link>
      </div>
    )
  }

  const first = bookings[0]
  const guestLine = [first.guestName, first.guestEmail, first.guestPhone].filter(Boolean).join(' · ')
  const notes = bookings.map((b) => b.notes).find(Boolean)

  const anyConfirmed = bookings.some((b) => b.status === 'CONFIRMED')
  const anyCheckedIn = bookings.some((b) => b.status === 'CHECKED_IN')
  const anyActive = anyConfirmed || anyCheckedIn

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/admin" className="text-sm text-olive hover:underline">&larr; Back to Admin</Link>

      <div className="mt-6 bg-white border border-stone rounded-xl2 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Trip &middot; {bookings.length} rooms</p>
            <h1 className="font-serif text-2xl">{guestLine || 'Guest'}</h1>
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

        <div className="space-y-3 mb-6">
          {bookings.map((b) => (
            <div key={b.id} className="flex gap-4 items-center border border-stone rounded-xl2 p-4">
              <div
                className="w-16 h-16 rounded-lg bg-stone bg-cover bg-center shrink-0"
                style={{ backgroundImage: b.propertyHeroImageUrl ? `url(${b.propertyHeroImageUrl})` : undefined }}
              />
              <div className="flex-1">
                <h2 className="font-serif text-lg">{b.propertyName || `Room #${b.propertyId}`}</h2>
                <p className="text-charcoal/60 text-sm">{b.guests} guest{b.guests === 1 ? '' : 's'}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {anyConfirmed && (
            <button
              onClick={() => runAction('check-in')}
              disabled={actionStatus === 'running'}
              className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
            >
              Check-in trip
            </button>
          )}
          {anyCheckedIn && (
            <button
              onClick={() => runAction('check-out')}
              disabled={actionStatus === 'running'}
              className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
            >
              Check-out trip
            </button>
          )}
          {anyActive && (
            <button
              onClick={() => runAction('cancel')}
              disabled={actionStatus === 'running'}
              className="px-6 py-2.5 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel trip
            </button>
          )}
        </div>

        {actionError && <p className="text-red-600 text-sm mt-4">{actionError}</p>}
      </div>
    </div>
  )
}
