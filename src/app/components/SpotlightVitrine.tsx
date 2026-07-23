'use client'
// SpotlightVitrine.tsx — Room IV's "pin this one first" showstopper (approved
// design: claude.ai/design 441e2cb9 "Homepage Vitrine Showstopper", Steve
// 2026-07-23). A museum display case that sits dark until scrolled into
// view, flickers its case light on, warm-lights the figure photo, then
// slides a placard up with the real median-sold price. A small dial
// relights it on demand; fine pointers get a gentle hover tilt.
//
// Deliberate divergence from the approved mockup: its price pill read
// "In stock — $35 loose" (store language). This page's standing honesty
// rule is median-of-real-solds wording, so the placard keeps the same
// copy the VitrineCard it replaces used. Approved tweaks kept: 6-stop
// beam gradient, enlarged placard text (name 34px / meta 13px / pill 14px).
//
// Motion is transform/opacity/filter only. prefers-reduced-motion skips
// the sequence entirely and renders the fully-lit end state.
//
// Progressive enhancement: the SERVER-RENDERED state is fully lit — the
// dark "waiting for the spotlight" state only applies after the mount
// effect adds `.armed` (verified 2026-07-23: in a hidden/unhydrated tab
// NO client island on this page runs, so a dark-by-default design would
// have left the closer pick permanently unreadable without JS).

import { useEffect, useRef } from 'react'
import type { ReceiptFigure } from '../_lib/homeReceipt'

