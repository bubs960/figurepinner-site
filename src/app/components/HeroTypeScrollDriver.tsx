'use client'

/**
 * HeroTypeScrollDriver — drives the homepage hero's GalleryTypeLayer parallax
 * (Museum Night S2, Room 0). Same technical pattern as
 * `src/app/guides/_components/SeamScrollDriver.tsx` (rAF+CSS-var), reused
 * per spec rather than reinvented: owns NO markup, writes a single 0-1
 * progress CSS variable `--parallax-y` onto `.fph-hero`; page.tsx's CSS
 * converts that progress into an actual pixel offset via calc(), so the
 * driver stays dumb and the visual tuning lives in CSS.
 *
 * Perf/a11y (non-negotiable, carried from the audit):
 * - rAF-throttled, passive scroll listener; one bounding-rect read per frame,
 *   no other layout reads.
 * - Writes only a CSS custom property — the type layer itself only ever
 *   moves via `transform`, never a layout-triggering property.
 * - prefers-reduced-motion: the driver does NOT attach at all; CSS default
 *   --parallax-y:0 leaves the layer at its composed rest position.
 * - Type layer is aria-hidden + decorative; it is never the LCP element and
 *   this driver never touches anything that could become one.
 */

import { useEffect } from 'react'

export default function HeroTypeScrollDriver() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return // reduced-motion → CSS default --parallax-y:0 (static)

    const hero = document.querySelector<HTMLElement>('.fph-hero')
    if (!hero) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = hero.getBoundingClientRect()
      const h = rect.height || 1
      // 0 at the hero's natural position, 1 once scrolled a full hero-height
      // past it — CSS scales this into the actual parallax pixel range.
      const scrolled = Math.max(-rect.top, 0)
      hero.style.setProperty('--parallax-y', Math.min(scrolled / h, 1).toFixed(4))
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
