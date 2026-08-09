// Clusters a flat list of BookingDto into { type: 'single', booking } or
// { type: 'group', bookingGroupId, bookings } entries, preserving first-seen order.
export function groupBookings(bookings) {
  const entries = []
  const indexByGroupId = new Map()

  for (const b of bookings) {
    if (!b.bookingGroupId) {
      entries.push({ type: 'single', booking: b })
      continue
    }
    if (indexByGroupId.has(b.bookingGroupId)) {
      entries[indexByGroupId.get(b.bookingGroupId)].bookings.push(b)
    } else {
      indexByGroupId.set(b.bookingGroupId, entries.length)
      entries.push({ type: 'group', bookingGroupId: b.bookingGroupId, bookings: [b] })
    }
  }
  return entries
}
