import logoMark from '@/assets/logo.png'

const MARK_SIZE = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
}

const WORD_SIZE = {
  sm: 'text-base tracking-tight',
  md: 'text-lg tracking-tight',
  lg: 'text-2xl tracking-[-0.06em]',
}

const WORD_TONE = {
  dark: 'text-slate-950',
  light: 'text-white',
}

export default function Logo({ size = 'md', tone = 'dark', wordmark = true }) {
  return (
    <>
      <span
        className={`flex ${MARK_SIZE[size]} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper ring-1 ring-black/5`}
      >
        <img
          src={logoMark}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
        />
      </span>
      {wordmark && (
        <span className={`font-display font-bold ${WORD_SIZE[size]} ${WORD_TONE[tone]}`}>
          Deliveroo
        </span>
      )}
    </>
  )
}
