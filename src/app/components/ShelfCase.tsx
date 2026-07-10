'use client'
// ShelfCase.tsx — the homepage's lit glass display case (shelf-v5 spec).
// Two shelf rows of real figures + the signature auto-pin demo: every ~4s a
// gold pushpin drops onto a random figure and its photo flies into the Vault
// tray. User clicks always work and pause the demo 15s. All motion is
// transform/opacity-only and freezes to a static state under
// prefers-reduced-motion.
//
// The pin/demo/tray state is deliberately DOM-managed inside one mount
// effect (ported from the approved mockup): the component renders once from
// static props and React never reconciles the case subtree afterwards, so
// imperative class toggles are safe and cheap.

import { useEffect, useRef } from 'react'

export type ShelfFigure = {
  fid: string
  href: string
  name: string
  /** Small uppercase tag under the name — line/wave, or a real sold price. */
  tag: string
  /** True when the tag is a real sold price (gold dot treatment). */
  sold?: boolean
  img: string
}

const PIN_PATH = 'M14.6 2.6 21.4 9.4 19.8 11l-.9-.3-4 4 .3 2.6-1.6 1.6-4-4-5.2 5.2-1.4-1.4L8.2 13.5l-4-4L5.8 8l2.6.3 4-4-.3-.9 2.5-.8Z'

