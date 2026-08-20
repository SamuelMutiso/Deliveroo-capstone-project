const TONES = {
  success: 'bg-brand-400 text-brand-950',
  error: 'bg-red-500 text-white',
  info: 'bg-slate-950 text-white',
}

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3.5 z-50 flex flex-col items-center gap-2.5 px-3.5 sm:bottom-6"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'pointer-events-auto flex w-full max-w-md animate-rise items-start gap-2.5',
            'rounded-2xl px-6 py-3.5 shadow-xl',
            TONES[toast.tone] || TONES.info,
          ].join(' ')}
        >
          <p className="flex-1 font-body text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="-mr-1.5 rounded-full p-0.5 opacity-70 transition hover:opacity-100"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
