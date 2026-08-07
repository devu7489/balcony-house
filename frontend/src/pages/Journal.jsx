import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function Journal() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/journal').then(({ data }) => setPosts(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Turning pages" />

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="font-serif text-4xl mb-2">Journal</h1>
      <p className="text-charcoal/60 mb-12">Notes from the mountains — on slow living, and the small things we build for.</p>

      {posts.length === 0 ? (
        <p className="text-charcoal/70">No stories yet — check back soon.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((p) => (
            <Link
              to={`/journal/${p.slug}`}
              key={p.id}
              className="flex flex-col sm:flex-row gap-5 group bg-white border border-stone rounded-xl2 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="h-48 sm:h-auto sm:w-56 shrink-0 bg-cover bg-center bg-stone"
                style={{ backgroundImage: p.coverImageUrl ? `url(${p.coverImageUrl})` : undefined }}
              />
              <div className="p-5 sm:py-6 sm:pr-6 sm:pl-0 min-w-0">
                {p.publishedAt && (
                  <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                    {new Date(p.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                )}
                <h2 className="font-serif text-2xl group-hover:text-olive transition-colors text-balance">{p.title}</h2>
                <p className="text-charcoal/70 mt-2">{p.excerpt}</p>
                <span className="inline-block mt-3 text-sm text-olive">Read more &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
