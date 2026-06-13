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
  const gainRef = useRef<HTMLElement>(null)
  const animatedRef = useRef(false)

  // Portfolio delta: only the figures that actually have a median contribute a
  // real gain (no-comp figures fall back to paid → 0 delta), so this is the
  // honest "up/down" on what the shelf is worth vs what it cost.
  const gain = estValue - paid
  const pct = paid > 0 ? (gain / paid) * 100 : null
  const gainStr = (g: number) => `${g >= 0 ? '▲' : '▼'} $${Math.abs(g).toFixed(2)}`

  useEffect(() => {
    const elVal = valRef.current, elPaid = paidRef.current, elGain = gainRef.current
    if (!elVal || !elPaid) return
    const setFinal = () => {
      elVal.textContent = `$${estValue.toFixed(2)}`
      elPaid.textContent = `$${paid.toFixed(2)}`
      if (elGain) elGain.textContent = gainStr(gain)
    }
    // Already animated once, or motion is off, or this is a post-edit update:
    // snap to the new totals, no count-up.
    if (animatedRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFinal(); return
    }
    animatedRef.current = true

    elVal.textContent = '$0.00'
    elPaid.textContent = '$0.00'
    if (elGain) elGain.textContent = gainStr(0)
    let t0: number | null = null
    let raf = 0
    const DUR = 1300
    const step = (ts: number) => {
      if (t0 === null) t0 = ts
      const p = Math.min((ts - t0) / DUR, 1)
      const e = 1 - Math.pow(1 - p, 3)
      elVal.textContent = `$${(estValue * e).toFixed(2)}`
      elPaid.textContent = `$${(paid * e).toFixed(2)}`
      if (elGain) elGain.textContent = gainStr(gain * e)
      if (p < 1) raf = requestAnimationFrame(step)
      else setFinal()
    }
    raf = requestAnimationFrame(step)
    const fallback = setTimeout(setFinal, 2000)
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback) }
  }, [figures, estValue, paid])

  const figLabel = `figure${figures === 1 ? '' : 's'}`

  const showGain = figures > 0
  const gainAria = showGain
    ? `, ${gain >= 0 ? 'up' : 'down'} $${Math.abs(gain).toFixed(2)}${pct != null ? ` (${gain >= 0 ? '+' : '-'}${Math.abs(pct).toFixed(0)} percent)` : ''}`
    : ''

  return (
    <div
      className="vlt-stats"
      aria-label={`${figures} ${figLabel} pinned, estimated value $${estValue.toFixed(2)}, you paid $${paid.toFixed(2)}${gainAria}`}
    >
      <span><b className="n">{figures}</b> {figLabel} pinned</span>
      <span className="dot">·</span>
      <span title="Sum of medians from real eBay solds; your paid price stands in where a figure has no recent solds">
        est. value <b className="n gold" ref={valRef}>${estValue.toFixed(2)}</b>
      </span>
      <span className="dot">·</span>
      <span>you paid <b className="n" ref={paidRef}>${paid.toFixed(2)}</b></span>
      {showGain && (
        <>
          <span className="dot">·</span>
          <span
            className={`gain ${gain >= 0 ? 'up' : 'dn'}`}
            title="Estimated value minus what you paid, across the whole shelf"
          >
            <b ref={gainRef}>{gainStr(gain)}</b>
            {pct != null && (
              <span className="pct">({gain >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(0)}%)</span>
            )}
          </span>
        </>
      )}
    </div>
  )
}
