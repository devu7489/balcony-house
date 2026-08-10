import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function Cafe() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/cafe').then(({ data }) => setItems(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Brewing" />

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <h1 className="font-serif text-4xl mb-4">In-Room Dining</h1>
      <p className="text-charcoal/70 max-w-xl mb-12">
        A short menu, available all day - order any of these straight to your room. Lunch and
        dinner are already taken care of by the Full Board buffet, so this is just the everyday
        basics: coffee, chai, and something simple whenever you want it.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((c) => (
          <div key={c.id} className="flex gap-4 items-center bg-white border border-stone rounded-xl2 p-4">
            <div className="w-24 h-24 rounded-lg bg-stone bg-cover bg-center shrink-0" style={{ backgroundImage: c.imageUrl ? `url(${c.imageUrl})` : undefined }} />
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="font-serif text-lg">{c.name}</h2>
                {c.price != null && <span className="text-sm text-charcoal/60">₹{c.price}</span>}
              </div>
              <p className="text-charcoal/70 text-sm">{c.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
