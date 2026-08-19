export default function EmptyState({ title, message, action, icon = 'parcel' }) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        {icon === 'parcel' ? (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
            <path
              d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <div>
        <p className="font-display text-xl font-semibold text-slate-900">{title}</p>
        {message && <p className="mt-1.5 max-w-prose font-body text-base text-slate-500">{message}</p>}
      </div>
      {action}
    </div>
  )
}
