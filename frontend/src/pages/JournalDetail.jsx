import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function JournalDetail() {
  const { slug } = useParams()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    apiClient.get(`/journal/${slug}`)
      .then(({ data }) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <LoadingScreen label="Turning pages" />
  if (notFound || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">This story doesn't exist.</h1>
        <Link to="/journal" className="text-olive hover:underline">Back to Journal</Link>
      </div>
    )
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' })
    : null

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <Link to="/journal" className="text-sm text-olive hover:underline">&larr; Back to Journal</Link>

      {post.coverImageUrl && (
        <div
          className="h-64 md:h-96 rounded-xl2 bg-cover bg-center bg-stone mt-6"
          style={{ backgroundImage: `url(${post.coverImageUrl})` }}
        />
      )}

      <div className="mt-8">
        {publishedDate && (
          <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">{publishedDate}</p>
        )}
        <h1 className="font-serif text-3xl md:text-4xl mb-6 text-balance">{post.title}</h1>
        <div className="space-y-5 text-charcoal/80 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </div>
    </div>
  )
}
