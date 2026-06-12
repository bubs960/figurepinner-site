'use client'

/**
 * PriceReceipt — the homepage wow element: a sold-comp receipt rendered as a
 * holo chase card.
 *
 * Data is fetched server-side (homeReceipt.ts) — every number is real and
 * matches the figure page exactly. The card carries: spotlight figure photo,
 * median in odometer digits, P10–P90 range bar with one tick per recent comp,
 * confidence pips, honest spread badges, and attribution baked into the
 * footer so Discord screenshots carry the site name.
 *
 * Showpiece layer (all progressive enhancement, zero deps):
 *  - Pointer-tracked 3D tilt + holo foil sheen (CSS vars set from a single
 *    rAF-throttled pointermove on a STABLE wrapper — the hover target never
 *    moves out from under the pointer).
 *  - View Transitions API crossfade on chip swap where supported.
 *  - Odometer digits server-render AT their final value (resting transform);
 *    the entrance animation only adds the roll. JS failure = correct number.
 *  - Ambient float via the separate `translate` property so it composes with
 *    the tilt `transform` instead of fighting it.
 *  - prefers-reduced-motion kills all of it; values render instantly.
 */

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { ReceiptFigure } from '@/app/_lib/homeReceipt'

const CONFIDENCE_LABEL: Record<number, string> = {
  5: 'LOCKED IN',
  4: 'SOLID',
  3: 'DECENT',
  2: 'THIN',
  1: 'GRAIN OF SALT',
}

