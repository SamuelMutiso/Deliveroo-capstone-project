import { NavLink } from 'react-router-dom'

export default function Sidebar({ links, heading = 'Workspace', footnote }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-[5.5rem] flex flex-col gap-3.5 rounded-2xl bg-slate-950 p-6">
        <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-400">{heading}</p>

        <nav className="flex flex-col gap-0.5" aria-label="Section">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'flex items-center justify-between rounded-xl px-3.5 py-2.5',
                  'font-body text-sm font-medium transition',
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              <span>{link.label}</span>
              {link.badge !== undefined && link.badge !== null && (
                <span className="rounded-full bg-brand-500/20 px-2.5 font-mono text-xs text-brand-300">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {footnote && (
          <p className="border-t border-white/10 pt-3.5 font-body text-xs leading-relaxed text-slate-400">
            {footnote}
          </p>
        )}
      </div>
    </aside>
  )
}