// Generates the set of valid physical room numbers for a property, so admin can only
// assign a number that actually belongs to that room's category (never, say, a Pinewood
// number to a Sunrise Room booking). Purely a display/UI convention - the backend still
// just stores whatever string is sent, see Booking.roomNumber's own comment for why.
const STOPWORDS = new Set(['the', 'a', 'an'])

function prefixFor(propertyName) {
  const initials = (propertyName || '')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join('')
  return initials || 'R'
}

export function roomNumberOptions(property) {
  if (!property) return []
  const prefix = prefixFor(property.name)
  return Array.from({ length: property.totalUnits || 0 }, (_, i) => `${prefix}-${i + 1}`)
}
