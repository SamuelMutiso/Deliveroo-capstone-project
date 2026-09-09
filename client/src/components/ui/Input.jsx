import { useId } from 'react'

export default function Input({
  label,
  error,
  hint,
  className = '',
  inputClassName = '',
  prefix,
  as = 'input',
  ...props
}) {
  const generatedId = useId()
  const id = props.id || generatedId
  const Tag = as
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-body text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <Tag
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={[
            'w-full rounded-xl bg-white font-body text-base text-slate-900 transition',
            'ring-1 ring-inset placeholder:text-slate-300',
            'focus:outline-none focus:ring-2',
            Tag === 'textarea' ? 'min-h-[6.5rem] resize-y py-3.5' : 'h-11',
            prefix ? 'pl-11 pr-3.5' : 'px-3.5',
            error
              ? 'ring-red-300 focus:ring-red-500'
              : 'ring-slate-200 hover:ring-slate-300 focus:ring-brand-500',
            inputClassName,
          ].join(' ')}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="font-body text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="font-body text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
