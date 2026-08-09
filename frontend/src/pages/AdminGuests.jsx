import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

export default function AdminGuests() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiClient.get('/admin/guests').then(({ data }) => setGuests(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading guests" />

  const query = search.trim().toLowerCase()
  const filtered = query
    ? guests.filter((g) => [g.name, g.email, g.phone].filter(Boolean).some((v) => v.toLowerCase().includes(query)))
    : guests

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-1">Guests</h1>
      <p className="text-charcoal/50 text-sm mb-8">
        {guests.length} guest{guests.length === 1 ? '' : 's'} — built from booking history, sorted by most recent stay.
      </p>

      <input
        type="search"
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive bg-white mb-6"
      />

      {filtered.length === 0 ? (
        <p className="text-charcoal/70">{guests.length === 0 ? 'No guests yet.' : 'No guests match your search.'}</p>
      ) : (
        <div className="bg-white border border-stone rounded-xl2 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-charcoal/50">
                <th className="px-5 py-3 border-b border-stone font-normal">Guest</th>
                <th className="px-5 py-3 border-b border-stone font-normal">Stays</th>
                <th className="px-5 py-3 border-b border-stone font-normal">Total spend</th>
                <th className="px-5 py-3 border-b border-stone font-normal">Last stay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {filtered.map((g) => (
                <tr key={g.email}>
                  <td className="px-5 py-3">
                    <p className="text-charcoal/90">{g.name || '—'}</p>
                    <p className="text-xs text-charcoal/50">{[g.email, g.phone].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-5 py-3 text-charcoal/80">{g.stayCount}</td>
                  <td className="px-5 py-3 text-charcoal/80">₹{Number(g.totalSpend || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-charcoal/60">{g.lastCheckOut || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