export default function SpotlightVitrine({ f }: { f: ReceiptFigure }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      // never arm — stay in the server-rendered fully-lit static state
      return
    }
    // Arm the dark state only once JS is definitely running — an
    // unhydrated/no-JS render stays fully lit and readable.
    root.classList.add('armed')

    let settleTimer: ReturnType<typeof setTimeout> | null = null
    const light = () => {
      root.classList.remove('lit', 'settled')
      // restart CSS animations
      void root.offsetWidth
      root.classList.add('lit')
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => root.classList.add('settled'), 1500)
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          light()
          io.unobserve(en.target)
        }
      })
    }, { threshold: 0.35 })
    io.observe(root)

    const dial = root.querySelector<HTMLButtonElement>('.fph-sv-dial')
    const onDial = () => light()
    dial?.addEventListener('click', onDial)

    // hover tilt — fine pointers only, ±4deg, transform-only
    const frame = root.querySelector<HTMLElement>('.fph-sv-frame')
    const fine = window.matchMedia('(pointer:fine)').matches
    const onMove = (e: MouseEvent) => {
      if (!frame) return
      const r = frame.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      frame.style.setProperty('--rx', `${(-ny * 4).toFixed(2)}deg`)
      frame.style.setProperty('--ry', `${(nx * 4).toFixed(2)}deg`)
    }
    const onLeave = () => {
      frame?.style.setProperty('--rx', '0deg')
      frame?.style.setProperty('--ry', '0deg')
    }
    if (fine && frame) {
      frame.addEventListener('mousemove', onMove)
      frame.addEventListener('mouseleave', onLeave)
    }

    return () => {
      io.disconnect()
      dial?.removeEventListener('click', onDial)
      if (fine && frame) {
        frame.removeEventListener('mousemove', onMove)
        frame.removeEventListener('mouseleave', onLeave)
      }
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [])

  return (
    <div className="fph-sv" ref={rootRef}>
      <style>{`
        .fph-sv { position: relative; }
        .fph-sv-frame {
          --rx: 0deg; --ry: 0deg;
          position: relative; overflow: hidden; display: block;
          border: 1px solid rgba(242,232,213,.14); border-radius: 14px;
          background: linear-gradient(180deg, #101018 0%, #0a0a11 100%);
          padding: 30px 30px 26px;
          transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
          transition: transform .25s ease, border-color .3s ease;
          text-decoration: none; color: inherit;
        }
        .fph-sv-frame:hover { border-color: rgba(224,168,62,.35); }

        /* beam — 6-stop gradient cone (approved tweak: soft falloff) */
        .fph-sv-beam {
          position: absolute; top: -8%; left: 50%; transform: translateX(-50%);
          width: 78%; height: 88%; pointer-events: none;
          background: radial-gradient(ellipse 52% 100% at 50% 0%,
            rgba(255,214,140,.34) 0%,
            rgba(255,206,124,.22) 22%,
            rgba(250,196,110,.13) 42%,
            rgba(240,184,96,.07) 62%,
            rgba(230,172,84,.03) 80%,
            transparent 100%);
          opacity: 1; /* server-rendered/no-JS default: lit */
        }
        .fph-sv.armed .fph-sv-beam { opacity: 0; }
        .fph-sv.armed.lit .fph-sv-beam { animation: fphSvFlicker 1.15s ease-out forwards; }
        .fph-sv.armed.settled .fph-sv-beam { animation: none; opacity: 1; }
        @keyframes fphSvFlicker {
          0% { opacity: 0; } 12% { opacity: .45; } 20% { opacity: .08; }
          34% { opacity: .85; } 46% { opacity: .55; } 62% { opacity: .95; }
          100% { opacity: 1; }
        }

        .fph-sv-imgwrap {
          position: relative; display: flex; justify-content: center;
          padding: 26px 0 20px;
        }
        .fph-sv-img {
          width: min(240px, 62%); height: auto; border-radius: 8px;
          filter: brightness(1.02) saturate(1.05) contrast(1.02); /* lit default */
          transition: filter 1.1s ease .25s;
        }
        .fph-sv.armed:not(.lit):not(.settled) .fph-sv-img {
          filter: brightness(.16) saturate(.4);
        }

        /* glass sweep — one diagonal highlight pass as the light lands */
        .fph-sv-sweep {
          position: absolute; inset: 0; pointer-events: none; opacity: 0;
          background: linear-gradient(115deg, transparent 42%, rgba(255,246,224,.10) 50%, transparent 58%);
          transform: translateX(-70%);
        }
        .fph-sv.armed.lit .fph-sv-sweep { animation: fphSvSweep 1.3s ease-out .75s forwards; }
        @keyframes fphSvSweep {
          0% { opacity: 0; transform: translateX(-70%); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translateX(70%); }
        }

        /* dust motes — 3 tiny drifting points, only animate while lit */
        .fph-sv-mote {
          position: absolute; width: 3px; height: 3px; border-radius: 50%;
          background: rgba(255,226,168,.5); opacity: 0; pointer-events: none;
        }
        .fph-sv.armed.lit .fph-sv-mote, .fph-sv.armed.settled .fph-sv-mote { animation: fphSvMote 7s linear infinite; }
        .fph-sv-mote:nth-child(1) { left: 38%; top: 24%; animation-delay: .9s !important; }
        .fph-sv-mote:nth-child(2) { left: 55%; top: 16%; animation-delay: 2.4s !important; }
        .fph-sv-mote:nth-child(3) { left: 47%; top: 34%; animation-delay: 4.2s !important; }
        @keyframes fphSvMote {
          0% { opacity: 0; transform: translateY(0); }
          12% { opacity: .8; }
          88% { opacity: .25; }
          100% { opacity: 0; transform: translateY(30px); }
        }

        /* placard — slides up after the light lands (approved text sizes) */
        .fph-sv-placard { position: relative; opacity: 1; transform: none; transition: opacity .7s ease .95s, transform .7s cubic-bezier(.22,.61,.36,1) .95s; }
        .fph-sv.armed:not(.lit):not(.settled) .fph-sv-placard { opacity: 0; transform: translateY(18px); }
        .fph-sv-name {
          font-family: var(--font-display, inherit);
          font-size: 34px; line-height: 1.08; letter-spacing: .01em;
          color: var(--fph-gold, #e0a83e); font-weight: 700;
          text-transform: uppercase;
        }
        .fph-sv-meta {
          margin-top: 7px; font-size: 13px; letter-spacing: .14em;
          text-transform: uppercase; color: rgba(242,232,213,.62);
        }
        .fph-sv-pill {
          display: inline-block; margin-top: 14px; padding: 8px 16px;
          border: 1px solid rgba(224,168,62,.4); border-radius: 999px;
          font-size: 14px; color: #f2e8d5; background: rgba(224,168,62,.10);
        }
        .fph-sv-pill strong { color: var(--fph-gold, #e0a83e); }

        /* relight dial — sibling of the anchor, never nested inside it */
        .fph-sv-dial {
          position: absolute; right: 14px; bottom: 14px; z-index: 2;
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid rgba(242,232,213,.22);
          background: rgba(16,16,24,.85); color: rgba(242,232,213,.72);
          font-size: 15px; line-height: 1; cursor: pointer;
          transition: color .2s ease, border-color .2s ease;
        }
        .fph-sv-dial:hover { color: var(--fph-gold, #e0a83e); border-color: rgba(224,168,62,.5); }
        /* no JS (or reduced motion) → sequence can't run → no dead button */
        .fph-sv:not(.armed) .fph-sv-dial { display: none; }

        @media (prefers-reduced-motion: reduce) {
          .fph-sv-beam, .fph-sv-img, .fph-sv-placard { transition: none !important; animation: none !important; }
          .fph-sv-mote, .fph-sv-sweep { display: none; }
        }
        @media (max-width: 720px) {
          .fph-sv-frame { padding: 22px 20px 20px; }
          .fph-sv-name { font-size: 27px; }
        }
      `}</style>

      <a className="fph-sv-frame" href={f.href}>
        <span className="fph-sv-beam" aria-hidden />
        <span className="fph-sv-sweep" aria-hidden />
        <span className="fph-sv-mote" aria-hidden />
        <span className="fph-sv-mote" aria-hidden />
        <span className="fph-sv-mote" aria-hidden />
        <div className="fph-sv-imgwrap">
          {f.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="fph-sv-img" src={f.image} alt={f.name} loading="lazy" decoding="async" />
          )}
        </div>
        <div className="fph-sv-placard">
          <div className="fph-sv-name">{f.name}</div>
          <div className="fph-sv-meta">{f.line}</div>
          <span className="fph-sv-pill">
            Median real sale: <strong>${f.median.toFixed(2)}</strong> &middot; {f.compCount} real solds tracked
          </span>
        </div>
      </a>
      <button className="fph-sv-dial" type="button" aria-label="Replay the case light">&#9728;</button>
    </div>
  )
}
