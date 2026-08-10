import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

const STARS = [1, 2, 3, 4, 5]

export default function LeaveReview() {
  const { bookingId } = useParams()
  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [rating, setRating] = useState(5)
  const [quote, setQuote] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  useEffect(() => {
    apiClient.get(`/testimonials/booking/${bookingId}`)
      .then(({ data }) => setExisting(data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setLoadError(err.response?.data?.message || "Could not load this page.")
        }
      })
      .finally(() => setLoading(false))
  }, [bookingId])

  const submit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      const { data } = await apiClient.post(`/testimonials/booking/${bookingId}`, { quote, rating })
      setSubmitted(data)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.message || 'Something went wrong, please try again.')
    }
  }

  if (loading) return <LoadingScreen label="Loading" />

  const review = submitted || existing

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl sm:text-4xl mb-2">Leave a review</h1>
      <p className="text-charcoal/60 text-sm mb-10">
        Thanks for staying with us — we'd love to hear how it went.
      </p>

      {loadError && (
        <p className="text-red-600 text-sm mb-6">{loadError}</p>
      )}

      {!loadError && review ? (
        <div className="bg-white border border-stone rounded-xl2 p-6">
          <p className="text-olive text-lg mb-3">
            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
          </p>
          <p className="text-charcoal/80 whitespace-pre-wrap mb-4">"{review.quote}"</p>
          <p className="text-sm text-charcoal/50">
            {submitted
              ? "Thank you — your review is pending review before it appears on the site."
              : "You've already submitted a review for this stay."}
          </p>
          <Link to="/my-bookings" className="inline-block mt-6 text-sm text-olive hover:underline">
            &larr; Back to My Bookings
          </Link>
        </div>
      ) : !loadError && (
        <form onSubmit={submit} className="bg-white border border-stone rounded-xl2 p-6 space-y-5">
          <div>
            <p className="text-sm text-charcoal/70 mb-2">Rating</p>
            <div className="flex items-center gap-1">
              {STARS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  className="text-3xl leading-none text-olive"
                >
                  {n <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm text-charcoal/70">
            Your review
            <textarea
              required
              rows={5}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              maxLength={1000}
              placeholder="Tell future guests what stood out about your stay…"
              className="mt-1 w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>

          <button
            type="submit"
            disabled={status === 'submitting' || !quote.trim()}
            className="px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit review'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      )}
    </div>
  )
}
