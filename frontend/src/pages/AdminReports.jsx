import { useState } from 'react'
import { todayIso } from '../lib/dates'

const firstOfMonthIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
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
              className="mt-1 w-full min-w-0 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
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
              className="mt-1 w-full min-w-0 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            />
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
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
    </div>
  )
}
