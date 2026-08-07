import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Bookings', end: true },
  { to: '/admin/today', label: 'Today' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/subscribers', label: 'Subscribers' },
]

export default function AdminLayout() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-20 pb-20">
      <nav className="flex gap-6 border-b border-stone mb-10 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                isActive ? 'border-olive text-olive font-medium' : 'border-transparent text-charcoal/60 hover:text-charcoal'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
