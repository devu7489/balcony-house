import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'

const ACTION_LABELS = {
  CREATED: 'Booking created',
  CHECKED_IN: 'Checked in',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
  PAYMENT_RECORDED: 'Payment recorded',
  REFUND_RECORDED: 'Refund recorded',
  ROOM_NUMBER_SET: 'Room number set',
  ROOM_CHANGED: 'Room changed',
}

// Shared between AdminBookingDetail.jsx and AdminTripDetail.jsx - fetches its own data so
// each detail page just drops it in rather than threading loading state through. The page
// bumps refreshKey (e.g. on every successful action that reloads the booking/trip) to make
// this refetch in place - bookingId/groupId alone don't change after an edit, so without
// this the list would silently go stale until a full page reload.
export default function ActivityLog({ bookingId, groupId, refreshKey }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const url = groupId ? `/admin/bookings/group/${groupId}/activity` : `/admin/bookings/${bookingId}/activity`
    apiClient.get(url).then(({ data }) => setEntries(data)).finally(() => setLoading(false))
  }, [bookingId, groupId, refreshKey])

  if (loading || entries.length === 0) return null

  return (
    <div className="bg-white border border-stone rounded-xl2 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs uppercase tracking-wide text-charcoal/50"
      >
        <span>Activity ({entries.length})</span>
        <span className="text-charcoal/40">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="text-sm flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className="text-charcoal/80">{ACTION_LABELS[e.action] || e.action}</span>
                <span className="text-charcoal/50"> by {e.performedBy}</span>
                {e.details && <p className="text-xs text-charcoal/50">{e.details}</p>}
              </div>
              <span className="text-charcoal/40 text-xs whitespace-nowrap">
                {new Date(e.occurredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
