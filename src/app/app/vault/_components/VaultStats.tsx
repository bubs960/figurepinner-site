'use client'
// VaultStats — the masthead count-up (once, on load, gentle). Carries the
// hidden-tab lesson from the mockup sessions: rAF never ticks in a hidden or
// prerendered tab, so a setTimeout fallback always lands the final values.

import { useEffect, useRef } from 'react'

export default function VaultStats({ figures, estValue, paid }: {
  figures: number
  estValue: number
  paid: number
}) {
  const figsRef = useRef<HTMLElement>(null)
  const valRef = useRef<HTMLElement>(null)
  const paidRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const elFigs = figsRef.current, elVal = valRef.current, elPaid = paidRef.current
    if (!elFigs || !elVal || !elPaid) return
    const setFinal = () => {
      elFigs.textContent = String(figures)
      elVal.textContent = `$${estValue.toFixed(2)}`
      elPaid.textContent = `$${paid.toFixed(2)}`
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setFinal(); return }

    elFigs.textContent = '0'
    elVal.textContent = '$0.00'
    elPaid.textContent = '$0.00'
    let t0: number | null = null
    let raf = 0
    const DUR = 1300
    const step = (ts: number) => {
      if (t0 === null) t0 = ts
      const p = Math.min((ts - t0) / DUR, 1)
      const e = 1 - Math.pow(1 - p, 3)
      elFigs.textContent = String(Math.round(figures * e))
      elVal.textContent = `$${(estValue * e).toFixed(2)}`
      elPaid.textContent = `$${(paid * e).toFixed(2)}`
      if (p < 1) raf = requestAnimationFrame(step)
      else setFinal()
    }
    raf = requestAnimationFrame(step)
    const fallback = setTimeout(setFinal, 2000)
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback) }
  }, [figures, estValue, paid])

  return (
    <div
      className="vlt-stats"
      aria-label={`${figures} figures pinned, estimated value $${estValue.toFixed(2)}, you paid $${paid.toFixed(2)}`}
    >
      <span><b className="n" ref={figsRef}>{figures}</b> figures pinned</span>
      <span className="dot">·</span>
      <span title="Sum of medians from real eBay solds; your paid price stands in where a figure has no recent solds">
        est. value <b className="n gold" ref={valRef}>${estValue.toFixed(2)}</b>
      </span>
      <span className="dot">·</span>
      <span>you paid <b className="n" ref={paidRef}>${paid.toFixed(2)}</b></span>
    </div>
  )
}
