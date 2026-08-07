import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'

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
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12 print:py-0 print:px-0 print:max-w-none">
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link to={backLink} className="text-sm text-olive hover:underline">&larr; Back</Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors text-sm"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="bg-white border border-stone rounded-xl2 print:border-0 print:rounded-none p-6 sm:p-10 print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-stone">
          <div>
            <h1 className="font-serif text-2xl">{invoice.hotelLegalName || invoice.hotelName}</h1>
            {invoice.hotelLegalName && invoice.hotelLegalName !== invoice.hotelName && (
              <p className="text-sm text-charcoal/60">Trading as {invoice.hotelName}</p>
            )}
            {invoice.hotelAddress && <p className="text-sm text-charcoal/70 mt-1 max-w-xs">{invoice.hotelAddress}</p>}
            <p className="text-sm text-charcoal/70 mt-1">
              {[invoice.hotelContactEmail, invoice.hotelContactPhone].filter(Boolean).join(' · ')}
            </p>
            {gstLines && invoice.hotelGstin && (
              <p className="text-sm text-charcoal/70 mt-1">GSTIN: {invoice.hotelGstin}</p>
            )}
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">
              {gstLines ? 'Tax Invoice' : 'Invoice'}
            </p>
            <p className="font-serif text-lg">{invoice.invoiceNumber}</p>
            <p className="text-sm text-charcoal/60">{generatedDate}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 py-6 border-b border-stone">
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Billed to</p>
            <p className="text-charcoal/90 font-medium">{invoice.guestName || 'Guest'}</p>
            <p className="text-sm text-charcoal/70 break-words">{invoice.guestEmail}</p>
            {invoice.guestPhone && <p className="text-sm text-charcoal/70">{invoice.guestPhone}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-1">Stay</p>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-charcoal/50">
                <th className="pb-2 font-normal">Description</th>
                <th className="pb-2 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {invoice.lines.map((line, i) => (
                <tr key={i}>
                  <td className="py-2 text-charcoal/80">{line.description}</td>
                  <td className="py-2 text-right text-charcoal/80 whitespace-nowrap">
                    {Number(line.amount) < 0 ? `-${money(Math.abs(line.amount))}` : money(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="py-6 border-b border-stone flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal/60">{gstLines ? 'Taxable value' : 'Subtotal'}</span>
              <span className="text-charcoal/80">{money(invoice.taxableValue)}</span>
            </div>
            {gstLines && (
              <>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">CGST @ {(Number(invoice.gstRatePercent) / 2).toFixed(2)}%</span>
                  <span className="text-charcoal/80">{money(invoice.cgstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">SGST @ {(Number(invoice.gstRatePercent) / 2).toFixed(2)}%</span>
                  <span className="text-charcoal/80">{money(invoice.sgstAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-1.5 border-t border-stone font-serif text-lg">
              <span>Total</span>
              <span>{money(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {invoice.payments?.length > 0 && (
          <div className="py-6 border-b border-stone">
            <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-2">Payments received</p>
            <div className="space-y-1.5">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                  <span className="text-charcoal/80">
                    {money(p.amount)} &middot; {p.method}{p.reference ? ` (${p.reference})` : ''}
                  </span>
                  <span className="text-charcoal/50 text-xs">
                    {new Date(p.paidAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 text-xs text-charcoal/50 space-y-1">
          <p>This is a computer-generated invoice and does not require a signature.</p>
          {!invoice.gstEnabled && <p>GST is not applicable to this invoice.</p>}
        </div>
      </div>
    </div>
  )
}
