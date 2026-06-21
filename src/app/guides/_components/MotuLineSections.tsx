/**
 * MotuLineSections — the 10 MOTU lines as ALWAYS-OPEN, SSR'd content sections
 * (Gate 3). Replaces the old click-to-draw PowerSwordVaults: no "draw the sword"
 * gate, no flat sword icon (Steve: icon-crap — kill it). Every section's lore +
 * grails render into the DOM at build time so they're crawlable, and the long
 * tail is deep-linked: each line name → its filtered line page, every grail →
 * /figure/[id] (the persona-audit #1 fix). Grails render with real R2 photos
 * (canonical_image_url, our CDN), dot-placeholder only when truly missing.
 *
 * Server component (no client JS) — the body is pure content now; the page's
 * only motion lives in the hero (scroll-rise).
 */

export type VaultFigure = { figure_id: string; name: string; price: number; sold_count: number; flag: string; image?: string | null; url: string }
export type Vault = { line: string; count: number; priced_count: number; top: VaultFigure[] }
export type VaultLore = { teaser: string; lore: string; era?: string }

export default function MotuLineSections({
  vaults,
  lore,
}: {
  vaults: Vault[]
  lore: Record<string, VaultLore>
}) {
  return (
    <section className="fh-lines" aria-labelledby="fh-lines-h">
      <div className="fh-lines-head">
        <h2 id="fh-lines-h" className="fh-lines-title">The ten lines of Eternia</h2>
        <p className="fh-lines-sub">Each line is its own market — four decades of Eternia, line by line, with its grails.</p>
      </div>

      <div className="fh-lines-list">
        {vaults.map(v => {
          const l = lore[v.line] ?? { teaser: `${v.count} figures in the FigurePinner database.`, lore: '' }
          const lineHref = `/masters-of-the-universe?line=${encodeURIComponent(v.line)}`
          return (
            <article key={v.line} className="fh-line">
              <header className="fh-line-head">
                <span className="fh-line-count">{v.count}</span>
                <div className="fh-line-headtext">
                  <h3 className="fh-line-name">
                    <a href={lineHref}>{v.line}</a>
                  </h3>
                  <span className="fh-line-era">{l.era ?? 'figures'}</span>
                </div>
              </header>

              {l.teaser && <p className="fh-line-teaser">{l.teaser}</p>}
              {l.lore && <p className="fh-line-lore">{l.lore}</p>}

              {v.top.length > 0 && (
                <>
                  <div className="fh-line-grails-label">Grails of this line</div>
                  <div className="fh-line-figs">
                    {v.top.map(f => (
                      <a key={f.figure_id} href={f.url} className="fh-line-fig">
                        <span className={`fh-line-fig-thumb${f.image ? '' : ' is-empty'}`}>
                          {f.image && <img src={f.image} alt="" loading="lazy" decoding="async" />}
                        </span>
                        <span className="fh-line-fig-text">
                          <span className="fh-line-fig-name">{f.name}</span>
                          <span className="fh-line-fig-price">
                            ${f.price.toLocaleString('en-US')}
                            <span className="fh-line-fig-sold">{f.sold_count} sold</span>
                          </span>
                        </span>
                      </a>
                    ))}
                    <a href={lineHref} className="fh-line-all">
                      Browse all {v.count} {v.line} figures →
                    </a>
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
