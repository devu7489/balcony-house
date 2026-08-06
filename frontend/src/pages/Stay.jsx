import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import { getCart, setDates as saveDates, addRoom, removeRoom } from '../lib/cart'

const todayIso = () => new Date().toISOString().slice(0, 10)

export default function Stay() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  const initialCart = getCart()
  const [checkIn, setCheckIn] = useState(initialCart.checkIn)
  const [checkOut, setCheckOut] = useState(initialCart.checkOut)
  const [cartRooms, setCartRooms] = useState(initialCart.rooms)
  const [guestCounts, setGuestCounts] = useState({})
  const [availability, setAvailability] = useState({})

  useEffect(() => {
    apiClient.get('/properties')
      .then(({ data }) => setProperties(data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    saveDates(checkIn, checkOut)
    if (!checkIn || !checkOut || checkOut <= checkIn || properties.length === 0) {
      setAvailability({})
      return
    }
    let cancelled = false
    Promise.all(properties.map((p) =>
      apiClient.get(`/properties/${p.id}/availability`, { params: { checkIn, checkOut } })
        .then(({ data }) => [p.id, data])
        .catch(() => [p.id, null])
    )).then((results) => {
      if (cancelled) return
      setAvailability(Object.fromEntries(results))
    })
    return () => { cancelled = true }
  }, [checkIn, checkOut, properties])

  const guestsFor = (p) => guestCounts[p.id] ?? 1
  const inCart = (propertyId) => cartRooms.find((r) => r.propertyId === propertyId)

  const handleAdd = (p) => {
    const updated = addRoom({
      propertyId: p.id,
      propertyName: p.name,
      propertyHeroImageUrl: p.heroImageUrl,
      guests: guestsFor(p),
    })
    setCartRooms(updated.rooms)
  }

  const handleRemove = (propertyId) => {
    const updated = removeRoom(propertyId)
    setCartRooms(updated.rooms)
  }

  if (loading) return <LoadingScreen label="Gathering rooms" />

  const datesReady = checkIn && checkOut && checkOut > checkIn

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 pb-32">
      <h1 className="font-serif text-4xl mb-6">Stay</h1>

      <div className="bg-white border border-stone rounded-xl2 p-5 mb-10 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <label className="text-sm text-charcoal/70 col-span-1">
          Check-in
          <input
            type="date"
            min={todayIso()}
            value={checkIn}
            onChange={(e) => { setCheckIn(e.target.value); setCheckOut('') }}
            className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
          />
        </label>
        <label className="text-sm text-charcoal/70 col-span-1">
          Check-out
          <input
            type="date"
            min={checkIn || todayIso()}
            disabled={!checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive disabled:opacity-50"
          />
        </label>
        <p className="text-sm text-charcoal/50 col-span-2 md:col-span-2">
          {datesReady
            ? 'Add rooms below to build a multi-room trip, or just view & book one room directly.'
            : 'Pick your dates to see live availability and add multiple rooms to one trip.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((p) => {
          const avail = availability[p.id]
          const alreadyInCart = inCart(p.id)
          return (
            <div key={p.id} className="rounded-xl2 overflow-hidden bg-white border border-stone hover:shadow-lg transition-shadow flex flex-col">
              <Link to={`/stay/${p.id}`}>
                <div
                  className="h-56 bg-cover bg-center bg-stone"
                  style={{ backgroundImage: p.heroImageUrl ? `url(${p.heroImageUrl})` : undefined }}
                />
              </Link>
              <div className="p-6 flex-1 flex flex-col">
                <Link to={`/stay/${p.id}`}>
                  <h2 className="font-serif text-xl mb-2">{p.name}</h2>
                </Link>
                <p className="text-charcoal/70 text-sm mb-4">{p.description}</p>
                <ul className="flex flex-wrap gap-2 text-xs text-charcoal/60 mb-4">
                  {p.privateBalcony && <li className="px-3 py-1 bg-stone rounded-full">Private balcony</li>}
                  {p.workspaceAvailable && <li className="px-3 py-1 bg-stone rounded-full">Workspace</li>}
                  <li className="px-3 py-1 bg-stone rounded-full">Up to {p.maxGuests} guests</li>
                </ul>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-serif text-lg">₹{p.pricePerNight?.toLocaleString?.() ?? p.pricePerNight} / night</p>
                  <Link to={`/stay/${p.id}`} className="text-sm text-olive">View details &rarr;</Link>
                </div>

                <div className="mt-auto pt-4 border-t border-stone">
                  {!datesReady ? (
                    <p className="text-xs text-charcoal/40">Pick dates above to add this room to a trip.</p>
                  ) : alreadyInCart ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-olive">Added — {alreadyInCart.guests} guest{alreadyInCart.guests === 1 ? '' : 's'}</p>
                      <button onClick={() => handleRemove(p.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  ) : avail === undefined ? (
                    <p className="text-xs text-charcoal/40">Checking availability…</p>
                  ) : avail?.available ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={p.maxGuests}
                        value={guestsFor(p)}
                        onChange={(e) => setGuestCounts({ ...guestCounts, [p.id]: Number(e.target.value) })}
                        className="w-16 border border-stone rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-olive"
                      />
                      <button
                        onClick={() => handleAdd(p)}
                        className="flex-1 text-sm px-4 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors"
                      >
                        + Add to trip
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-red-600">Fully booked for these dates.</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {cartRooms.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-charcoal text-warmwhite z-30">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
            <p className="text-sm">Your trip: {cartRooms.length} room{cartRooms.length === 1 ? '' : 's'} selected</p>
            <button
              onClick={() => navigate('/checkout')}
              className="px-6 py-2.5 rounded-full bg-warmwhite text-charcoal hover:bg-stone transition-colors text-sm"
            >
              Review &amp; book &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
