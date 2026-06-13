'use client'
// VaultStats — the masthead totals. The dollar values count up once, on first
// mount; the figure count snaps instantly (a count ticking 0→1 on a one-item
// vault reads broken). After mount, prop changes from an inline paid edit or a
// removed figure snap straight to the new totals — the count-up never re-runs.
// Carries the hidden-tab lesson: rAF never ticks in a hidden/prerendered tab,
// so a setTimeout fallback always lands the final values.

import { useEffect, useRef } from 'react'

export default function VaultStats({ figures, estValue, paid }: {
  figures: number
  estValue: number
  paid: number
}) {
  const valRef = useRef<HTMLElement>(null)
  const paidRef = useRef<HTMLElement>(null)
  const animatedRef = useRef(false)

  useEffect(() => {
    const elVal = valRef.current, elPaid = paidRef.current
    if (!elVal || !elPaid) return
    const setFinal = () => {
      elVal.textContent = `$${estValue.toFixed(2)}`
      elPaid.textContent = `$${paid.toFixed(2)}`
    }
    // Already animated once, or motion is off, or this is a post-edit update:
    // snap to the new totals, no count-up.
    if (animatedRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFinal(); return
    }
    animatedRef.current = true

    elVal.textContent = '$0.00'
    elPaid.textContent = '$0.00'
    let t0: number | null = null
    let raf = 0
    const DUR = 1300
    const step = (ts: number) => {
      if (t0 === null) t0 = ts
      const p = Math.min((ts - t0) / DUR, 1)
      const e = 1 - Math.pow(1 - p, 3)
      elVal.textContent = `$${(estValue * e).toFixed(2)}`
      elPaid.textContent = `$${(paid * e).toFixed(2)}`
      if (p < 1) raf = requestAnimationFrame(step)
      else setFinal()
    }
    raf = requestAnimationFrame(step)
    const fallback = setTimeout(setFinal, 2000)
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback) }
  }, [figures, estValue, paid])

  const figLabel = `figure${figures === 1 ? '' : 's'}`

  return (
    <div
      className="vlt-stats"
      aria-label={`${figures} ${figLabel} pinned, estimated value $${estValue.toFixed(2)}, you paid $${paid.toFixed(2)}`}
    >
      <span><b className="n">{figures}</b> {figLabel} pinned</span>
      <span className="dot">·</span>
      <span title="Sum of medians from real eBay solds; your paid price stands in where a figure has no recent solds">
        est. value <b className="n gold" ref={valRef}>${estValue.toFixed(2)}</b>
      </span>
      <span className="dot">·</span>
      <span>you paid <b className="n" ref={paidRef}>${paid.toFixed(2)}</b></span>
    </div>
  )
}
