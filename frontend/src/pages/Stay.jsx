import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function Stay() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/properties')
      .then(({ data }) => setProperties(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Gathering rooms" />

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <h1 className="font-serif text-4xl mb-12">Stay</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((p) => (
          <Link
            to={`/stay/${p.id}`}
            key={p.id}
            className="rounded-xl2 overflow-hidden bg-white border border-stone hover:shadow-lg transition-shadow block"
          >
            <div
              className="h-56 bg-cover bg-center bg-stone"
              style={{ backgroundImage: p.heroImageUrl ? `url(${p.heroImageUrl})` : undefined }}
            />
            <div className="p-6">
              <h2 className="font-serif text-xl mb-2">{p.name}</h2>
              <p className="text-charcoal/70 text-sm mb-4">{p.description}</p>
              <ul className="flex flex-wrap gap-2 text-xs text-charcoal/60 mb-4">
                {p.privateBalcony && <li className="px-3 py-1 bg-stone rounded-full">Private balcony</li>}
                {p.workspaceAvailable && <li className="px-3 py-1 bg-stone rounded-full">Workspace</li>}
                <li className="px-3 py-1 bg-stone rounded-full">Up to {p.maxGuests} guests</li>
              </ul>
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg">₹{p.pricePerNight?.toLocaleString?.() ?? p.pricePerNight} / night</p>
                <span className="text-sm text-olive">View &amp; book &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
