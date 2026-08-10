import { useEffect, useState } from 'react'
import apiClient from '../api/axiosClient'
import LoadingScreen from '../components/LoadingScreen'
import Select from '../components/Select'
import ConfirmDialog from '../components/ConfirmDialog'
import { todayIso, tomorrowIso } from '../lib/dates'
import { roomNumberOptions } from '../lib/roomNumbers'

const HOUSEKEEPING_LABELS = { CLEAN: 'Clean', DIRTY: 'Needs cleaning', CLEANING_IN_PROGRESS: 'Cleaning in progress' }
const HOUSEKEEPING_STYLES = {
  CLEAN: 'bg-olive/15 text-olive',
  DIRTY: 'bg-red-100 text-red-700',
  CLEANING_IN_PROGRESS: 'bg-amber-100 text-amber-700',
}

export default function AdminRooms() {
  const [properties, setProperties] = useState([])
  const [blocks, setBlocks] = useState([])
  const [roomStatuses, setRoomStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ propertyId: '', startDate: todayIso(), endDate: tomorrowIso(), reason: '' })
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmBlockId, setConfirmBlockId] = useState(null)
  const [updatingRoom, setUpdatingRoom] = useState(null)

  const load = () => apiClient.get('/admin/room-blocks').then(({ data }) => setBlocks(data))
  const loadRoomStatuses = () => apiClient.get('/admin/room-status').then(({ data }) => setRoomStatuses(data))

  useEffect(() => {
    Promise.all([
      apiClient.get('/properties').then(({ data }) => setProperties(data)),
      load(),
      loadRoomStatuses(),
    ]).finally(() => setLoading(false))
  }, [])

  const setRoomStatus = async (propertyId, roomNumber, status) => {
    setUpdatingRoom(`${propertyId}:${roomNumber}`)
    try {
      await apiClient.post('/admin/room-status', { propertyId, roomNumber, status })
      await loadRoomStatuses()
    } finally {
      setUpdatingRoom(null)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      await apiClient.post('/admin/room-blocks', {
        propertyId: Number(form.propertyId),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || null,
      })
      setForm({ propertyId: '', startDate: todayIso(), endDate: tomorrowIso(), reason: '' })
      await load()
      setSubmitStatus('idle')
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not create that block, please try again.')
      setSubmitStatus('error')
    }
  }

  const remove = async (id) => {
    setDeletingId(id)
    try {
      await apiClient.delete(`/admin/room-blocks/${id}`)
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <LoadingScreen label="Loading rooms" />

  return (
    <div>
      <h1 className="font-serif text-3xl sm:text-4xl mb-1">Rooms</h1>
      <p className="text-charcoal/50 text-sm mb-10">
        Housekeeping status per room, and maintenance blocks that take a whole room category out of service.
      </p>

      <div className="mb-10">
        <h2 className="font-serif text-lg mb-1">Housekeeping</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          A room is marked "Needs cleaning" automatically when a guest checks out. Untouched rooms default to Clean.
        </p>
        <div className="bg-white border border-stone rounded-xl2 divide-y divide-stone">
          {properties.map((p) =>
            roomNumberOptions(p).map((roomNumber) => {
              const existing = roomStatuses.find((r) => r.propertyId === p.id && r.roomNumber === roomNumber)
              const status = existing?.status || 'CLEAN'
              const key = `${p.id}:${roomNumber}`
              return (
                <div key={key} className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
                  <div>
                    <p className="text-charcoal/90 font-medium">{roomNumber}</p>
                    <p className="text-xs text-charcoal/50">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${HOUSEKEEPING_STYLES[status]}`}>
                      {HOUSEKEEPING_LABELS[status]}
                    </span>
                    <Select
                      value={status}
                      disabled={updatingRoom === key}
                      onChange={(e) => setRoomStatus(p.id, roomNumber, e.target.value)}
                      className="w-40 text-sm px-2 py-1.5"
                    >
                      <option value="CLEAN">Clean</option>
                      <option value="CLEANING_IN_PROGRESS">Cleaning in progress</option>
                      <option value="DIRTY">Needs cleaning</option>
                    </Select>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <h2 className="font-serif text-lg mb-1">Maintenance blocks</h2>
      <p className="text-charcoal/50 text-sm mb-4">
        Take a room out of service for repairs or personal use — it stops showing as bookable for those dates.
      </p>

      <form onSubmit={submit} className="bg-white border border-stone rounded-xl2 p-5 mb-10 space-y-4">
        <h2 className="font-serif text-lg">Block a room</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Select
            value={form.propertyId}
            onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
            required
            className="w-full px-3 py-2.5"
          >
            <option value="" disabled>Room</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <input
            type="date"
            value={form.startDate}
            min={todayIso()}
            onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value >= form.endDate ? e.target.value : form.endDate })}
            required
            className="min-w-0 h-11 box-border appearance-none border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive bg-white"
          />
          <input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
            className="min-w-0 h-11 box-border appearance-none border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive bg-white"
          />
        </div>
        <input
          type="text"
          placeholder="Reason (e.g. plumbing repair)"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="w-full border border-stone rounded-lg px-3 py-2.5 focus:outline-none focus:border-olive bg-white"
        />
        <button
          type="submit"
          disabled={submitStatus === 'submitting'}
          className="px-6 py-2.5 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          {submitStatus === 'submitting' ? 'Adding…' : 'Add block'}
        </button>
        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
      </form>

      {blocks.length === 0 ? (
        <p className="text-charcoal/70">No rooms currently blocked.</p>
      ) : (
        <div className="bg-white border border-stone rounded-xl2 divide-y divide-stone">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
              <div>
                <p className="text-charcoal/90 font-medium">{b.propertyName}</p>
                <p className="text-sm text-charcoal/60">{b.startDate} &rarr; {b.endDate}</p>
                {b.reason && <p className="text-xs text-charcoal/50 mt-0.5">{b.reason}</p>}
              </div>
              <button
                onClick={() => setConfirmBlockId(b.id)}
                disabled={deletingId === b.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {deletingId === b.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmBlockId != null}
        message="Remove this block? The room becomes bookable again for those dates."
        danger
        onConfirm={() => { const id = confirmBlockId; setConfirmBlockId(null); remove(id) }}
        onCancel={() => setConfirmBlockId(null)}
      />
    </div>
  )
}
