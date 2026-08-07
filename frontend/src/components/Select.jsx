// Native <select> elements don't reliably respect border-radius/border styling on iOS
// Safari (it paints its own box chrome unless appearance is reset), so every dropdown in
// the app goes through this wrapper for a consistent, on-brand rounded look everywhere.
export default function Select({ className = '', children, ...props }) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={`appearance-none bg-white border border-stone rounded-lg focus:outline-none focus:border-olive pr-8 ${className}`}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-charcoal/40"
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
