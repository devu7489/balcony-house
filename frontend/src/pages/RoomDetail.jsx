import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function RoomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    apiClient.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingScreen label="Loading room" />
  if (notFound || !property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">This room doesn't exist.</h1>
        <Link to="/stay" className="text-olive hover:underline">Back to Stay</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/stay" className="text-sm text-olive hover:underline">&larr; Back to Stay</Link>

      <div
        className="h-72 md:h-96 rounded-xl2 bg-cover bg-center bg-stone mt-6"
        style={{ backgroundImage: property.heroImageUrl ? `url(${property.heroImageUrl})` : undefined }}
      />
      <h1 className="font-serif text-3xl mt-6 mb-2">{property.name}</h1>
      <p className="text-charcoal/70 mb-4">{property.description}</p>

      <ul className="flex flex-wrap gap-2 text-xs text-charcoal/60 mb-4">
        {property.privateBalcony && <li className="px-3 py-1 bg-stone rounded-full">Private balcony</li>}
        {property.workspaceAvailable && <li className="px-3 py-1 bg-stone rounded-full">Workspace</li>}
        <li className="px-3 py-1 bg-stone rounded-full">Up to {property.maxGuests} guests</li>
      </ul>

      {property.highlights?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-lg mb-2">What's included</h2>
          <ul className="list-disc list-inside text-charcoal/70 space-y-1">
            {property.highlights.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
      )}

      <div className="mb-8">
        <p className="font-serif text-xl mb-2">
          From ₹{property.pricePerNight?.toLocaleString?.() ?? property.pricePerNight} / night
        </p>
        <p className="text-charcoal/60 text-sm">
          Stays over 5 nights cost less per night, and rates rise during peak season
          (April–June). Pick your dates on the next step to see your exact price.
          Breakfast included every morning.
        </p>
      </div>

      <button
        onClick={() => navigate('/stay')}
        className="px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors"
      >
        Add to a trip &rarr;
      </button>
    </div>
  )
}
