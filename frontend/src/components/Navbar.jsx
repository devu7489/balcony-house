import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/stay', label: 'Stay' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/cafe', label: 'Café' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/journal', label: 'Journal' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

function AccountMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm px-4 py-2 rounded-full border border-charcoal/20 hover:bg-charcoal hover:text-warmwhite transition-colors"
      >
        Hi, {user.name?.split(' ')[0]}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-stone rounded-xl2 shadow-lg overflow-hidden text-sm">
          <NavLink
            to="/my-bookings"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 hover:bg-stone/60 text-charcoal/80"
          >
            My Bookings
          </NavLink>
          {user.isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 hover:bg-stone/60 text-charcoal/80 border-t border-stone"
            >
              Admin — Bookings
            </NavLink>
          )}
          {user.isAdmin && (
            <NavLink
              to="/admin/messages"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 hover:bg-stone/60 text-charcoal/80"
            >
              Admin — Messages
            </NavLink>
          )}
          {user.isAdmin && (
            <NavLink
              to="/admin/subscribers"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 hover:bg-stone/60 text-charcoal/80"
            >
              Admin — Subscribers
            </NavLink>
          )}
          <button
            onClick={() => { setOpen(false); logout() }}
            className="block w-full text-left px-4 py-3 hover:bg-stone/60 text-charcoal/80 border-t border-stone"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, login, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-warmwhite/80 backdrop-blur-md border-b border-stone">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <NavLink to="/" className="font-serif text-xl tracking-tight">
          The Balcony House
        </NavLink>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `transition-colors hover:text-olive ${isActive ? 'text-olive' : 'text-charcoal/80'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <AccountMenu user={user} logout={logout} />
          ) : (
            <button onClick={login} className="text-sm px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors">
              Sign in
            </button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <span className="block w-6 h-0.5 bg-charcoal mb-1.5" />
          <span className="block w-6 h-0.5 bg-charcoal mb-1.5" />
          <span className="block w-6 h-0.5 bg-charcoal" />
        </button>
      </div>

      {open && (
        <nav className="md:hidden px-6 pb-6 flex flex-col gap-4 bg-warmwhite">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-charcoal/80">
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2">
            {user ? (
              <>
                <NavLink to="/my-bookings" onClick={() => setOpen(false)} className="block text-charcoal/80 mb-3">
                  My Bookings
                </NavLink>
                {user.isAdmin && (
                  <NavLink to="/admin" onClick={() => setOpen(false)} className="block text-charcoal/80 mb-3">
                    Admin — Bookings
                  </NavLink>
                )}
                {user.isAdmin && (
                  <NavLink to="/admin/messages" onClick={() => setOpen(false)} className="block text-charcoal/80 mb-3">
                    Admin — Messages
                  </NavLink>
                )}
                {user.isAdmin && (
                  <NavLink to="/admin/subscribers" onClick={() => setOpen(false)} className="block text-charcoal/80 mb-3">
                    Admin — Subscribers
                  </NavLink>
                )}
                <button onClick={logout} className="text-sm">Log out</button>
              </>
            ) : (
              <button onClick={login} className="text-sm px-5 py-2 rounded-full bg-olive text-warmwhite">Sign in</button>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
