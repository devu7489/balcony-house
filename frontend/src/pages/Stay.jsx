import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import Select from '../components/Select'
import { getCart, setDates as saveDates, addRoom, removeRoom } from '../lib/cart'
import { todayIso, nextDayIso, tomorrowIso } from '../lib/dates'
import { useHotelConfig } from '../context/HotelConfigContext'

export default function Stay() {
  const navigate = useNavigate()
  const { childcareEnabled } = useHotelConfig()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  const initialCart = getCart()
  const [checkIn, setCheckIn] = useState(initialCart.checkIn || todayIso())
  const [checkOut, setCheckOut] = useState(initialCart.checkOut || tomorrowIso())
  const [cartRooms, setCartRooms] = useState(initialCart.rooms)
  const [guestCounts, setGuestCounts] = useState({})
  const [quantityCounts, setQuantityCounts] = useState({})
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
  const quantityFor = (p) => quantityCounts[p.id] ?? 1
  const inCart = (propertyId) => cartRooms.find((r) => r.propertyId === propertyId)

  const handleAdd = (p) => {
    const updated = addRoom({
      propertyId: p.id,
      propertyName: p.name,
      propertyHeroImageUrl: p.heroImageUrl,
      guests: guestsFor(p),
      quantity: quantityFor(p),
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

      <div className="bg-white border border-stone rounded-xl2 p-5 mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end overflow-hidden">
        <label className="text-sm text-charcoal/70 col-span-1 min-w-0">
          Check-in
          <input
            type="date"
            min={todayIso()}
            value={checkIn}
            onChange={(e) => { setCheckIn(e.target.value); setCheckOut(nextDayIso(e.target.value)) }}
            className="mt-1 w-full min-w-0 h-11 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-3 focus:outline-none focus:border-olive"
          />
        </label>
        <label className="text-sm text-charcoal/70 col-span-1 min-w-0">
          Check-out
          <input
            type="date"
            min={checkIn || todayIso()}
            disabled={!checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 w-full min-w-0 h-11 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-3 focus:outline-none focus:border-olive disabled:opacity-50"
          />
        </label>
        <p className="text-sm text-charcoal/50 col-span-1 sm:col-span-2 md:col-span-2 self-center">
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
                  <p className="font-serif text-lg">
                    ₹{(avail?.pricePerNight ?? p.pricePerNight)?.toLocaleString?.() ?? p.pricePerNight} / night
                    {avail?.pricePerNight && avail.pricePerNight !== p.pricePerNight && (
                      <span className="text-xs text-olive font-sans ml-1">(for these dates)</span>
                    )}
                  </p>
                  <Link to={`/stay/${p.id}`} className="text-sm text-olive">View details &rarr;</Link>
                </div>

                <div className="mt-auto pt-4 border-t border-stone">
                  {!datesReady ? (
                    <p className="text-xs text-charcoal/40">Pick dates above to add this room to a trip.</p>
                  ) : alreadyInCart ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-olive">
                        Added — {alreadyInCart.quantity > 1 ? `${alreadyInCart.quantity} rooms, ` : ''}
                        {alreadyInCart.guests} adult{alreadyInCart.guests === 1 ? '' : 's'}{alreadyInCart.quantity > 1 ? ' each' : ''}
                      </p>
                      <button onClick={() => handleRemove(p.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  ) : avail === undefined ? (
                    <p className="text-xs text-charcoal/40">Checking availability…</p>
                  ) : avail?.available ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-charcoal/60">
                        <label className="flex items-center gap-1.5">
                          Rooms
                          <Select
                            value={Math.min(quantityFor(p), avail.unitsLeft)}
                            onChange={(e) => setQuantityCounts({ ...quantityCounts, [p.id]: Number(e.target.value) })}
                            className="w-16 pl-2.5 py-2 text-sm"
                          >
                            {Array.from({ length: avail.unitsLeft }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </Select>
                        </label>
                        <label className="flex items-center gap-1.5">
                          Adults each
                          <Select
                            value={guestsFor(p)}
                            onChange={(e) => setGuestCounts({ ...guestCounts, [p.id]: Number(e.target.value) })}
                            className="w-16 pl-2.5 py-2 text-sm"
                          >
                            {Array.from({ length: p.maxGuests }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </Select>
                        </label>
                      </div>
                      <p className="text-xs text-charcoal/40">
                        Kids under 12 stay free and don't count toward the guest limit above.
                        {childcareEnabled && ' Want supervised play care instead? Add Kids Play Zone at checkout (max 2 per room).'}
                      </p>
                      <button
                        onClick={() => handleAdd(p)}
                        className="w-full text-sm px-4 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors"
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
            <p className="text-sm">
              Your trip: {cartRooms.reduce((sum, r) => sum + (r.quantity || 1), 0)} room{cartRooms.reduce((sum, r) => sum + (r.quantity || 1), 0) === 1 ? '' : 's'} selected
            </p>
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
