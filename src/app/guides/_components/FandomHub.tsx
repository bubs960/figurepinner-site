/**
 * FandomHub — culture-led, themed price-intel hub for one fandom.
 *
 * Hierarchy (Steve 6/20: culture drives the hub, not the price):
 *   1. Themed hero — you're IN the fandom world. Kicker + title + lore lead + figure-search.
 *   2. Intel comp table — "what's hot now", fandom-voiced, every row → figure page (the funnel).
 *   3. Editorial body — the long-form culture/value content (from the Article in articles.ts).
 *   4. CTA + further reading.
 *
 * Theming: a [data-fandom="x"] wrapper scopes a CSS-var palette + motif (globals.css).
 * No raster art above the fold (perf/LCP). All motion is reduced-motion-gated in CSS.
 * Voice pack supplies every chrome string — no generic UI copy in a themed hub.
 *
 * Intel table degrades gracefully: if the nightly precompute hasn't produced data,
 * we show the voiced empty-state + search instead of a broken/empty table.
 */

import type { Article, ArticleBlock } from '../_data/articles'
import type { HubTheme, TopCompPayload, VaultPayload } from '../_data/fandomHubs'
import SiteHeader from '@/app/components/SiteHeader'
import AdSlot from '@/app/components/AdSlot'
import FandomHubInteractive from './FandomHubInteractive'
import { MOTU_VAULT_LORE } from '../_data/motuVaultLore'
import PowerSwordVaults from './PowerSwordVaults'

function renderText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = /\[\[(.+?)\|(.+?)\]\]/g
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={`t${match.index}`}>{text.slice(last, match.index)}</span>)
    parts.push(
      <a key={`a${match.index}`} href={match[2]} style={{ color: 'var(--fp-accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
        {match[1]}
      </a>,
    )
    last = match.index + match[0].length
  }
  if (parts.length === 0) return text
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>)
  return <>{parts}</>
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="fh-h2">{block.text}</h2>
    case 'h3':
      return <h3 className="fh-h3">{block.text}</h3>
    case 'ul':
      return (
        <ul className="fh-ul">
          {block.items.map((it, i) => <li key={i}>{renderText(it)}</li>)}
        </ul>
      )
    case 'callout':
      return <p className="fh-callout">{renderText(block.text)}</p>
    case 'p':
    default:
      return <p className="fh-p">{renderText(block.text)}</p>
  }
}

function flagLabel(flag: string, theme: HubTheme): string {
  const v = theme.voice.flag
  if (flag === 'VINTAGE') return v.vintage ?? 'VINTAGE'
  if (flag === 'MOTUC') return v.motuc ?? 'CLASSICS'
  if (flag === 'EXCLUSIVE') return v.exclusive ?? 'EXCLUSIVE'
  if (flag === 'REISSUE') return v.reissue ?? 'REISSUE'
  return ''
}

function IntelTable({ data, theme }: { data: TopCompPayload | null; theme: HubTheme }) {
  const v = theme.voice
  return (
    <section className="fh-intel" aria-labelledby="fh-intel-h">
      <div className="fh-intel-head">
        <h2 id="fh-intel-h" className="fh-intel-title">{v.intelHeader}</h2>
        <p className="fh-intel-sub">{v.intelSub}</p>
      </div>
      {data && data.figures.length > 0 ? (
        <>
          <ol className="fh-intel-list">
            {data.figures.map((f, i) => (
              <li key={f.figure_id} className="fh-intel-row">
                <a href={f.url} className="fh-intel-link">
                  <span className="fh-intel-rank" aria-hidden="true">{i + 1}</span>
                  <span className="fh-intel-name">
                    {f.name}
                    <span className="fh-intel-line">{f.line}</span>
                  </span>
                  {flagLabel(f.flag, theme) && <span className="fh-intel-flag">{flagLabel(f.flag, theme)}</span>}
                  <span className="fh-intel-price">
                    ${f.price.toLocaleString('en-US')}
                    {f.last_sold && <span className="fh-intel-date">{f.last_sold}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <p className="fh-intel-foot">
            Updated {new Date(data.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · real eBay sold comps
          </p>
        </>
      ) : (
        <p className="fh-intel-empty">{v.emptyState}</p>
      )}
    </section>
  )
}

export default function FandomHub({
  article,
  theme,
  topComps,
  vaults,
  moreGuides,
}: {
  article: Article
  theme: HubTheme
  topComps: TopCompPayload | null
  vaults: VaultPayload | null
  moreGuides: { slug: string; title: string; readingMinutes: number }[]
}) {
  const v = theme.voice

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    dateModified: article.updated,
    author: { '@type': 'Organization', name: 'FigurePinner' },
    publisher: { '@type': 'Organization', name: 'FigurePinner' },
    mainEntityOfPage: `https://figurepinner.com/guides/${article.slug}`,
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guides', item: 'https://figurepinner.com/guides' },
      { '@type': 'ListItem', position: 2, name: article.title, item: `https://figurepinner.com/guides/${article.slug}` },
    ],
  }

  return (
    <main data-fandom={theme.fandom} className="fh-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <SiteHeader crumbs={[{ label: 'Guides', href: '/guides' }, { label: article.title }]} />

      <section className="fh-hero">
        <div className="fh-hero-inner">
          <div className="fh-kicker">{v.kicker}</div>
          <h1 className="fh-title">{article.title}</h1>
          <p className="fh-lead">{v.heroLead}</p>
          <form action="/search" method="get" className="fh-search" role="search">
            <input
              type="search"
              name="q"
              className="fh-search-input"
              placeholder={v.searchPlaceholder}
              aria-label={v.searchPlaceholder}
            />
            <button type="submit" className="fh-search-btn">{v.ctaLabel}</button>
          </form>
        </div>
      </section>

      <article className="fh-body">
        {topComps && topComps.figures.length > 0 ? (
          <FandomHubInteractive
            figures={topComps.figures}
            generatedAt={topComps.generated_at}
            voice={{
              intelHeader: theme.voice.intelHeader,
              intelSub: theme.voice.intelSub,
              emptyState: theme.voice.emptyState,
              searchPlaceholder: theme.voice.searchPlaceholder,
              ctaLabel: theme.voice.ctaLabel,
              flag: theme.voice.flag,
            }}
          />
        ) : (
          <IntelTable data={topComps} theme={theme} />
        )}

        <div className="fh-ad"><AdSlot slot="leaderboard" /></div>

        {article.body.slice(0, 2).map((block, i) => <Block key={i} block={block} />)}

        {vaults && vaults.vaults.length > 0 ? (
          <PowerSwordVaults vaults={vaults.vaults} lore={MOTU_VAULT_LORE} />
        ) : (
          article.body.slice(2).map((block, i) => <Block key={i + 2} block={block} />)
        )}

        <div className="fh-cta-wrap">
          <a href="/search" className="fh-cta">{v.ctaLabel}</a>
        </div>

        {moreGuides.length > 0 && (
          <div className="fh-more">
            <div className="fh-more-label">More guides</div>
            <div className="fh-more-grid">
              {moreGuides.map(g => (
                <a key={g.slug} href={`/guides/${g.slug}`} className="fh-more-card">
                  {g.title}
                  <span className="fh-more-min">{g.readingMinutes} min read</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  )
}
