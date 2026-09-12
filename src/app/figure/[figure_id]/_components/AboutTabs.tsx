'use client'
// AboutTabs.tsx — Option C (2026-09-12, Claude Design handoff README §3):
// "The full story" / "Passport" tabs under the comps band. Every panel is in
// the DOM at all times (search engines, JSON-LD parity, the sign-in return
// replay inside FigureActions) and toggled with the `hidden` attribute, so a
// closed panel costs zero height. Below 768 px the same panels render as
// accordions (both closed by default) per the README phone order.
//
// `fp:open-tab` (CustomEvent, detail = tab id) opens a tab from elsewhere on
// the page -- HeroCtaRail's vault-full branch uses it before scrolling to
// #figure-actions, which lives inside the Passport panel.

import { useEffect, useState, type ReactNode } from 'react'

export interface AboutTab {
  id: string
  label: string
  /** Small muted suffix after the label, e.g. "3 of 12 verified". */
  meta?: string | null
  content: ReactNode
}

interface Props {
  tabs: AboutTab[]
  defaultTab?: string
}

export default function AboutTabs({ tabs, defaultTab }: Props) {
  const [active, setActive] = useState<string>(defaultTab ?? tabs[0]?.id ?? '')
  // Phone accordion state: which panels are open (none by default).
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsPhone(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (!tabs.some(t => t.id === id)) return
      setActive(id)
      setOpen(prev => new Set(prev).add(id))
    }
    document.addEventListener('fp:open-tab', onOpen)
    return () => document.removeEventListener('fp:open-tab', onOpen)
  }, [tabs])

  const isShown = (id: string) => (isPhone ? open.has(id) : active === id)

  return (
    <section className="fp-about-tabs" aria-label="About this figure">
      <style>{`
        .fp-about-tabs .fp-tab-btn {
          background: none; border: 0; padding: 10px 0; margin-right: 22px; cursor: pointer;
          font-family: var(--fp-font-body); font-size: 12px; font-weight: 500; letter-spacing: .18em;
          text-transform: uppercase; color: rgba(242,232,213,.65);
          border-bottom: 1px solid transparent;
        }
        .fp-about-tabs .fp-tab-btn[aria-selected="true"] { color: var(--shelf-gold-hi, #f5c462); border-bottom-color: var(--shelf-gold, #e0a83e); }
        .fp-about-tabs .fp-tab-btn:focus-visible { outline: 2px solid var(--shelf-gold, #e0a83e); outline-offset: 2px; }
        .fp-about-tabs .fp-tab-meta { margin-left: 8px; font-weight: 400; letter-spacing: .04em; text-transform: none; color: rgba(242,232,213,.65); }
        .fp-about-tabs .fp-tab-panel { padding-top: 18px; }
        .fp-about-tabs .fp-acc-btn { display: none; }
        @media (max-width: 767px) {
          .fp-about-tabs .fp-tablist { display: none; }
          .fp-about-tabs .fp-acc-btn {
            display: flex; width: 100%; justify-content: space-between; align-items: center;
            background: none; border: 0; border-top: 1px solid var(--shelf-line, rgba(242,232,213,.08));
            padding: 14px 0; cursor: pointer; text-align: left;
            font-family: var(--fp-font-body); font-size: 12px; font-weight: 500; letter-spacing: .18em;
            text-transform: uppercase; color: rgba(242,232,213,.65);
          }
          .fp-about-tabs .fp-acc-btn[aria-expanded="true"] { color: var(--shelf-gold-hi, #f5c462); }
          .fp-about-tabs .fp-tab-panel { padding-top: 4px; padding-bottom: 14px; }
        }
      `}</style>

      <div className="fp-tablist" role="tablist" style={{ borderBottom: '1px solid var(--shelf-line, rgba(242,232,213,.08))' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`fp-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`fp-panel-${t.id}`}
            className="fp-tab-btn"
            onClick={() => setActive(t.id)}
          >
            {t.label}
            {t.meta && <span className="fp-tab-meta">{t.meta}</span>}
          </button>
        ))}
      </div>

      {tabs.map(t => (
        <div key={t.id}>
          <button
            type="button"
            className="fp-acc-btn"
            aria-expanded={open.has(t.id)}
            aria-controls={`fp-panel-${t.id}`}
            onClick={() => setOpen(prev => { const n = new Set(prev); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n })}
          >
            <span>{t.label}{t.meta && <span className="fp-tab-meta">{t.meta}</span>}</span>
            <span aria-hidden>{open.has(t.id) ? '▴' : '▾'}</span>
          </button>
          <div
            id={`fp-panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`fp-tab-${t.id}`}
            className="fp-tab-panel"
            hidden={!isShown(t.id)}
          >
            {t.content}
          </div>
        </div>
      ))}
    </section>
  )
}
