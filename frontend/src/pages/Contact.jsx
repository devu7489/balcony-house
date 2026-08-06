import { useState } from 'react'
import apiClient from '../api/axiosClient'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await apiClient.post('/contact', form)
      setStatus('done')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <h1 className="font-serif text-4xl mb-8">Contact</h1>
      {status === 'done' ? (
        <p className="text-olive">Thank you — we'll be in touch soon.</p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <input
            required
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive"
          />
          <textarea
            required
            rows={5}
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive"
          />
          <button className="px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors">
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          {status === 'error' && <p className="text-red-600 text-sm">Something went wrong, please try again.</p>}
        </form>
      )}
    </div>
  )
}
