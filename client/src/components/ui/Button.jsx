import Spinner from './Spinner'

const VARIANTS = {
  primary:
    'bg-brand-400 text-brand-950 hover:bg-brand-500 focus-visible:outline-brand-600 disabled:bg-brand-200 disabled:text-brand-700',
  dark: 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:outline-slate-950 disabled:bg-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400 disabled:bg-transparent disabled:text-slate-300',
  outline:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:outline-slate-400 disabled:bg-slate-50 disabled:text-slate-300 disabled:ring-slate-100 disabled:hover:bg-slate-50',
  danger:
    'bg-red-500 text-white hover:bg-red-700 focus-visible:outline-red-500 disabled:bg-red-300',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-6 text-base gap-2.5',
  lg: 'h-12 px-8 text-lg gap-2.5',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Tag
      className={[
        'inline-flex items-center justify-center rounded-full font-body font-semibold',
        'transition-colors duration-150 focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-offset-2 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      {...props}
    >
      {loading && <Spinner size="sm" tone={variant === 'dark' || variant === 'danger' ? 'light' : 'dark'} />}
      {children}
    </Tag>
  )
}
