// Native <select> elements don't reliably respect border-radius/border styling on iOS
// Safari (it paints its own box chrome unless appearance is reset), so every dropdown in
// the app goes through this wrapper for a consistent, on-brand rounded look everywhere.
//
// The <select> and the chevron icon are stacked in the same CSS Grid cell (rather than a
// relatively-positioned wrapper with an absolutely-positioned icon) so the chevron always
// tracks the select's own actual box - whatever width class a caller passes (or none at
// all) - instead of the two independently computing different widths and drifting apart.
export default function Select({ className = '', children, ...props }) {
  return (
    <div className="grid">
      <select
        {...props}
        className={`col-start-1 row-start-1 appearance-none bg-white border border-stone rounded-lg focus:outline-none focus:border-olive pr-8 ${className}`}
      >
        {children}
      </select>
      <svg
        className="col-start-1 row-start-1 pointer-events-none self-center justify-self-end mr-2.5 w-3 h-3 text-charcoal/40"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8l4 4 4-4" />
      </svg>
    </div>
  )
}
