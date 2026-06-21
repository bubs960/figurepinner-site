/**
 * MotuLineSections — the 10 MOTU lines as a COLLAPSED series accordion (Gate-3
 * revision R2). Each line is a <details> collapsed by default; the summary shows
 * count + name + era + a compact stat (priced + price range), and expanding
 * reveals lore + grails + a link to the REAL line page. Content stays in the DOM
 * even when collapsed (native <details> = crawlable), so the long-tail SEO holds
 * while the page stops being 10 always-open walls of content (Steve, S39h).
 *
 * R1 fix: the line link points at the canonical distinct line page
 * /<fandom>/<product_line> (e.g. /masters-of-the-universe/origins) — the old
 * /masters-of-the-universe?line=Origins was malformed + non-distinct. Server component.
 */

export type VaultFigure = { figure_id: string; name: string; price: number; sold_count: number; flag: string; image?: string | null; url: string }
export type Vault = { line: string; line_slug: string; count: number; priced_count: number; top: VaultFigure[] }
export type VaultLore = { teaser: string; lore: string; era?: string }

// Rarity flag → short collector label (real KB-derived flags; "" = no badge).
function flagLabel(flag: string): string {
  switch (flag) {
    case 'VINTAGE': return "VINTAGE '82"
    case 'MOTUC': return 'MOTUC'
    case 'EXCLUSIVE': return 'EXCLUSIVE'
    case 'REISSUE': return 'REISSUE'
    default: return ''
  }
}

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
        <p className="fh-lines-sub">Four decades of Eternia, line by line. Open a line for its history and grails.</p>
      </div>

      <div className="fh-lines-list">
        {vaults.map(v => {
          const l = lore[v.line] ?? { teaser: `${v.count} figures in the FigurePinner database.`, lore: '' }
          const lineHref = v.line_slug ? `/masters-of-the-universe/${v.line_slug}` : null
          const prices = v.top.map(f => f.price)
          const lo = prices.length ? Math.min(...prices) : 0
          const hi = prices.length ? Math.max(...prices) : 0
          return (
            <details key={v.line} className="fh-line">
              <summary className="fh-line-head">
                <span className="fh-line-count">{v.count}</span>
                <span className="fh-line-headtext">
                  <span className="fh-line-name">{v.line}</span>
                  <span className="fh-line-era">{l.era ?? 'figures'}</span>
                </span>
                <span className="fh-line-stat">
                  <span className="fh-line-stat-priced">{v.priced_count} priced</span>
                  {hi > 0 && <span className="fh-line-stat-range">{lo === hi ? `$${hi.toLocaleString('en-US')}` : `$${lo.toLocaleString('en-US')}–$${hi.toLocaleString('en-US')}`}</span>}
                </span>
                <span className="fh-line-chevron" aria-hidden="true" />
              </summary>

              <div className="fh-line-body">
                {l.teaser && <p className="fh-line-teaser">{l.teaser}</p>}
                {l.lore && <p className="fh-line-lore">{l.lore}</p>}

                {v.top.length > 0 && (
                  <>
                    <div className="fh-line-grails-label">Grails of this line</div>
                    <div className="fh-line-figs">
                      {v.top.map(f => (
                        <a key={f.figure_id} href={f.url} className="fh-line-fig">
                          <span className={`fh-line-fig-thumb${f.image ? '' : ' is-empty'}`}>
                            {f.image && <img src={f.image} alt="" width={48} height={48} loading="lazy" decoding="async" />}
                          </span>
                          <span className="fh-line-fig-text">
                            <span className="fh-line-fig-name">{f.name}</span>
                            <span className="fh-line-fig-price">
                              ${f.price.toLocaleString('en-US')}
                              <span className="fh-line-fig-sold">{f.sold_count} sold</span>
                            </span>
                            {flagLabel(f.flag) && <span className="fh-line-fig-flag">{flagLabel(f.flag)}</span>}
                          </span>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                {lineHref && (
                  <a href={lineHref} className="fh-line-all">View all {v.count} {v.line} figures →</a>
                )}
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
