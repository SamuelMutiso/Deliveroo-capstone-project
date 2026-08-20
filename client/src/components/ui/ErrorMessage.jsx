import Button from './Button'

export default function ErrorMessage({ title = 'That did not work', message, onRetry, compact }) {
  if (compact) {
    return (
      <p role="alert" className="rounded-xl bg-red-100 px-3.5 py-2.5 font-body text-sm text-red-700">
        {message}
      </p>
    )
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3.5 rounded-2xl bg-red-100/70 p-6 ring-1 ring-inset ring-red-300/50"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 font-body text-sm font-bold text-white"
          aria-hidden="true"
        >
          !
        </span>
        <div>
          <p className="font-display text-base font-semibold text-red-700">{title}</p>
          <p className="mt-0.5 font-body text-sm text-slate-700">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
