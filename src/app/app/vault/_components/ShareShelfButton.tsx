'use client'
// ShareShelfButton — Claiming Ritual Phase C. Gated behind >=1 owned figure
// (rendered conditionally by the caller, matching the spec's "gate behind at
// least one owned figure" guard). Mints/reuses a stable share token
// (POST /api/shelf/share), then hands the resulting /shelf/[token] URL to
// navigator.share() where available, falling back to a clipboard copy +
// inline confirmation on browsers without the Web Share API (desktop
// Firefox/Safari as of this writing).

import { useState } from 'react'
import { trackFunnel } from '@/app/_lib/funnelClient'

type Status = 'idle' | 'loading' | 'copied' | 'error'

export default function ShareShelfButton() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleShare() {
    setStatus('loading')
    try {
      const res = await fetch('/api/shelf/share', { method: 'POST' })
      if (!res.ok) {
        setStatus('error')
        return
      }
      const { token } = await res.json() as { token: string }
      const url = `${window.location.origin}/shelf/${token}`

      if (navigator.share) {
        try {
          await navigator.share({ title: 'My Shelf — FigurePinner', url })
          trackFunnel('shelf_shared', { method: 'share' })
        } catch (err) {
          // AbortError = the user closed the native share sheet without
          // picking anything — a cancel, not a failure. Anything else is a
          // real error worth surfacing.
          if (err instanceof Error && err.name === 'AbortError') {
            setStatus('idle')
            return
          }
          throw err
        }
        setStatus('idle')
      } else {
        await navigator.clipboard.writeText(url)
        trackFunnel('shelf_shared', { method: 'clipboard' })
        setStatus('copied')
        window.setTimeout(() => setStatus('idle'), 2200)
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === 'loading'}
      className="vlt-share-btn"
    >
      {status === 'copied' ? 'Link copied!' : status === 'error' ? 'Try again' : status === 'loading' ? 'Loading…' : 'Share My Shelf'}
    </button>
  )
}
