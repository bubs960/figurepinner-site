'use client'

/**
 * SeamScrollDriver — drives the MOTU hero's scroll-rise (Gate 3). It owns NO
 * markup; it only writes a single CSS variable `--rise` (0→1) onto the
 * `.fh-hero--seam` element as you scroll through the hero. globals.css uses
 * `--rise` to RAISE the Power Sword and JOIN its two halves (transform/opacity
 * only) + bloom the seam — the "reading charges the power → I HAVE THE POWER"
 * payoff (directive decision 2).
 *
 * Perf/a11y (NON-NEGOTIABLE, directive motion rules):
 * - rAF-throttled, passive scroll listener; writes only a CSS var (no layout reads in a loop beyond one rect).
 * - Animates transform/opacity only (in CSS), never layout props.
 * - prefers-reduced-motion: the driver does NOT attach; CSS leaves `--rise: 1`
 *   (sword arrives raised + joined), so reduced-motion users get the full static payoff.
 * - The sword is decorative + non-LCP; the SSR'd hero copy is untouched.
 */

import { useEffect } from 'react'

export default function SeamScrollDriver() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return // reduced-motion → CSS default --rise:1 (raised, static)

    const hero = document.querySelector<HTMLElement>('.fh-hero--seam')
    if (!hero) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = hero.getBoundingClientRect()
      const h = rect.height || 1
      // Complete the rise+join over the first ~40% of hero scroll so the halves
      // visibly snap together + the sword draws upward while still in view (the
      // payoff happens on a small scroll, not after the sword has left).
      const range = Math.max(h * 0.4, 200)
      const scrolled = Math.max(-rect.top, 0)
      hero.style.setProperty('--rise', Math.min(scrolled / range, 1).toFixed(4))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return null
}
