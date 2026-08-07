const STYLES = {
  PAID: 'bg-olive/15 text-olive',
  PENDING: 'bg-amber-100 text-amber-700',
}

const LABELS = {
  PAID: 'Paid',
  PENDING: 'Payment pending',
}

export default function PaymentBadge({ status }) {
  const key = status === 'PAID' ? 'PAID' : 'PENDING'
  return (
    <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap ${STYLES[key]}`}>
      {LABELS[key]}
    </span>
  )
}
