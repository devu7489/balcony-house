import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

function StatCard({ label, value, sub, tone = 'default' }) {
  const toneClasses = {
    default: 'text-charcoal',
    warn: 'text-[#B5642B]',
    good: 'text-olive',
  }
  return (
    <div className="bg-white border border-stone rounded-xl2 p-5">
      <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">{label}</p>
      <p className={`font-serif text-3xl ${toneClasses[tone]}`}>{value}</p>
      {sub && <p className="text-xs text-charcoal/50 mt-1">{sub}</p>}
    </div>
  )
}

const money = (n) => `₹${Number(n || 0).toLocaleString()}`

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/dashboard').then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading dashboard" />
  if (!data) return <p className="text-charcoal/70">Couldn't load the dashboard.</p>

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-1">Dashboard</h1>
      <p className="text-charcoal/50 text-sm mb-10">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Occupancy today"
          value={`${data.occupancyPercent}%`}
          sub={`${data.occupiedUnitsToday} of ${data.totalUnits} rooms`}
        />
        <StatCard label="Revenue this month" value={money(data.revenueThisMonth)} tone="good" />
        <StatCard
          label="Outstanding balance"
          value={money(data.outstandingBalance)}
          sub={`${data.pendingPaymentsCount} unpaid booking${data.pendingPaymentsCount === 1 ? '' : 's'}`}
          tone={Number(data.outstandingBalance) > 0 ? 'warn' : 'default'}
        />
        <StatCard label="Arrivals, next 7 days" value={data.arrivalsNext7Days} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-white border border-stone rounded-xl2 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Arriving today</p>
            <p className="font-serif text-2xl">{data.arrivalsToday}</p>
          </div>
          <Link to="/admin/today" className="text-sm text-olive hover:underline">View &rarr;</Link>
        </div>
        <div className="bg-white border border-stone rounded-xl2 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Departing today</p>
            <p className="font-serif text-2xl">{data.departuresToday}</p>
          </div>
          <Link to="/admin/today" className="text-sm text-olive hover:underline">View &rarr;</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/bookings" className="px-5 py-2.5 rounded-full border border-stone hover:border-olive hover:text-olive transition-colors text-sm">
          All bookings
        </Link>
        <Link to="/admin/calendar" className="px-5 py-2.5 rounded-full border border-stone hover:border-olive hover:text-olive transition-colors text-sm">
          Availability calendar
        </Link>
        <Link to="/admin/rooms" className="px-5 py-2.5 rounded-full border border-stone hover:border-olive hover:text-olive transition-colors text-sm">
          Manage rooms
        </Link>
        <Link to="/admin/guests" className="px-5 py-2.5 rounded-full border border-stone hover:border-olive hover:text-olive transition-colors text-sm">
          Guest directory
        </Link>
      </div>
    </div>
  )
}
