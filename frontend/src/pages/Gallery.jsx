import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function Gallery() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/gallery').then(({ data }) => setImages(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading gallery" />

  return (
    <div className="py-20">
      <h1 className="font-serif text-4xl mb-12 max-w-7xl mx-auto px-6 lg:px-10">Gallery</h1>
      <div className="grid grid-cols-2 md:grid-cols-3">
        {images.map((img) => (
          <div key={img.id} className="aspect-square bg-stone bg-cover bg-center" style={{ backgroundImage: img.imageUrl ? `url(${img.imageUrl})` : undefined }} title={img.caption} />
        ))}
      </div>
    </div>
  )
}
