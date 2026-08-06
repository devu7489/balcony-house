export default function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-charcoal/60">
      <div className="w-8 h-8 rounded-full border-2 border-olive border-t-transparent animate-spin" />
      <span className="text-sm tracking-wide">{label}…</span>
    </div>
  )
}
