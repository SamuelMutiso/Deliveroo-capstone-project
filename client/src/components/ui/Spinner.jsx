const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
}

const TONES = {
  light: 'border-white/30 border-t-white',
  dark: 'border-slate-300 border-t-slate-800',
  brand: 'border-brand-200 border-t-brand-600',
}

export default function Spinner({ size = 'md', tone = 'brand', label }) {
  return (
    <span className="inline-flex items-center gap-2.5" role="status" aria-live="polite">
      <span
        className={`inline-block animate-spin rounded-full ${SIZES[size]} ${TONES[tone]}`}
        aria-hidden="true"
      />
      {label ? <span className="text-sm text-slate-500">{label}</span> : null}
      <span className="sr-only">{label || 'Loading'}</span>
    </span>
  )
}

export function PageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[18rem] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  )
}
