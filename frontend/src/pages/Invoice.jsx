import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import PaymentBadge from '../components/PaymentBadge'

const money = (n) => `₹${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Invoice({ admin = false }) {
  const { id, groupId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backLink = admin
    ? (groupId ? `/admin/trips/${groupId}` : `/admin/bookings/${id}`)
    : '/my-bookings'

  useEffect(() => {
    const base = admin ? '/admin/bookings' : '/bookings'
    const url = groupId ? `${base}/group/${groupId}/invoice` : `${base}/${id}/invoice`
    setLoading(true)
    setError('')
    apiClient.get(url)
      .then(({ data }) => setInvoice(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load this invoice.'))
      .finally(() => setLoading(false))
  }, [admin, id, groupId])

  if (loading) return <LoadingScreen label="Preparing invoice" />

  if (error || !invoice) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">Invoice not available</h1>
        <p className="text-charcoal/70 mb-6 max-w-md">{error || 'Something went wrong.'}</p>
        <Link to={backLink} className="text-olive hover:underline">&larr; Back</Link>
      </div>
    )
  }

  const gstLines = invoice.gstEnabled && Number(invoice.gstRatePercent) > 0
  const generatedDate = invoice.generatedAt
    ? new Date(invoice.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : ''

  return (
    // Print-friendly by design, not by accident: every tinted panel below carries an
    // explicit print:bg-transparent/print:border-0 override, so what reaches paper is thin
    // black rules and text only - a household inkjet shouldn't have to lay down colored
    // fills just to print a receipt. The one exception is the olive top bar, thin enough
    // (6px) that it costs a negligible amount of ink even in color.
    <div className="bg-stone/40 print:bg-white py-12 print:py-0">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 print:px-0 print:max-w-none">
        <div className="print:hidden flex items-center justify-between mb-6">
          <Link to={backLink} className="text-sm text-olive hover:underline">&larr; Back</Link>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors text-sm"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="bg-white shadow-sm print:shadow-none border border-stone print:border-0 rounded-xl2 print:rounded-none overflow-hidden">
          <div className="h-1.5 bg-olive" />

          <div className="p-6 sm:p-10 print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 pb-6 border-b border-stone">
              <div>
                <h1 className="font-serif text-3xl text-balance">{invoice.hotelLegalName || invoice.hotelName}</h1>
                {invoice.hotelLegalName && invoice.hotelLegalName !== invoice.hotelName && (
                  <p className="text-sm text-charcoal/60 mt-0.5">Trading as {invoice.hotelName}</p>
                )}
                <div className="text-sm text-charcoal/70 mt-2 space-y-0.5">
                  {invoice.hotelAddress && <p className="max-w-xs">{invoice.hotelAddress}</p>}
                  <p>{[invoice.hotelContactEmail, invoice.hotelContactPhone].filter(Boolean).join(' · ')}</p>
                  {gstLines && invoice.hotelGstin && <p>GSTIN: {invoice.hotelGstin}</p>}
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-xs uppercase tracking-[0.15em] text-olive font-medium mb-1">
                  {gstLines ? 'Tax Invoice' : 'Invoice'}
                </p>
                <p className="font-serif text-2xl tabular-nums">{invoice.invoiceNumber}</p>
                <p className="text-sm text-charcoal/60 mt-0.5">{generatedDate}</p>
                <div className="mt-2 sm:flex sm:justify-end">
                  <PaymentBadge status="PAID" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 py-6 border-b border-stone">
              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1.5">Billed to</p>
                <p className="text-charcoal/90 font-medium">{invoice.guestName || 'Guest'}</p>
                <p className="text-sm text-charcoal/70 break-words">{invoice.guestEmail}</p>
                {invoice.guestPhone && <p className="text-sm text-charcoal/70">{invoice.guestPhone}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1.5">Stay</p>
                <p className="text-charcoal/90">{invoice.checkIn} &rarr; {invoice.checkOut}</p>
                <p className="text-sm text-charcoal/70">{invoice.nights} night{invoice.nights === 1 ? '' : 's'}</p>
                {gstLines && invoice.hotelHsnCode && (
                  <p className="text-sm text-charcoal/70 mt-1">SAC: {invoice.hotelHsnCode}</p>
                )}
                {gstLines && invoice.hotelStateName && (
                  <p className="text-sm text-charcoal/70">Place of supply: {invoice.hotelStateName}</p>
                )}
              </div>
            </div>

            <div className="py-6 border-b border-stone">
              <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-3">Charges</p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-stone">
                  {invoice.lines.map((line, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-charcoal/80">{line.description}</td>
                      <td className="py-2.5 text-right text-charcoal/80 whitespace-nowrap tabular-nums">
                        {Number(line.amount) < 0 ? `-${money(Math.abs(line.amount))}` : money(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-6 border-b border-stone flex justify-end">
              <div className="w-full max-w-xs">
                <div className="bg-stone/40 print:bg-transparent rounded-lg print:rounded-none px-4 py-3 print:px-0 print:py-0 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">{gstLines ? 'Taxable value' : 'Subtotal'}</span>
                    <span className="text-charcoal/80 tabular-nums">{money(invoice.taxableValue)}</span>
                  </div>
                  {gstLines && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">CGST @ {(Number(invoice.gstRatePercent) / 2).toFixed(2)}%</span>
                        <span className="text-charcoal/80 tabular-nums">{money(invoice.cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">SGST @ {(Number(invoice.gstRatePercent) / 2).toFixed(2)}%</span>
                        <span className="text-charcoal/80 tabular-nums">{money(invoice.sgstAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 mt-1 border-t border-charcoal/15 font-serif text-xl">
                    <span>Total</span>
                    <span className="tabular-nums">{money(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {invoice.payments?.length > 0 && (
              <div className="py-6 border-b border-stone">
                <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Payments received</p>
                <div className="space-y-1.5">
                  {invoice.payments.map((p) => {
                    const isRefund = Number(p.amount) < 0
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                        <span className={isRefund ? 'text-red-600' : 'text-charcoal/80'}>
                          <span className="tabular-nums">{isRefund ? '−' : ''}{money(Math.abs(p.amount))}</span> &middot; {p.method}
                          {isRefund ? ' · Refund' : ''}
                          {p.reference ? ` (${p.reference})` : ''}
                        </span>
                        <span className="text-charcoal/50 text-xs">
                          {new Date(p.paidAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="pt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="text-xs text-charcoal/50 space-y-1">
                <p>This is a computer-generated invoice and does not require a signature.</p>
                {!invoice.gstEnabled && <p>GST is not applicable to this invoice.</p>}
              </div>
              <p className="font-serif italic text-sm text-charcoal/60">Thank you for staying with {invoice.hotelName}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
