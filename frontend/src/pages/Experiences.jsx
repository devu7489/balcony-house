import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function Experiences() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/experiences').then(({ data }) => setItems(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Setting the scene" />

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <h1 className="font-serif text-4xl mb-12">Experiences</h1>
      {items.length === 0 ? (
        <p className="text-charcoal/70">No experiences listed yet — check back soon.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((e) => (
            <div key={e.id} className="rounded-xl2 overflow-hidden bg-white border border-stone">
              <div className="h-48 bg-cover bg-center bg-stone" style={{ backgroundImage: e.imageUrl ? `url(${e.imageUrl})` : undefined }} />
              <div className="p-6">
                <h2 className="font-serif text-lg mb-2">{e.title}</h2>
                <p className="text-charcoal/70 text-sm">{e.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-charcoal/70 mb-4">These come with every stay — pick your dates to get started.</p>
        <Link to="/stay" className="inline-block px-8 py-3 rounded-full bg-olive text-warmwhite font-medium hover:bg-charcoal transition-colors">
          Book Your Stay
        </Link>
      </div>
    </div>
  )
}
