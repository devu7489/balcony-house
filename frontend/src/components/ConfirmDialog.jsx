import { useEffect } from 'react'

// In-app replacement for window.confirm() - native confirm() is unreliable in several
// mobile browser contexts (some in-app/embedded browsers suppress it outright), so every
// "are you sure" moment in the admin/guest UI goes through this instead. Renders nothing
// when not open, so a page can just always mount it and drive it off a bit of state.
export default function ConfirmDialog({ open, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="bg-warmwhite rounded-xl2 shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-charcoal/80 text-sm whitespace-pre-line mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-charcoal/60 hover:underline"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`px-5 py-2 rounded-full text-sm text-warmwhite transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-olive hover:bg-charcoal'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
