import { PageContainer } from '@/components/layout/AppShell'

export function LegalHeader({ eyebrow, title, updated, summary }) {
  return (
    <section className="bg-slate-950">
      <PageContainer className="py-14 sm:py-20">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[.95] tracking-[-0.05em] text-white sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-base leading-6 text-slate-300">{summary}</p>
        <p className="mt-5 font-body text-xs text-white/40">Last updated {updated}</p>
      </PageContainer>
    </section>
  )
}

export function LegalBody({ children }) {
  return (
    <section className="bg-white">
      <PageContainer className="py-14 sm:py-20">
        <div className="max-w-3xl">{children}</div>
      </PageContainer>
    </section>
  )
}

export function Clause({ number, title, children }) {
  return (
    <article className="border-t border-slate-100 py-8 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-brand-600">{number}</span>
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="mt-3 flex flex-col gap-3 font-body text-base leading-6 text-slate-600">
        {children}
      </div>
    </article>
  )
}

export function Points({ items }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
