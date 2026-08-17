import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

const AUTOPLAY_MS = 5000

function ChevronIcon({ direction = 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${direction === 'left' ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export default function Gallery() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    apiClient.get('/gallery').then(({ data }) => setImages(data)).finally(() => setLoading(false))
  }, [])

  const goTo = useCallback((index, count) => {
    setCurrent(((index % count) + count) % count)
  }, [])

  useEffect(() => {
    if (paused || images.length < 2) return undefined
    timerRef.current = setInterval(() => {
      setCurrent((i) => (i + 1) % images.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(timerRef.current)
  }, [paused, images.length])

  if (loading) return <LoadingScreen label="Loading gallery" />
  if (images.length === 0) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-6 lg:px-10">
        <h1 className="font-serif text-4xl mb-6">Gallery</h1>
        <p className="text-charcoal/70">No photos yet — check back soon.</p>
      </div>
    )
  }

  return (
    <div className="py-20">
      <h1 className="font-serif text-4xl mb-12 max-w-7xl mx-auto px-6 lg:px-10">Gallery</h1>

      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div
          className="relative w-full h-[50vh] md:h-[65vh] min-h-[320px] overflow-hidden rounded-xl2 bg-stone shadow-lg"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-hidden={index !== current}
            >
              <div
                className={`h-full w-full bg-cover bg-center ${index === current ? 'animate-kenburns' : ''}`}
                style={{ backgroundImage: img.imageUrl ? `url(${img.imageUrl})` : undefined }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/0 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-xl md:text-2xl text-warmwhite">{img.caption}</p>
                  {img.category && (
                    <span className="inline-block mt-2 text-xs uppercase tracking-wide text-warmwhite/80 bg-charcoal/40 rounded-full px-3 py-1">
                      {img.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => goTo(current - 1, images.length)}
                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-charcoal/40 text-warmwhite backdrop-blur flex items-center justify-center hover:bg-charcoal/60 transition-colors"
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => goTo(current + 1, images.length)}
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-charcoal/40 text-warmwhite backdrop-blur flex items-center justify-center hover:bg-charcoal/60 transition-colors"
              >
                <ChevronIcon direction="right" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    aria-label={`Go to photo ${index + 1}`}
                    onClick={() => goTo(index, images.length)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === current ? 'w-6 bg-warmwhite' : 'w-1.5 bg-warmwhite/50 hover:bg-warmwhite/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(index, images.length)}
                aria-label={`Show ${img.caption}`}
                className={`shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-lg bg-cover bg-center transition-all ${
                  index === current ? 'ring-2 ring-offset-2 ring-olive opacity-100' : 'opacity-60 hover:opacity-90'
                }`}
                style={{ backgroundImage: img.imageUrl ? `url(${img.imageUrl})` : undefined }}
              />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-charcoal/70 mb-4">Ready to see it in person?</p>
          <Link to="/stay" className="inline-block px-8 py-3 rounded-full bg-olive text-warmwhite font-medium hover:bg-charcoal transition-colors">
            Book Your Stay
          </Link>
        </div>
      </div>
    </div>
  )
}
