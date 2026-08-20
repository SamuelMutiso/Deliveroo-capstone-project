import Footer from './Footer'
import Navbar from './Navbar'

// Created page shell to hold main components on reload
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }) {  //included parts of the page header if present
  return (
    <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
        )}
        <h1 className="mt-0.5 font-display text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-prose font-body text-base text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export function PageContainer({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-3.5 py-6 sm:px-6 sm:py-8 ${className}`}>
      {children}
    </div>
  )
}