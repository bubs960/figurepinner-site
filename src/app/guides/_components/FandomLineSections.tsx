/**
 * FandomLineSections — a fandom's lines as a COLLAPSED series accordion (the
 * proven Gate-3/R2 skeleton). Each line is a <details> collapsed by default; the
 * summary shows count + name + era + a compact stat (priced + price range), and
 * expanding reveals lore + grails + a link to the REAL distinct line page.
 * Content stays in the DOM even when collapsed (native <details> = crawlable), so
 * the long-tail SEO holds while the page stays compact.
 *
 * Templatized (S40, was MotuLineSections): the heading/sub, the per-line lore, the
 * KB path prefix, and the rarity-flag wording all come in as props from the theme,
 * so a new fandom reuses this verbatim. Line link = the canonical distinct line page
 * /<fandom>/<product_line> (e.g. /gi-joe/a-real-american-hero) — real 200, no ?query=.
 */

import type { Vault, HubFlagWording } from '../_data/fandomHubs'
import type { VaultLore } from '../_data/motuVaultLore'

function flagLabel(flag: string, fw: HubFlagWording): string {
  if (flag === 'VINTAGE') return fw.vintage ?? 'VINTAGE'
  if (flag === 'MOTUC') return fw.motuc ?? 'CLASSICS'
  if (flag === 'EXCLUSIVE') return fw.exclusive ?? 'EXCLUSIVE'
  if (flag === 'REISSUE') return fw.reissue ?? 'REISSUE'
  return ''
}

export default function FandomLineSections({
  vaults,
  lore,
  genre,
  title,
  sub,
  flag,
}: {
  vaults: Vault[]
  lore: Record<string, VaultLore>
  genre: string // KB fandom for the /<genre>/<line> route (may differ from the hub's theme id for line-scoped hubs, e.g. wrestling)
  title: string
  sub: string
  flag: HubFlagWording
}) {
  return (
    <section className="fh-lines" aria-labelledby="fh-lines-h">
      <div className="fh-lines-head">
        <h2 id="fh-lines-h" className="fh-lines-title">{title}</h2>
        <p className="fh-lines-sub">{sub}</p>
      </div>

      <div className="fh-lines-list">
        {vaults.map(v => {
          const l = lore[v.line] ?? { teaser: `${v.count} figures in the FigurePinner database.`, lore: '' }
          const lineHref = v.line_slug ? `/${genre}/${v.line_slug}` : null
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
                            {flagLabel(f.flag, flag) && <span className="fh-line-fig-flag">{flagLabel(f.flag, flag)}</span>}
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
