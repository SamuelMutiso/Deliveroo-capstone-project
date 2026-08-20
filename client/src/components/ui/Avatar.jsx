import { initials } from '@/utils/formatters'

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg sm:h-20 sm:w-20 sm:text-xl',
  xl: 'h-24 w-24 text-2xl sm:h-28 sm:w-28',
}

export default function Avatar({ name, photo, size = 'md', className = '' }) {
  const box = `${SIZES[size] || SIZES.md} shrink-0 overflow-hidden rounded-full ${className}`

  if (photo) {
    return (
      <img
        src={photo}
        alt={name ? `${name}, delivery rider` : 'Profile photo'}
        className={`${box} object-cover ring-1 ring-inset ring-slate-200`}
      />
    )
  }

  return (
    <span
      className={`${box} flex items-center justify-center bg-brand-100 font-display font-bold text-brand-800`}
    >
      {initials(name)}
    </span>
  )
}
