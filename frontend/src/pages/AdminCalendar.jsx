import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import Select from '../components/Select'

function cellClasses(booked, total) {
  if (booked <= 0) return 'bg-white text-charcoal/30'
  if (booked >= total) return 'bg-[#F6DCC9] text-[#8A3E14] font-medium'
  return 'bg-[#F3E8D2] text-[#6B5220]'
}

export default function AdminCalendar() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiClient.get('/admin/calendar', { params: { days } })
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [days])

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-serif text-3xl sm:text-4xl">Calendar</h1>
        <Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-32 px-3 py-2 text-sm">
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </Select>
      </div>
      <p className="text-charcoal/50 text-sm mb-8">Units booked per room category, per day. Includes maintenance blocks.</p>

      {loading || !data ? (
        <LoadingScreen label="Loading calendar" />
      ) : (
        <div className="bg-white border border-stone rounded-xl2 overflow-x-auto">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 text-left px-4 py-3 border-b border-r border-stone whitespace-nowrap">Room</th>
                {data.dates.map((d) => {
                  const date = new Date(d)
                  const isToday = d === data.dates[0]
                  return (
                    <th
                      key={d}
                      className={`px-2 py-3 border-b border-stone text-center font-normal text-xs whitespace-nowrap ${isToday ? 'text-olive font-medium' : 'text-charcoal/50'}`}
                    >
                      {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((room) => (
                <tr key={room.propertyId}>
                  <td className="sticky left-0 bg-white z-10 px-4 py-2 border-r border-b border-stone whitespace-nowrap">
                    <p className="text-charcoal/80">{room.propertyName}</p>
                    <p className="text-xs text-charcoal/40">{room.totalUnits} units</p>
                  </td>
                  {room.unitsBookedByDay.map((booked, i) => (
                    <td key={i} className={`px-2 py-2 border-b border-stone text-center ${cellClasses(booked, room.totalUnits)}`}>
                      {booked}/{room.totalUnits}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-5 mt-4 text-xs text-charcoal/50">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white border border-stone inline-block" /> Free</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#F3E8D2] inline-block" /> Partially booked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#F6DCC9] inline-block" /> Fully booked</span>
      </div>
    </div>
  )
}
