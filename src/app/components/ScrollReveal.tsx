'use client'
// ScrollReveal.tsx — adds .in to any [data-fph-reveal] element when it
// scrolls into view (the shelf-v5 reveal/stagger pattern). Renders nothing.

import { useEffect } from 'react'

export default function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-fph-reveal]'))
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in')
          io.unobserve(en.target)
        }
      })
    }, { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
