import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHotelConfig } from '../context/HotelConfigContext'
import apiClient from '../api/axiosClient'

export default function Home() {
  const { hotelName, tagline, heroImageUrl } = useHotelConfig()
  const [testimonials, setTestimonials] = useState([])
  const testimonialsTrackRef = useRef(null)

  useEffect(() => {
    apiClient.get('/testimonials/featured').then(({ data }) => setTestimonials(data)).catch(() => {})
  }, [])

  const scrollTestimonials = (direction) => {
    const track = testimonialsTrackRef.current
    if (!track) return
    const card = track.querySelector('[data-testimonial-card]')
    const amount = card ? card.offsetWidth + 24 : track.clientWidth * 0.85
    track.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  return (
    <div>
      <section className="px-4 md:px-8 pt-4 md:pt-6">
        <div className="relative w-full aspect-[3/2] max-h-[85vh] min-h-[480px] rounded-xl2 overflow-hidden flex items-end">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/15 via-charcoal/5 to-charcoal/65" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pb-8 md:pb-16 w-full text-warmwhite">
            <h1
              className="text-3xl sm:text-5xl md:text-7xl leading-[1.1] sm:leading-[1.05] text-balance mb-3 sm:mb-6 max-w-2xl"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.35)' }}
            >
              {tagline}
            </h1>
            <p className="max-w-xl text-warmwhite/90 mb-5 sm:mb-8 text-sm sm:text-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
              Thoughtfully designed mountain stays where every balcony becomes your favorite place to pause, reconnect, and create memories.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link to="/stay" className="px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-warmwhite text-charcoal font-medium hover:bg-stone transition-colors text-sm sm:text-base">
                Book Your Stay
              </Link>
              <Link to="/experiences" className="px-5 py-2.5 sm:px-7 sm:py-3 rounded-full border border-warmwhite/70 font-medium hover:bg-warmwhite/10 transition-colors text-sm sm:text-base">
                Explore the Experience
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-10 pt-24 pb-4">
        <h2 className="text-3xl md:text-4xl mb-3 text-balance text-center">Made for more than a holiday.</h2>
        <p className="text-charcoal/70 text-center max-w-2xl mx-auto mb-12">
          Two reasons guests keep extending their stay.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-stone rounded-xl2 p-8">
            <p className="text-sm uppercase tracking-[0.15em] text-olive mb-3">Work from the mountains</p>
            <h3 className="font-serif text-2xl mb-4">Your desk, just with better views.</h3>
            <p className="text-charcoal/70 mb-6">
              Every room is work-ready — take the call, hit the deadline, then close the laptop
              and step onto the balcony. No commute, no compromise.
            </p>
            <ul className="grid grid-cols-2 gap-y-2 text-sm text-charcoal/70">
              <li>&middot; Fast, reliable WiFi</li>
              <li>&middot; Dedicated desk &amp; lighting</li>
              <li>&middot; Quiet hours, all day</li>
              <li>&middot; Balcony-friendly calls</li>
            </ul>
          </div>
          <div className="bg-white border border-stone rounded-xl2 p-8">
            <p className="text-sm uppercase tracking-[0.15em] text-olive mb-3">Kids Play Zone</p>
            <h3 className="font-serif text-2xl mb-4">A break for parents, too.</h3>
            <p className="text-charcoal/70 mb-6">
              Add supervised on-site play care for 1 or 2 children when you book — one flat fee
              covers your whole trip, so you can actually relax.
            </p>
            <p className="text-sm text-charcoal/60">Choose it as an add-on at checkout, for any room or trip length.</p>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-10 pt-24 pb-4">
          <h2 className="text-3xl md:text-4xl mb-3 text-balance text-center">What Our Guests Say</h2>
          <p className="text-charcoal/70 text-center max-w-2xl mx-auto mb-12">
            Stories from the balcony, in guests' own words.
          </p>
          {/* Horizontal scroll-snap track rather than a grid that wraps into more rows as
              reviews pile up - this keeps the section's height fixed regardless of how many
              testimonials exist, so it doesn't keep pushing the rest of the page down. */}
          <div className="relative">
            {testimonials.length > 1 && (
              <button
                onClick={() => scrollTestimonials(-1)}
                aria-label="Previous testimonial"
                className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-stone hover:border-olive text-charcoal/60 hover:text-olive transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M13 4l-6 6 6 6" />
                </svg>
              </button>
            )}
            <div
              ref={testimonialsTrackRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2"
            >
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  data-testimonial-card
                  className="bg-white border border-stone rounded-xl2 p-8 flex flex-col shrink-0 snap-center w-[85%] sm:w-[380px]"
                >
                  <p className="text-olive text-sm mb-3">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</p>
                  <p className="text-charcoal/80 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <p className="text-sm font-medium text-charcoal">{t.guestName}</p>
                  {t.roomStayed && <p className="text-xs text-charcoal/50">{t.roomStayed}</p>}
                </div>
              ))}
            </div>
            {testimonials.length > 1 && (
              <button
                onClick={() => scrollTestimonials(1)}
                aria-label="Next testimonial"
                className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-stone hover:border-olive text-charcoal/60 hover:text-olive transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M7 4l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </section>
      )}

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl mb-6 text-balance">Life moves fast. Mountain mornings shouldn't.</h2>
        <p className="text-charcoal/70 leading-relaxed">
          Slow mornings. Balcony coffee. Working with mountain views. Bonfire evenings.
          Meaningful conversations. Nature. Rest. We built {hotelName} around the
          idea that a holiday should feel like an exhale, not another item on the list.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 text-center">
        <h2 className="text-3xl mb-3 text-balance">Ready to stay a little longer?</h2>
        <Link to="/stay" className="inline-block mt-4 px-8 py-3 rounded-full bg-olive text-warmwhite font-medium hover:bg-charcoal transition-colors">
          Book Your Escape
        </Link>
      </section>
    </div>
  )
}
