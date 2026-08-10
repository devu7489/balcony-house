import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import ConfirmDialog from '../components/ConfirmDialog'
import Select from '../components/Select'

const emptyForm = { guestName: '', quote: '', rating: 5, roomStayed: '', stayDate: '', featured: true }

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const load = () => {
    setLoading(true)
    apiClient.get('/admin/testimonials')
      .then(({ data }) => setTestimonials(data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = (e) => {
    e.preventDefault()
    if (!form.guestName.trim() || !form.quote.trim()) return
    setSaving(true)
    setError('')
    apiClient.post('/admin/testimonials', {
      ...form,
      rating: Number(form.rating),
      stayDate: form.stayDate || null,
    })
      .then(() => {
        setForm(emptyForm)
        load()
      })
      .catch(() => setError('Could not save testimonial. Check the fields and try again.'))
      .finally(() => setSaving(false))
  }

  const remove = (id) => {
    apiClient.delete(`/admin/testimonials/${id}`).then(load)
  }

  const toggleFeatured = (t) => {
    apiClient.post(`/admin/testimonials/${t.id}/${t.featured ? 'unfeature' : 'feature'}`).then(load)
  }

  if (loading) return <LoadingScreen label="Loading testimonials" />

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-4">Testimonials</h1>
      <p className="text-charcoal/60 text-sm mb-8">
        Curated guest quotes. Featured ones appear in the "What Our Guests Say" section on the home page.
      </p>

      <form onSubmit={submit} className="bg-white border border-stone rounded-xl2 p-6 mb-10 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-1">Guest name</label>
          <input
            className="w-full border border-stone rounded-lg px-3 py-2"
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-1">Quote</label>
          <textarea
            className="w-full border border-stone rounded-lg px-3 py-2"
            rows={3}
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-1">Rating</label>
          <Select
            className="w-full px-3 py-2"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          >
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r === 1 ? '' : 's'}</option>)}
          </Select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-1">Room stayed (optional)</label>
          <input
            className="w-full border border-stone rounded-lg px-3 py-2"
            value={form.roomStayed}
            onChange={(e) => setForm({ ...form, roomStayed: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-1">Stay date (optional)</label>
          <input
            type="date"
            className="w-full min-w-0 h-11 box-border appearance-none bg-white border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive"
            value={form.stayDate}
            onChange={(e) => setForm({ ...form, stayDate: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="featured"
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          <label htmlFor="featured" className="text-sm text-charcoal/70">Show on home page</label>
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-olive text-warmwhite font-medium hover:bg-charcoal transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add testimonial'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {testimonials.length === 0 ? (
        <p className="text-charcoal/70">No testimonials yet.</p>
      ) : (
        <div className="bg-white border border-stone rounded-xl2 divide-y divide-stone">
          {testimonials.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-charcoal">{t.guestName}</span>
                  <span className="text-xs text-olive">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                  {t.bookingId != null && (
                    <span className="text-xs text-charcoal/40 border border-stone rounded-full px-2 py-0.5">Verified stay</span>
                  )}
                  {!t.featured && <span className="text-xs text-charcoal/40 border border-stone rounded-full px-2 py-0.5">Hidden</span>}
                </div>
                <p className="text-sm text-charcoal/70 max-w-2xl">"{t.quote}"</p>
                <p className="text-xs text-charcoal/50 mt-1">
                  {t.roomStayed || 'No room noted'}{t.stayDate ? ` · ${new Date(t.stayDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => toggleFeatured(t)}
                  className="text-xs text-olive hover:underline"
                >
                  {t.featured ? 'Hide' : 'Feature'}
                </button>
                <button
                  onClick={() => setConfirmId(t.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmId != null}
        message="Delete this testimonial? This can't be undone."
        danger
        onConfirm={() => { const id = confirmId; setConfirmId(null); remove(id) }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
