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
      <h1 className="font-serif text-4xl mb-12">Journal</h1>
      <div className="space-y-10">
        {posts.map((p) => (
          <Link to={`/journal/${p.slug}`} key={p.id} className="block group">
            <h2 className="font-serif text-2xl group-hover:text-olive transition-colors">{p.title}</h2>
            <p className="text-charcoal/70 mt-2">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
