import { useState } from 'react'

const TONES = {
  brand: 'from-brand-300 via-brand-500 to-brand-800',
  ink: 'from-slate-800 via-slate-900 to-slate-950',
  ember: 'from-amber-500 via-amber-700 to-slate-900',
  cobalt: 'from-blue-500 via-blue-700 to-slate-950',
}

export default function Figure({
  src,
  alt,
  className = '',
  imageClassName = '',
  tone = 'ink',
  rounded = 'rounded-2xl',
  fill = false,
  children,
  eager = false,
}) {
  const [state, setState] = useState('loading')

  const position = fill ? 'absolute inset-0 h-full w-full' : 'relative'

  return (
    <div className={`${position} overflow-hidden ${rounded} ${className}`}>
      <div
        className={`absolute inset-0 bg-gradient-to-br ${TONES[tone]} ${
          state === 'ready' ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-500`}
        aria-hidden="true"
      >
        <Pattern />
      </div>

      {state !== 'failed' && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            state === 'ready' ? 'opacity-100' : 'opacity-0'
          } ${imageClassName}`}
        />
      )}

      {children}
    </div>
  )
}

function Pattern() {
  return (
    <svg className="h-full w-full opacity-25" aria-hidden="true">
      <defs>
        <pattern id="fig-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0v28" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fig-grid)" />
    </svg>
  )
}
