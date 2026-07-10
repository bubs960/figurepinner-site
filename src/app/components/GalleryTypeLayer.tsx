'use client'
// GalleryTypeLayer — the homepage hero's giant decorative background type
// (Museum Night S2, Room 0). Deliberately mounted client-side only (empty on
// the server-rendered HTML) rather than inline in page.tsx's JSX: even at
// ~6% opacity this is a huge, viewport-wide painted text block once clipped
// by .fph-hero's overflow:hidden, and Chrome's LCP algorithm only excludes
// truly opacity:0 elements — a low-opacity-but-large text node is still a
// legitimate LCP candidate. Mounting after hydration keeps it out of the
// initial paint the LCP measurement is based on, so the H1 (or the shelf's
// eager image) stays the LCP element without relying on opacity math to
// keep it under Chrome's radar. Appears within a frame of hydration —
// imperceptible for a decorative background layer.

import { useEffect, useState } from 'react'

export default function GalleryTypeLayer({ text }: { text: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <div className="fph-type-layer" aria-hidden="true"><span>{text}</span></div>
  )
}
