'use client'

/**
 * PowerSwordVaults — the MOTU hub body as sealed "vaults", one per line.
 * Each vault shows a teaser + a Power Sword; drawing the sword (click) unseals it,
 * revealing the line's lore + its top figures (each → /figure/). This replaces the
 * wall-of-prose body: the reader expands only the lines they care about, and the
 * reveal is the iconic He-Man "I HAVE THE POWER" moment (Steve 6/20).
 *
 * Accessible: real <button>, aria-expanded, keyboard-operable. Reduced-motion users
 * get an instant reveal (animation is CSS-gated). First sword drawn powers up the page.
 */

import { useState } from 'react'

export type VaultFigure = { figure_id: string; name: string; price: number; sold_count: number; flag: string; url: string }
export type Vault = { line: string; count: number; priced_count: number; top: VaultFigure[] }
export type VaultLore = { teaser: string; lore: string; era?: string }

function PowerSword({ drawn }: { drawn: boolean }) {
  return (
    <svg className={`fh-sword-svg${drawn ? ' is-drawn' : ''}`} viewBox="0 0 24 80" width="20" height="56" aria-hidden="true" focusable="false">
      <rect x="10.5" y="6" width="3" height="46" rx="1.2" fill="currentColor" className="fh-sword-blade" />
      <rect x="6" y="52" width="12" height="3.4" rx="1.4" fill="currentColor" />
      <rect x="10.5" y="55" width="3" height="13" rx="1.2" fill="currentColor" />
      <circle cx="12" cy="70" r="3.2" fill="currentColor" />
      <path d="M12 3 L13.6 6 L10.4 6 Z" fill="currentColor" />
    </svg>
  )
}

export default function PowerSwordVaults({
  vaults,
  lore,
}: {
  vaults: Vault[]
  lore: Record<string, VaultLore>
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [powered, setPowered] = useState(false)

  function draw(line: string) {
    setOpen(o => ({ ...o, [line]: !o[line] }))
    if (!powered) setPowered(true)
  }

  return (
    <section className={`fh-vaults${powered ? ' is-powered' : ''}`} aria-label="Masters of the Universe lines">
      <div className="fh-vaults-head">
        <h2 className="fh-vaults-title">The ten lines of Eternia</h2>
        <p className="fh-vaults-sub">Each line is its own market. Draw the Power Sword to unseal its history and its grails.</p>
      </div>

      {vaults.map(v => {
        const l = lore[v.line] ?? { teaser: `${v.count} figures in the FigurePinner database.`, lore: '' }
        const isOpen = !!open[v.line]
        return (
          <div key={v.line} className={`fh-vault${isOpen ? ' is-open' : ''}`}>
            <button
              className="fh-vault-seal"
              aria-expanded={isOpen}
              onClick={() => draw(v.line)}
            >
              <span className="fh-vault-meta">
                <span className="fh-vault-line">{v.line}</span>
                <span className="fh-vault-era">{l.era ? `${l.era} · ` : ''}{v.count} figures</span>
                {!isOpen && <span className="fh-vault-teaser">{l.teaser}</span>}
              </span>
              <span className="fh-sword" aria-hidden="true">
                <PowerSword drawn={isOpen} />
                <span className="fh-sword-label">{isOpen ? 'SHEATHE' : 'DRAW THE SWORD'}</span>
              </span>
            </button>

            {isOpen && (
              <div className="fh-vault-body">
                {l.lore && <p className="fh-vault-lore">{l.lore}</p>}
                {v.top.length > 0 && (
                  <>
                    <div className="fh-vault-grails-label">Grails of this line</div>
                    <div className="fh-vault-chips">
                      {v.top.map(f => (
                        <a key={f.figure_id} href={f.url} className="fh-vault-chip">
                          <span className="fh-vault-chip-name">{f.name}</span>
                          <span className="fh-vault-chip-price">${f.price.toLocaleString('en-US')}<span className="fh-vault-chip-sold">{f.sold_count} sold</span></span>
                        </a>
                      ))}
                      <a href={`/masters-of-the-universe`} className="fh-vault-chip fh-vault-chip-all">
                        Browse all {v.count} {v.line} figures →
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
