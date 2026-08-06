import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'

const PHONE_PATTERN = /^[+]?[0-9 ()-]{7,20}$/
const todayIso = () => new Date().toISOString().slice(0, 10)

export default function CompleteProfile() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ phone: '', gender: '', dateOfBirth: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!PHONE_PATTERN.test(form.phone.trim())) {
      setStatus('error')
      setError('Enter a valid phone number.')
      return
    }
    if (form.dateOfBirth && form.dateOfBirth >= todayIso()) {
      setStatus('error')
      setError('Date of birth must be in the past.')
      return
    }

    setStatus('saving')
    try {
      await apiClient.put('/profile/me', {
        phone: form.phone.trim(),
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
      })
      await refresh()
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.message || 'Something went wrong, please try again.')
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-serif text-3xl mb-3">A few more details</h1>
      <p className="text-charcoal/70 mb-8">
        So we can reach you about your stay — this only takes a moment, and you won't be asked again.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <input
          required
          type="tel"
          pattern="[+]?[0-9 ()-]{7,20}"
          title="Enter a valid phone number"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive"
        />

        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive bg-white"
        >
          <option value="">Gender (optional)</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </select>

        <label className="block text-sm text-charcoal/70">
          Date of birth <span className="text-charcoal/40">(optional)</span>
          <input
            type="date"
            max={todayIso()}
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="mt-1 w-full border border-stone rounded-lg px-4 py-3 focus:outline-none focus:border-olive"
          />
        </label>

        <button
          type="submit"
          disabled={!form.phone || status === 'saving'}
          className="w-full px-7 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Saving…' : 'Save and continue'}
        </button>

        {status === 'error' && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  )
}
