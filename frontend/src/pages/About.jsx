const highlights = [
  'Cozy, thoughtfully designed spaces inspired by mountain living.',
  "Panoramic balcony views you'll never tire of.",
  'Peaceful surroundings away from the crowds.',
  'Warm, genuine hospitality that feels like home.',
  'Work-ready rooms — fast WiFi and a proper desk, so remote work fits right in.',
  'A supervised Kids Play Zone add-on, so parents get a break too.',
  'Moments worth remembering—from slow mornings to unforgettable sunsets.',
]

export default function About() {
  return (
    <div>
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-olive mb-4">About The Balcony House</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6 text-balance">Stay a little longer.</h1>
        <p className="text-charcoal/80 text-lg leading-relaxed font-serif italic">
          Some places are meant to be visited. Others are meant to be felt.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20 space-y-6 text-charcoal/80 leading-relaxed">
        <p>
          The Balcony House was born from a simple idea: to create a place where time slows down,
          mornings begin with mountain views, and every balcony invites you to pause a little longer.
        </p>
        <p>
          Perched amidst the breathtaking Himalayan landscape, our home is designed for travelers who
          seek more than just a room. Whether you're escaping the city, working remotely, celebrating
          with loved ones, or simply searching for a quiet corner to reconnect with yourself, you'll
          find comfort here.
        </p>
        <p>
          Wake up to crisp mountain air, watch the clouds drift across snow-capped peaks, sip your
          morning coffee as the valley comes alive, and end your day under a sky full of stars. Every
          window frames a view, every balcony tells a story, and every stay is crafted to feel personal.
        </p>
      </section>

      <section className="bg-stone/40 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl mb-4 text-balance">More than a stay</h2>
            <p className="text-charcoal/70 max-w-xl mx-auto">
              We believe hospitality isn't measured by luxury alone—it's measured by how a place makes
              you feel. At The Balcony House, you'll discover:
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-5 max-w-2xl mx-auto">
            {highlights.map((item) => (
              <li key={item} className="flex gap-3 items-start">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-olive shrink-0" />
                <span className="text-charcoal/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-3xl mb-6 text-balance">Our philosophy</h2>
        <p className="text-charcoal/80 leading-relaxed mb-4">
          In a world that moves faster every day, we wanted to create a space that encourages you to
          slow down.
        </p>
        <p className="font-serif italic text-lg text-charcoal/80 mb-4">
          Read another chapter. Watch one more sunset. Share one more conversation. Stay for one more
          cup of tea.
        </p>
        <p className="text-charcoal/70">Because the best memories are rarely made in a hurry.</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="font-serif text-3xl mb-6 text-balance">Welcome home.</h2>
        <p className="text-charcoal/80 leading-relaxed mb-2">
          Whether you're here for a weekend escape or a longer mountain retreat, we hope you leave
          feeling lighter, calmer, and already planning your next visit.
        </p>
        <p className="text-charcoal/60 mb-8">Until then…</p>
        <p className="font-serif text-2xl">Stay a little longer.</p>
      </section>
    </div>
  )
}
