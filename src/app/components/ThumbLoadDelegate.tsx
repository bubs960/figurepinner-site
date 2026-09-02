'use client'
/**
 * ThumbLoadDelegate — one per page. Gives FigureThumbStatic (server markup)
 * its load/error states without a client component per thumbnail.
 *
 * `load` and `error` do not bubble, but they are observable in the capture
 * phase on `document`, so a single listener pair covers every thumb on the
 * page — including ones that stream in later. Images that finished loading
 * before hydration (cached, or above the fold) never fire `load` for us, so
 * the mount pass checks `complete` on every thumb the way FigureThumb's ref
 * callback did per instance.
 *
 * Renders nothing. Safe to include on pages with no static thumbs.
 */

import { useEffect } from 'react'

const IMG = 'fp-thumb__img'

function mark(img: HTMLImageElement, state: 'is-loaded' | 'is-error') {
  const box = img.closest('.fp-thumb')
  if (box) box.classList.add(state)
}

export default function ThumbLoadDelegate() {
  useEffect(() => {
    const onLoad = (e: Event) => {
      const t = e.target
      if (t instanceof HTMLImageElement && t.classList.contains(IMG)) mark(t, 'is-loaded')
    }
    const onError = (e: Event) => {
      const t = e.target
      if (t instanceof HTMLImageElement && t.classList.contains(IMG)) mark(t, 'is-error')
    }
    document.addEventListener('load', onLoad, true)
    document.addEventListener('error', onError, true)

    // Already-complete images at mount (the onLoad race FigureThumb documents).
    document.querySelectorAll<HTMLImageElement>('img.' + IMG).forEach((img) => {
      if (!img.complete) return
      mark(img, img.naturalWidth > 0 ? 'is-loaded' : 'is-error')
    })

    return () => {
      document.removeEventListener('load', onLoad, true)
      document.removeEventListener('error', onError, true)
    }
  }, [])
  return null
}
