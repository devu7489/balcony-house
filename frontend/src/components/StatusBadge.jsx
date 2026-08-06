const STYLES = {
  CONFIRMED: 'bg-olive/15 text-olive',
  CHECKED_IN: 'bg-wood/15 text-wood',
  CHECKED_OUT: 'bg-charcoal/10 text-charcoal/60',
  CANCELLED: 'bg-stone text-charcoal/50',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap ${STYLES[status] || STYLES.CONFIRMED}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}
