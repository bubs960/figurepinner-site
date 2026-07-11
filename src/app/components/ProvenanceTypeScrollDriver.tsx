'use client'

/**
 * ProvenanceTypeScrollDriver — drives Room III's GalleryTypeLayer parallax
 * (Museum Night S4). Same rAF+CSS-var pattern as HeroTypeScrollDriver /
 * SeamScrollDriver, re-implemented per-target rather than shared (this
 * codebase's established convention — see HeroTypeScrollDriver.tsx's own
 * comment) since each targets a different element and CSS var scope.
 *
 * IntersectionObserver-gated on top of the base pattern (the risk this spec
 * explicitly calls out: two parallax layers on the page at once on low-end
 * Android). The scroll/resize listeners only attach while Room III is
 * actually in the viewport — the hero's own driver already stops mattering
 * once you've scrolled past it, but Room III's would otherwise keep running
 * a rect read on every scroll tick for the entire rest of the page.
 */

import { useEffect } from 'react'

export default function ProvenanceTypeScrollDriver() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return // reduced-motion → CSS default --parallax-y:0 (static)

    const section = document.querySelector<HTMLElement>('.fph-provenance')
    if (!section) return

    let raf = 0
    let attached = false
    const update = () => {
      raf = 0
      const rect = section.getBoundingClientRect()
      const h = rect.height || 1
      const scrolled = Math.max(-rect.top, 0)
      section.style.setProperty('--parallax-y', Math.min(scrolled / h, 1).toFixed(4))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const attach = () => {
      if (attached) return
      attached = true
      update()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
    }
    const detach = () => {
      if (!attached) return
      attached = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) attach()
      else detach()
    }, { rootMargin: '200px 0px' })
    io.observe(section)

    return () => { io.disconnect(); detach() }
  }, [])

  return null
}
