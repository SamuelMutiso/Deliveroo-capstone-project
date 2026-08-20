export default function Pagination({ meta, onChange, label = 'results' }) {
  if (!meta || meta.pages <= 1) return null

  const { page, pages, total, per_page: perPage } = meta
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  const windowed = []
  const start = Math.max(1, Math.min(page - 1, pages - 2))
  for (let i = start; i < start + 3 && i <= pages; i += 1) windowed.push(i)

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3.5 pt-3.5"
      aria-label="Pagination"
    >
      <p className="font-body text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-800">{from}</span> to{' '}
        <span className="font-semibold text-slate-800">{to}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span> {label}
      </p>

      <div className="flex items-center gap-1.5">
        <PageButton disabled={!meta.has_prev} onClick={() => onChange(page - 1)}>
          Previous
        </PageButton>
        {windowed[0] > 1 && <Ellipsis />}
        {windowed.map((number) => (
          <PageButton key={number} active={number === page} onClick={() => onChange(number)}>
            {number}
          </PageButton>
        ))}
        {windowed[windowed.length - 1] < pages && <Ellipsis />}
        <PageButton disabled={!meta.has_next} onClick={() => onChange(page + 1)}>
          Next
        </PageButton>
      </div>
    </nav>
  )
}

function PageButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={[
        'h-9 min-w-9 rounded-xl px-2.5 font-body text-sm font-semibold transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:text-slate-300',
        active
          ? 'bg-slate-950 text-white'
          : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:ring-slate-100',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Ellipsis() {
  return <span className="px-1.5 font-body text-sm text-slate-400">…</span>