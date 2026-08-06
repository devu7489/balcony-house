import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <section
        className="relative h-[92vh] flex items-end bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(180deg, rgba(43,43,41,0.15), rgba(43,43,41,0.55)), url(/images/hero/balcony-sunrise.jpg)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-20 w-full text-warmwhite">
          <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-6 max-w-2xl">
            Stay a little longer.
          </h1>
          <p className="max-w-xl text-warmwhite/85 mb-8 text-lg">
            Thoughtfully designed mountain stays where every balcony becomes your favorite place to pause, reconnect, and create memories.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/stay" className="px-7 py-3 rounded-full bg-warmwhite text-charcoal hover:bg-stone transition-colors">
              Book Your Stay
            </Link>
            <Link to="/experiences" className="px-7 py-3 rounded-full border border-warmwhite/70 hover:bg-warmwhite/10 transition-colors">
              Explore the Experience
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="font-serif text-3xl md:text-4xl mb-6">Life moves fast. Mountain mornings shouldn't.</h2>
        <p className="text-charcoal/70 leading-relaxed">
          Slow mornings. Balcony coffee. Working with mountain views. Bonfire evenings.
          Meaningful conversations. Nature. Rest. We built The Balcony House around the
          idea that a holiday should feel like an exhale, not another item on the list.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 text-center">
        <h2 className="font-serif text-3xl mb-3">Ready to stay a little longer?</h2>
        <Link to="/stay" className="inline-block mt-4 px-8 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors">
          Book Your Escape
        </Link>
      </section>
    </div>
  )
}
