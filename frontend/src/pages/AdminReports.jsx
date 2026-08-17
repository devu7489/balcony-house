import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import { todayIso } from '../lib/dates'

const firstOfMonthIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const money = (n) => `${Number(n) < 0 ? '−' : ''}₹${Math.abs(Number(n || 0)).toLocaleString()}`

// Cash first (the figure admins care about most day-to-day), then Online, then whatever else
// has actually been used as a method, alphabetically - rather than a hardcoded list, since
// Payment.method is free text and new values can show up without a code change.
const sortMethods = (methods) => [...methods].sort((a, b) => {
  const rank = (m) => (m === 'Cash' ? 0 : m === 'Online' ? 1 : 2)
  const r = rank(a) - rank(b)
  return r !== 0 ? r : a.localeCompare(b)
})

function CollectionsTable({ from, to }) {
  const [days, setDays] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setDays(null)
    setError(false)
    apiClient.get('/admin/reports/collections', { params: { from, to } })
      .then(({ data }) => setDays(data))
      .catch(() => setError(true))
  }, [from, to])

  if (error) return <p className="text-sm text-red-600">Couldn't load the collections report.</p>
  if (!days) return <p className="text-sm text-charcoal/50">Loading&hellip;</p>

  const methods = sortMethods([...new Set(days.flatMap((d) => Object.keys(d.byMethod)))])
  const grandTotal = days.reduce((sum, d) => sum + Number(d.total), 0)
  const methodTotals = methods.map((m) => days.reduce((sum, d) => sum + Number(d.byMethod[m] || 0), 0))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-charcoal/50 border-b border-stone">
            <th className="py-2 pr-4">Date</th>
            {methods.map((m) => <th key={m} className="py-2 pr-4 text-right">{m}</th>)}
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date} className="border-b border-stone last:border-0">
              <td className="py-2 pr-4 text-charcoal/70">{d.date}</td>
              {methods.map((m) => (
                <td key={m} className="py-2 pr-4 text-right text-charcoal/70">
                  {d.byMethod[m] != null ? money(d.byMethod[m]) : '—'}
                </td>
              ))}
              <td className="py-2 text-right font-medium">{money(d.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-stone font-medium">
            <td className="py-2 pr-4">Total</td>
            {methodTotals.map((t, i) => <td key={methods[i]} className="py-2 pr-4 text-right">{money(t)}</td>)}
            <td className="py-2 text-right">{money(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ReportCard({ title, description, endpoint, from, to }) {
  const url = `/api/admin/reports/${endpoint}?from=${from}&to=${to}`
  return (
    <div className="bg-white border border-stone rounded-xl2 p-5">
      <h2 className="font-serif text-lg mb-1">{title}</h2>
      <p className="text-sm text-charcoal/60 mb-4">{description}</p>
      <a
        href={url}
        className="inline-block px-5 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors text-sm"
      >
        Download CSV
      </a>
    </div>
  )
}

export default function AdminReports() {
  const [from, setFrom] = useState(firstOfMonthIso())
  const [to, setTo] = useState(todayIso())

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-1">Reports</h1>
      <p className="text-charcoal/50 text-sm mb-8">
        Export CSVs for accounting, GST filing, or your own records.
      </p>

      <div className="bg-white border border-stone rounded-xl2 p-5 mb-6">
        {/* Same date-input classes as Stay.jsx's check-in/check-out fields, for one consistent
            look across the app - bg-white/appearance-none override the browser's native grey
            date-picker chrome, and min-w-0/box-border are what actually stop a native date
            input's intrinsic sizing from overflowing its grid cell on iOS Safari. */}
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm text-charcoal/70 min-w-0">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full min-w-0 h-11 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>
          <label className="text-sm text-charcoal/70 min-w-0">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={todayIso()}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full min-w-0 h-11 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <ReportCard
          title="Payments"
          description="Every payment and refund recorded in this range - date, guest, room, amount, method."
          endpoint="payments.csv"
          from={from}
          to={to}
        />
        <ReportCard
          title="Bookings"
          description="Every booking with a check-in date in this range - guest, room, dates, status, totals."
          endpoint="bookings.csv"
          from={from}
          to={to}
        />
      </div>

      <div className="bg-white border border-stone rounded-xl2 p-5">
        <h2 className="font-serif text-lg mb-1">Collections by day</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          What was collected each day in this range, broken down by payment method. Refunds net
          against the day and method they were paid against.
        </p>
        <CollectionsTable from={from} to={to} />
      </div>
    </div>
  )
}
