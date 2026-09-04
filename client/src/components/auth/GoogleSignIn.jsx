import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import { googleSignIn } from '@/features/auth/authSlice'
import { useToast } from '@/hooks/useToast'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', reject)
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function GoogleSignIn({ label = 'signin_with' }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const target = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return undefined
    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled || !target.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            const result = await dispatch(googleSignIn(credential))
            if (googleSignIn.rejected.match(result)) {
              toast.error(result.payload || 'Google sign-in did not work')
            }
          },
        })
        window.google.accounts.id.renderButton(target.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: label,
          width: 320,
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, label, toast])

  if (!CLIENT_ID || failed) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3.5">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div ref={target} className="mt-5 flex justify-center [color-scheme:light]" />
    </div>
  )
}
