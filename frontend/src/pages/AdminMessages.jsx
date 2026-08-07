import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/contact')
      .then(({ data }) => setMessages(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading messages" />

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-serif text-4xl">Admin — Messages</h1>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-sm text-olive hover:underline">Bookings &rarr;</Link>
          <Link to="/admin/subscribers" className="text-sm text-olive hover:underline">Subscribers &rarr;</Link>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="text-charcoal/70">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="bg-white border border-stone rounded-xl2 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-serif text-lg">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="text-sm text-olive hover:underline">{m.email}</a>
                </div>
                <p className="text-xs text-charcoal/50 whitespace-nowrap">
                  {new Date(m.submittedAt).toLocaleString()}
                </p>
              </div>
              <p className="text-charcoal/80 whitespace-pre-wrap text-sm">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
