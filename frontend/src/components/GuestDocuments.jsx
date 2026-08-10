import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import Select from './Select'
import ConfirmDialog from './ConfirmDialog'

const DOCUMENT_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'OTHER', label: 'Other' },
]

const typeLabel = (value) => DOCUMENT_TYPES.find((t) => t.value === value)?.label || value

// Shared between AdminBookingDetail.jsx (single room) and AdminTripDetail.jsx (per room in a
// trip) - guest ID documents are booking-level either way, so the same upload/list/delete UI
// works unchanged in both places. Reports its own document count up via onCountChange so the
// parent can gate its Check-in button on it without a second, duplicate fetch.
export default function GuestDocuments({ bookingId, onCountChange }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [documentType, setDocumentType] = useState('AADHAAR')
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadError, setUploadError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDocId, setConfirmDocId] = useState(null)

  const load = () => apiClient.get(`/admin/bookings/${bookingId}/documents`).then(({ data }) => {
    setDocuments(data)
    onCountChange?.(data.length)
  })

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  const upload = async (e) => {
    e.preventDefault()
    if (!file) { setUploadError('Choose a file to upload'); return }
    setUploadStatus('uploading')
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)
      if (notes) formData.append('notes', notes)
      await apiClient.post(`/admin/bookings/${bookingId}/documents`, formData)
      setFile(null)
      setNotes('')
      setFileInputKey((k) => k + 1)
      await load()
      setUploadStatus('idle')
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Could not upload that file, please try again.')
      setUploadStatus('error')
    }
  }

  const remove = async (docId) => {
    setDeletingId(docId)
    try {
      await apiClient.delete(`/admin/bookings/${bookingId}/documents/${docId}`)
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return null

  return (
    <div className="border border-stone rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-charcoal/50 mb-3">Guest ID documents</p>

      {documents.length > 0 && (
        <div className="space-y-2 mb-4">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 text-sm flex-wrap bg-stone/30 rounded-lg px-3 py-2">
              <a
                href={`/api/admin/bookings/${bookingId}/documents/${d.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="text-olive hover:underline break-all"
              >
                {typeLabel(d.documentType)} &middot; {d.originalFilename}
              </a>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-charcoal/50">
                  {new Date(d.uploadedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
                <button
                  onClick={() => setConfirmDocId(d.id)}
                  disabled={deletingId === d.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {deletingId === d.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={upload} className="flex flex-col sm:flex-row gap-2">
        <Select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="sm:w-44 px-3 py-2 text-sm shrink-0">
          {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <input
          key={fileInputKey}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="flex-1 text-sm border border-stone rounded-lg px-3 py-1.5 bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-stone file:text-charcoal/70 file:text-xs"
        />
        <button
          type="submit"
          disabled={uploadStatus === 'uploading'}
          className="px-4 py-2 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50 text-sm shrink-0"
        >
          {uploadStatus === 'uploading' ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}

      <ConfirmDialog
        open={confirmDocId != null}
        message="Remove this document?"
        danger
        onConfirm={() => { const id = confirmDocId; setConfirmDocId(null); remove(id) }}
        onCancel={() => setConfirmDocId(null)}
      />
    </div>
  )
}
