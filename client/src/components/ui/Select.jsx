import { useId } from 'react'

export default function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className = '',
  ...props
}) {
  const generatedId = useId()
  const id = props.id || generatedId

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-body text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? 'true' : undefined}
          className={[
            'h-11 w-full appearance-none rounded-xl bg-white px-3.5 pr-10',
            'font-body text-base text-slate-900 ring-1 ring-inset transition',
            'focus:outline-none focus:ring-2',
            error
              ? 'ring-red-300 focus:ring-red-500'
              : 'ring-slate-200 hover:ring-slate-300 focus:ring-brand-500',
          ].join(' ')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      {error ? (
        <p className="font-body text-sm text-red-700">{error}</p>
      ) : hint ? (
        <p className="font-body text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
