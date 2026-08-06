import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <section className="px-4 md:px-8 pt-4 md:pt-6">
        <div className="relative w-full aspect-[3/2] max-h-[85vh] min-h-[420px] rounded-xl2 overflow-hidden flex items-end">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/hero/balcony-sunrise.png)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/15 via-charcoal/5 to-charcoal/65" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pb-12 md:pb-16 w-full text-warmwhite">
            <h1
              className="text-5xl md:text-7xl leading-[1.05] text-balance mb-6 max-w-2xl"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.35)' }}
            >
              Stay a little longer.
            </h1>
            <p className="max-w-xl text-warmwhite/90 mb-8 text-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
              Thoughtfully designed mountain stays where every balcony becomes your favorite place to pause, reconnect, and create memories.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/stay" className="px-7 py-3 rounded-full bg-warmwhite text-charcoal font-medium hover:bg-stone transition-colors">
                Book Your Stay
              </Link>
              <Link to="/experiences" className="px-7 py-3 rounded-full border border-warmwhite/70 font-medium hover:bg-warmwhite/10 transition-colors">
                Explore the Experience
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl mb-6 text-balance">Life moves fast. Mountain mornings shouldn't.</h2>
        <p className="text-charcoal/70 leading-relaxed">
          Slow mornings. Balcony coffee. Working with mountain views. Bonfire evenings.
          Meaningful conversations. Nature. Rest. We built The Balcony House around the
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