export default function ShelfCase({ figures, label }: { figures: ShelfFigure[]; label?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const caseEl = root.querySelector<HTMLElement>('.fph-case')
    const tray = root.querySelector<HTMLElement>('.fph-tray')
    const trayText = root.querySelector<HTMLElement>('.fph-tray-text')
    const trayThumbs = root.querySelector<HTMLElement>('.fph-tray-thumbs')
    if (!caseEl || !tray || !trayText || !trayThumbs) return
    const TRAY_CAP = 4

    // spotlight: drift by default, cursor takes over
    let manualTimer: ReturnType<typeof setTimeout> | null = null
    const onMove = (e: MouseEvent) => {
      const r = caseEl.getBoundingClientRect()
      caseEl.style.setProperty('--mx', `${e.clientX - r.left}px`)
      caseEl.style.setProperty('--my', `${e.clientY - r.top}px`)
      caseEl.classList.add('manual')
      if (manualTimer) clearTimeout(manualTimer)
      manualTimer = setTimeout(() => caseEl.classList.remove('manual'), 2600)
    }
    const fine = window.matchMedia('(pointer:fine)').matches
    if (fine) caseEl.addEventListener('mousemove', onMove)

    function updateTrayText() {
      const n = trayThumbs!.children.length
      if (n === 0) {
        tray!.classList.remove('active')
        trayText!.textContent = 'Hover a figure and tap the pin - start a shelf of your own.'
      } else {
        tray!.classList.add('active')
        const strong = document.createElement('strong')
        strong.textContent = `${n} ${n === 1 ? 'figure' : 'figures'} pinned`
        trayText!.replaceChildren(strong, document.createTextNode(' - a free Vault keeps them.'))
      }
    }
    function appendThumb(src: string, fid: string | null) {
      const t = document.createElement('img')
      t.src = src
      t.alt = ''
      if (fid !== null) t.setAttribute('data-fid', fid)
      trayThumbs!.appendChild(t)
      updateTrayText()
    }
    function addToTray(src: string, fid: string | null) {
      if (trayThumbs!.children.length >= TRAY_CAP) {
        trayThumbs!.classList.add('clearing')
        setTimeout(() => {
          trayThumbs!.innerHTML = ''
          trayThumbs!.classList.remove('clearing')
          appendThumb(src, fid)
        }, 470)
      } else {
        appendThumb(src, fid)
      }
    }
    function removeFromTray(fid: string) {
      const t = trayThumbs!.querySelector(`img[data-fid="${fid}"]`)
      if (t && t.parentNode) t.parentNode.removeChild(t)
      updateTrayText()
    }

    // flying thumbnail (transform + opacity only)
    function flyToTray(fig: HTMLElement, done?: () => void) {
      const img = fig.querySelector<HTMLImageElement>('.fph-mount img')
      if (!img || reduce) { done?.(); return }
      const r = img.getBoundingClientRect()
      const tr = tray!.getBoundingClientRect()
      if (!r.width || !tr.width) { done?.(); return }
      const clone = document.createElement('img')
      clone.src = img.currentSrc || img.src
      clone.alt = ''
      clone.className = 'fph-fly-thumb'
      clone.style.left = `${r.left}px`
      clone.style.top = `${r.top}px`
      clone.style.width = `${r.width}px`
      clone.style.height = `${r.height}px`
      document.body.appendChild(clone)
      const tx = (tr.left + 56) - (r.left + r.width / 2)
      const ty = (tr.top + tr.height / 2) - (r.top + r.height / 2)
      const s = 28 / r.width
      requestAnimationFrame(() => requestAnimationFrame(() => {
        clone.style.transform = `translate(${tx}px,${ty}px) scale(${s})`
        clone.style.opacity = '0.25'
        clone.style.borderRadius = '50%'
      }))
      setTimeout(() => {
        clone.parentNode?.removeChild(clone)
        done?.()
      }, 740)
    }

    // user pins — clicks always work, pause the demo 15s
    const figs = Array.from(root.querySelectorAll<HTMLElement>('.fph-fig'))
    figs.forEach((f, i) => f.setAttribute('data-idx', String(i)))
    let pauseUntil = 0
    const pauseDemo = () => { pauseUntil = Date.now() + 15000 }
    caseEl.addEventListener('pointerdown', pauseDemo)

    const pinHandlers: Array<{ el: Element; fn: (e: Event) => void }> = []
    root.querySelectorAll('.fph-pin-btn').forEach(btn => {
      const fn = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        pauseDemo()
        const fig = (btn as HTMLElement).closest<HTMLElement>('.fph-fig')
        if (!fig) return
        const idx = fig.getAttribute('data-idx') ?? ''
        if (fig.classList.contains('pinned')) {
          fig.classList.remove('pinned')
          removeFromTray(idx)
        } else {
          fig.classList.add('pinned')
          const img = fig.querySelector<HTMLImageElement>('.fph-mount img')
          if (img) flyToTray(fig, () => addToTray(img.src, idx))
        }
      }
      btn.addEventListener('click', fn)
      pinHandlers.push({ el: btn, fn })
    })

    // auto-pin demo loop (~every 4s, only while the case is on screen)
    let caseVisible = true
    let io: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => { caseVisible = es[0].isIntersecting }, { threshold: 0.25 })
      io.observe(caseEl)
    }
    function pickFig(): HTMLElement | null {
      for (let tries = 0; tries < 8; tries++) {
        const f = figs[Math.floor(Math.random() * figs.length)]
        if (!f || f.classList.contains('pinned') || f.classList.contains('demo')) continue
        const r = f.getBoundingClientRect()
        if (r.right < 0 || r.left > window.innerWidth || r.bottom < 0 || r.top > window.innerHeight) continue
        return f
      }
      return null
    }
    let demoTimer: ReturnType<typeof setInterval> | null = null
    if (!reduce && figs.length) {
      demoTimer = setInterval(() => {
        if (document.hidden || !caseVisible || Date.now() < pauseUntil) return
        const f = pickFig()
        if (!f) return
        f.classList.add('demo')
        const img = f.querySelector<HTMLImageElement>('.fph-mount img')
        if (img) flyToTray(f, () => addToTray(img.src, null))
        setTimeout(() => f.classList.remove('demo'), 1700)
      }, 4000)
    }

    return () => {
      if (fine) caseEl.removeEventListener('mousemove', onMove)
      caseEl.removeEventListener('pointerdown', pauseDemo)
      pinHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn))
      if (demoTimer) clearInterval(demoTimer)
      io?.disconnect()
      if (manualTimer) clearTimeout(manualTimer)
    }
  }, [])

  const half = Math.ceil(figures.length / 2)
  const rows = [figures.slice(0, half), figures.slice(half)].filter(r => r.length)

  return (
    <div ref={rootRef} className="fph-case-col">
      <div className="fph-case">
        <div className="fph-case-light" aria-hidden><i /></div>
        <div className="fph-case-sweep" aria-hidden />
        <div className="fph-case-label">{label ?? 'The Shelf — tap a pin to keep one'}</div>
        {/* Brass corner plates — Museum Night S2, purely decorative CSS,
            no motion, no layout, no LCP/CWV surface. */}
        <span className="fph-case-plate tl" aria-hidden />
        <span className="fph-case-plate tr" aria-hidden />
        <span className="fph-case-plate bl" aria-hidden />
        <span className="fph-case-plate br" aria-hidden />

        {rows.map((row, ri) => (
          <div className="fph-shelf" key={ri}>
            <div className="fph-shelf-row">
              {row.map((f, fi) => {
                // Global index across BOTH rows (row 1 continues where row 0
                // left off) — idx 0 is the LCP candidate (eager image below)
                // and is HARD-EXCLUDED from the curtain-rise mount animation
                // via this attribute; every other figure gets a staggered
                // rise, however many actually render.
                const globalIdx = ri === 0 ? fi : half + fi
                return (
                  <a className="fph-fig" href={f.href} key={f.fid} data-shelf-idx={globalIdx}>
                    <div className="fph-mount">
                      <button className="fph-pin-btn" aria-label={`Pin ${f.name} to your Vault`}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d={PIN_PATH} /></svg>
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.img}
                        alt={f.name}
                        loading={globalIdx === 0 ? 'eager' : 'lazy'}
                        fetchPriority={globalIdx === 0 ? 'high' : 'auto'}
                        decoding="async"
                      />
                    </div>
                    <div className="fph-fig-name">{f.name}</div>
                    <div className={`fph-fig-tag${f.sold ? ' sold' : ''}`}>{f.tag}</div>
                  </a>
                )
              })}
            </div>
          </div>
        ))}

        <div className="fph-tray" id="fph-tray-root">
          <svg className="fph-tray-pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={PIN_PATH} /></svg>
          <div className="fph-tray-thumbs" />
          <div className="fph-tray-text">Hover a figure and tap the pin &mdash; start a shelf of your own.</div>
          <a className="fph-tray-cta" href="/sign-up">Keep them &mdash; start your Vault &rarr;</a>
        </div>
      </div>
    </div>
  )
}
