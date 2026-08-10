// Policy: full refund if check-in hasn't arrived yet; after check-in (or a no-show), the
// refund covers only the nights not yet used, at each room's actual rate, day by day.
//
// Deliberately doesn't compute a ₹ figure here. It used to (a flat elapsed/total fraction of
// the total), which is only correct when a single room's rate never changed across the whole
// stay/trip - it drifted from the real backend figure for an upgraded room, and again for a
// multi-room trip where addon fees (childcare/full board) are only carried by one room. The
// real number always comes from the backend at cancellation time (see
// backend/src/main/java/com/thebalconyhouse/backend/addon/CancellationPolicy.java) and shows
// up on the booking/trip page right after - this dialog only needs to set expectations, not
// match it to the rupee.
export function cancellationConfirmMessage(checkIn, checkOut, tripWide) {
  const subject = tripWide ? 'this whole trip' : 'this booking'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkInDate = new Date(checkIn)
  checkInDate.setHours(0, 0, 0, 0)

  if (today < checkInDate) {
    return `Cancel ${subject}? You'll get a full refund since check-in hasn't started yet. This can't be undone.`
  }
  return `Cancel ${subject}? Check-in has already started, so you'll only be refunded for nights not yet used — the exact amount will show right after cancelling. This can't be undone.`
}

// Matches backend/src/main/java/com/thebalconyhouse/backend/booking/CancellationType.java -
// auto-classified at cancel time from data the system already has, not an admin choice.
const CANCELLATION_TYPE_LABELS = {
  PRE_ARRIVAL: 'Before check-in',
  MID_STAY: 'Mid-stay',
  NO_SHOW: 'No-show',
}

export function cancellationTypeLabel(type) {
  return CANCELLATION_TYPE_LABELS[type] || null
}
