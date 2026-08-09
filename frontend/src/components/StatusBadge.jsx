// Deliberately standard semantic hues (not the brand's earthy palette) - blue/green/gray/red
// read as distinct at a glance, which two brand tones at low opacity (olive vs wood) did not.
const STYLES = {
  CONFIRMED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700',
  CHECKED_OUT: 'bg-charcoal/10 text-charcoal/60',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap ${STYLES[status] || STYLES.CONFIRMED}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}
