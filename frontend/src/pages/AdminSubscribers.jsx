import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/newsletter')
      .then(({ data }) => setSubscribers(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading subscribers" />

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-4">Journal Subscribers</h1>
      <p className="text-charcoal/60 text-sm mb-12">
        {subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'} — captured from the footer sign-up. Nothing is emailed automatically.
      </p>

      {subscribers.length === 0 ? (
        <p className="text-charcoal/70">No subscribers yet.</p>
      ) : (
        <div className="bg-white border border-stone rounded-xl2 divide-y divide-stone">
          {subscribers.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4">
              <span className="text-charcoal/80">{s.email}</span>
              <span className="text-xs text-charcoal/50">{new Date(s.subscribedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