// Deliberately NOT figureFormatters.formatCurrency: that helper abbreviates
// >=$1000 as "$1.2k" and odometer reels can't roll a "k". Curated medians sit
// well under $1k; if one ever crosses it, swap the figure, not the format.
function fmtMoney(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`
}

function Odometer({ value }: { value: string }) {
  return (
    <span className="fpr-odo" role="img" aria-label={value}>
      {value.split('').map((ch, i) =>
        /[0-9]/.test(ch) ? (
          <span
            className="fpr-odo-cell"
            key={i}
            aria-hidden
            style={{ '--n': Number(ch), '--i': i } as React.CSSProperties}
          >
            <span className="fpr-odo-reel">
              {'0123456789'.split('').map(d => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : (
          <span className={ch === '.' ? 'fpr-odo-dot' : 'fpr-odo-sym'} key={i} aria-hidden>{ch}</span>
        )
      )}
    </span>
  )
}

export default function PriceReceipt({ figures }: { figures: ReceiptFigure[] }) {
  const [active, setActive] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const reducedRef = useRef<boolean | null>(null)

  if (figures.length < 2) return null
  const fig = figures[Math.min(active, figures.length - 1)]

  function prefersReduced(): boolean {
    if (reducedRef.current === null) {
      reducedRef.current = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return reducedRef.current
  }

  function swap(i: number) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
    if (doc.startViewTransition && !prefersReduced()) {
      doc.startViewTransition(() => flushSync(() => setActive(i)))
    } else {
      setActive(i)
    }
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || prefersReduced()) return
    const el = stageRef.current
    if (!el || rafRef.current !== null) return
    const { clientX, clientY } = e
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const rect = el.getBoundingClientRect()
      const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
      el.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
      el.style.setProperty('--foil', '1')
    })
  }

  function onLeave() {
    const el = stageRef.current
    if (!el) return
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--foil', '0')
  }

  return (
    <div className="fpr">
      <style>{`
        .fpr { width: 100%; max-width: 440px; margin: 0 auto; }
        .fpr-eyebrow {
          font-size: 0.68rem; font-weight: 900; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--green);
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        }
        .fpr-eyebrow::before {
          content: ''; width: 7px; height: 7px; border-radius: 50%;
          background: var(--green); box-shadow: 0 0 8px rgba(0,200,112,0.8);
        }
        .fpr-chips {
          display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;
        }
        @media (hover: none) {
          .fpr-chips {
            flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x proximity;
            -webkit-overflow-scrolling: touch; padding-bottom: 4px;
          }
          .fpr-chip { scroll-snap-align: start; }
        }
        .fpr-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 999px; cursor: pointer;
          border: 1px solid var(--border-hover); background: rgba(20,20,32,0.85);
          color: var(--text); font-size: 0.72rem; font-weight: 700;
          font-family: var(--font-ui); white-space: nowrap;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .fpr-chip:hover { border-color: rgba(0,102,255,0.6); transform: translateY(-1px); }
        .fpr-chip[aria-pressed="true"] {
          border-color: var(--blue); background: rgba(0,102,255,0.14);
          box-shadow: 0 0 0 1px var(--blue) inset;
        }
        .fpr-chip img {
          width: 22px; height: 22px; border-radius: 50%; object-fit: cover;
          background: #09090f;
        }
        /* Stable wrapper owns the pointer; the card inside does the moving. */
        .fpr-stage { perspective: 1000px; }
        .fpr-card {
          position: relative;
          background: #181B23;
          border: 1px solid var(--border-hover);
          border-top: 2px dashed rgba(255,255,255,0.18);
          border-radius: 4px 4px 14px 14px;
          padding: 18px 20px 16px;
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotate(-1.2deg);
          transform-style: preserve-3d;
          will-change: transform;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
          transition: transform 0.18s ease-out, box-shadow 0.25s ease;
          animation: fpr-card-in 0.45s ease both, fpr-float 7s ease-in-out 1.4s infinite;
          view-transition-name: fpr-card;
        }
        .fpr-stage:hover .fpr-card { box-shadow: 0 30px 70px rgba(0,0,0,0.62); }
        @keyframes fpr-card-in {
          from { opacity: 0; translate: 0 14px; }
        }
        /* Ambient float on the separate translate property — composes with the
           tilt transform instead of fighting it. */
        @keyframes fpr-float {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -6px; }
        }
        /* Holo foil — collector-palette sheen that follows the pointer.
           color-dodge on a dark surface shimmers without washing out text. */
        .fpr-foil {
          position: absolute; inset: -1px; border-radius: inherit;
          pointer-events: none; z-index: 1;
          background:
            radial-gradient(380px circle at var(--mx, 50%) var(--my, 40%), rgba(255,255,255,0.13), transparent 46%),
            repeating-conic-gradient(from 0deg at var(--mx, 50%) var(--my, 50%),
              rgba(0,200,112,0.07) 0deg, rgba(0,102,255,0.09) 70deg,
              rgba(255,184,0,0.06) 140deg, rgba(229,50,56,0.05) 210deg,
              rgba(0,200,112,0.07) 280deg);
          mix-blend-mode: color-dodge;
          opacity: var(--foil, 0);
          transition: opacity 0.35s ease;
        }
        .fpr-card > :not(.fpr-foil) { position: relative; z-index: 2; }
        .fpr-head {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; margin-bottom: 14px;
          border-bottom: 1px solid var(--border);
          font-size: 0.68rem; font-weight: 900; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--text);
        }
        .fpr-head-mark {
          width: 18px; height: 18px; border-radius: 4px; background: #e53238;
          color: #fff; display: inline-flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-size: 0.62rem; letter-spacing: 0;
        }
        .fpr-spotlight {
          position: relative; height: 168px; margin-bottom: 12px;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse 70% 85% at 50% 38%, rgba(0,102,255,0.16), rgba(9,9,15,0) 70%);
          border-radius: 10px;
        }
        .fpr-spotlight img {
          max-height: 160px; max-width: 78%; object-fit: contain;
          filter: drop-shadow(0 16px 22px rgba(0,0,0,0.6)) saturate(1.05);
        }
        .fpr-name {
          font-family: var(--font-display); text-transform: uppercase;
          font-size: 1.5rem; line-height: 1; color: #fff; letter-spacing: 0.01em;
        }
        .fpr-line { font-size: 0.74rem; color: rgba(238,238,245,0.72); margin-top: 3px; }
        .fpr-median-label {
          margin-top: 14px; font-size: 0.68rem; font-weight: 900;
          letter-spacing: 0.12em; color: rgba(238,238,245,0.65);
        }
        .fpr-median-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
        /* flex-end, not baseline: the digit cells are overflow-hidden boxes, so
           their synthesized baseline is the box bottom edge — mixing them with
           real-baseline glyphs ($ .) zigzags the number. Every child is a 1em
           line box at line-height 1, so bottom edges ARE the shared baseline. */
        .fpr-odo {
          display: inline-flex; align-items: flex-end;
          font-family: var(--font-display); font-size: 3.4rem; line-height: 1;
          color: var(--green); text-shadow: 0 0 22px rgba(0,200,112,0.4);
        }
        .fpr-odo-cell {
          display: inline-block; width: 0.52em; height: 1em;
          overflow: hidden; text-align: center;
        }
        .fpr-odo-reel {
          display: flex; flex-direction: column;
          transform: translateY(calc(var(--n) * -1em));
          animation: fpr-roll 0.9s cubic-bezier(0.22, 0.9, 0.3, 1) both;
          animation-delay: calc(var(--i) * 70ms);
        }
        .fpr-odo-reel span { height: 1em; line-height: 1; }
        @keyframes fpr-roll { from { transform: translateY(0); } }
        .fpr-odo-sym, .fpr-odo-dot {
          display: inline-block; height: 1em; line-height: 1;
          overflow: hidden; text-align: center;
        }
        .fpr-odo-sym { width: 0.5em; }
        .fpr-odo-dot { width: 0.28em; }
        .fpr-badge {
          display: inline-flex; padding: 4px 8px; border-radius: 999px;
          font-size: 0.7rem; font-weight: 900; letter-spacing: 0.1em;
        }
        .fpr-badge.tight { color: var(--green); border: 1px solid rgba(0,200,112,0.4); background: rgba(0,200,112,0.08); }
        .fpr-badge.wide { color: var(--yellow); border: 1px solid rgba(255,184,0,0.4); background: rgba(255,184,0,0.08); }
        .fpr-range { margin-top: 14px; }
        .fpr-range-label {
          font-size: 0.68rem; font-weight: 900; letter-spacing: 0.12em;
          color: rgba(238,238,245,0.65); margin-bottom: 6px;
        }
        .fpr-range-row { display: flex; align-items: center; gap: 10px; }
        .fpr-range-end {
          font-size: 0.78rem; font-weight: 800; color: var(--text); white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .fpr-range-track {
          position: relative; flex: 1; height: 14px; border-radius: 999px;
          background: rgba(255,255,255,0.06); overflow: hidden;
        }
        .fpr-range-fill {
          position: absolute; inset: 0; border-radius: 999px;
          background: linear-gradient(90deg, rgba(0,200,112,0.5), rgba(0,102,255,0.5));
          transform-origin: left; animation: fpr-grow 0.8s ease 0.15s both;
        }
        @keyframes fpr-grow { from { transform: scaleX(0); } }
        .fpr-tick {
          position: absolute; top: 2px; bottom: 2px; width: 2px;
          background: rgba(255,255,255,0.5); border-radius: 1px;
          animation: fpr-fade 0.4s ease 0.8s both;
        }
        @keyframes fpr-fade { from { opacity: 0; } }
        .fpr-meta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-top: 14px; flex-wrap: wrap;
        }
        .fpr-comps {
          font-size: 0.72rem; font-weight: 800; color: var(--text);
          border: 1px solid var(--border-hover); border-radius: 999px; padding: 4px 10px;
        }
        .fpr-conf { display: flex; align-items: center; gap: 7px; }
        .fpr-pips { display: flex; gap: 3px; }
        .fpr-pip {
          width: 14px; height: 6px; border-radius: 2px;
          background: rgba(255,255,255,0.1);
        }
        .fpr-pip.on { background: var(--yellow); box-shadow: 0 0 6px rgba(255,184,0,0.5); }
        .fpr-conf-label {
          font-size: 0.68rem; font-weight: 900; letter-spacing: 0.08em; color: var(--yellow);
        }
        .fpr-note {
          margin-top: 14px; padding: 10px 12px; border-radius: 8px;
          border: 1px dashed rgba(255,255,255,0.16); background: rgba(9,9,15,0.5);
          font-size: 0.76rem; line-height: 1.55; color: rgba(238,238,245,0.85);
          font-style: italic;
        }
        .fpr-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border);
        }
        .fpr-barcode {
          height: 22px; width: 96px; opacity: 0.55;
          background: repeating-linear-gradient(90deg,
            #eeeef5 0 2px, transparent 2px 5px,
            #eeeef5 5px 6px, transparent 6px 11px,
            #eeeef5 11px 14px, transparent 14px 17px);
        }
        .fpr-foot-tag {
          font-size: 0.62rem; font-weight: 900; letter-spacing: 0.12em;
          color: rgba(238,238,245,0.6); text-align: right; line-height: 1.5;
        }
        .fpr-cta {
          display: inline-block; margin-top: 12px; font-size: 0.82rem; font-weight: 800;
          color: var(--blue); text-decoration: none;
        }
        .fpr-cta:hover { color: #4d94ff; }
        @media (prefers-reduced-motion: reduce) {
          .fpr-card, .fpr-odo-reel, .fpr-range-fill, .fpr-tick { animation: none; }
          .fpr-card { transform: none; transition: none; }
          .fpr-foil { display: none; }
        }
        @media (max-width: 560px) {
          .fpr-odo { font-size: 2.9rem; }
          .fpr-spotlight { height: 140px; }
          .fpr-spotlight img { max-height: 132px; }
        }
      `}</style>

      <div className="fpr-eyebrow">Real comps · checked hourly</div>

      <div className="fpr-chips" role="group" aria-label="Pick a figure to price-check">
        {figures.map((f, i) => (
          <button
            key={f.fid}
            type="button"
            className="fpr-chip"
            aria-pressed={i === active}
            onClick={() => swap(i)}
          >
            {f.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.image} alt="" width={22} height={22} loading="lazy" />
            )}
            {f.chipLabel}
          </button>
        ))}
      </div>

      <div
        className="fpr-stage"
        ref={stageRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <article className="fpr-card" key={fig.fid} aria-label={`Sold-price receipt for ${fig.name}`}>
          <div className="fpr-foil" aria-hidden />

          <div className="fpr-head">
            <span className="fpr-head-mark">FP</span>
            FigurePinner · Sold Receipt
          </div>

          <div className="fpr-spotlight">
            {fig.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fig.image} alt={fig.name} fetchPriority="high" />
            )}
          </div>

          <div className="fpr-name">{fig.name}</div>
          <div className="fpr-line">{fig.line} · {fig.genre}</div>

          <div className="fpr-median-label">MEDIAN SOLD</div>
          <div className="fpr-median-row">
            <Odometer value={fmtMoney(fig.median)} />
            {fig.spread === 'tight' && <span className="fpr-badge tight">TIGHT RANGE</span>}
            {fig.spread === 'wide' && (
              <span className="fpr-badge wide" title="Solds vary widely on this one. Read the comps before you bid.">
                HIGH SPREAD · READ THE COMPS
              </span>
            )}
          </div>

          <div className="fpr-range">
            <div className="fpr-range-label">SOLD RANGE · P10–P90</div>
            <div className="fpr-range-row">
              <span className="fpr-range-end">{fmtMoney(fig.p10)}</span>
              <div className="fpr-range-track" aria-hidden>
                <div className="fpr-range-fill" />
                {fig.ticks.map((t, i) => (
                  // calc keeps the t=1 tick inside the overflow clip box
                  <span className="fpr-tick" style={{ left: `calc(${t * 100}% - ${t * 2}px)` }} key={i} />
                ))}
              </div>
              <span className="fpr-range-end">{fmtMoney(fig.p90)}</span>
            </div>
          </div>

          <div className="fpr-meta">
            <span className="fpr-comps">{fig.compCount} SOLDS</span>
            <span className="fpr-conf" title={`Confidence ${fig.confidence} of 5 — comp depth, capped when spread runs high`}>
              <span className="fpr-pips" aria-hidden>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} className={`fpr-pip${n <= fig.confidence ? ' on' : ''}`} />
                ))}
              </span>
              <span className="fpr-conf-label">{CONFIDENCE_LABEL[fig.confidence]}</span>
            </span>
          </div>

          {fig.fieldNote && <div className="fpr-note">{fig.fieldNote}</div>}

          <div className="fpr-foot">
            <div className="fpr-barcode" aria-hidden />
            <div className="fpr-foot-tag">
              COMPS, NOT ASKING PRICES<br />FIGUREPINNER.COM
            </div>
          </div>

          <a className="fpr-cta" href={fig.href}>See every sold →</a>
        </article>
      </div>
    </div>
  )
}
