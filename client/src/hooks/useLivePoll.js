import { useEffect, useRef } from 'react'

const DEFAULT_INTERVAL = 8000

/**
 * Re-runs `callback` on an interval so the screen updates without a manual refresh.
 * Sleeps while the tab is hidden and fires once immediately on the way back.
 */
export function useLivePoll(callback, { interval = DEFAULT_INTERVAL, enabled = true } = {}) {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return undefined

    let timer = null

    const tick = () => {
      if (document.visibilityState === 'visible') saved.current()
    }

    const start = () => {
      stop()
      timer = window.setInterval(tick, interval)
    }

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        saved.current()
        start()
      } else {
        stop()
      }
    }

    const onFocus = () => {
      saved.current()
      start()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [interval, enabled])
}

export default useLivePoll
