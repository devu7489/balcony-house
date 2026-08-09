import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/today', label: 'Today' },
  { to: '/admin/calendar', label: 'Calendar' },
  { to: '/admin/rooms', label: 'Rooms' },
  { to: '/admin/guests', label: 'Guests' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/subscribers', label: 'Subscribers' },
]

const tabClass = ({ isActive }) =>
  `pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
    isActive ? 'border-olive text-olive font-medium' : 'border-transparent text-charcoal/60 hover:text-charcoal'
  }`

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const current = tabs.find((t) => location.pathname === t.to) ?? tabs[0]

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-20 pb-20">
      {/* Nine sections never fit a mobile screen's width, and a scrolling row of them just
          reads as cut off (see Navbar.jsx's own hamburger for the same problem solved the
          same way) - below lg this becomes a single "current section" toggle that expands
          into a plain vertical list, same pattern the main site nav already uses. */}
      <nav className="hidden lg:flex gap-6 border-b border-stone mb-10">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={tabClass}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="lg:hidden mb-10 border-b border-stone">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between py-3 text-sm font-medium text-charcoal"
          aria-expanded={open}
        >
          <span>{current.label}</span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <nav className="flex flex-col pb-3">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2.5 text-sm ${isActive ? 'text-olive font-medium' : 'text-charcoal/70'}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      <Outlet />
    </div>
  )
}
