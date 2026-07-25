/**
 * /guides/[slug] — editorial guide articles (long-form original content).
 * SSG: prebuilds every article from ARTICLES at build time + ISR safety net.
 * This is the original written-content surface for SEO + AdSense value.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ARTICLES, type Article, type ArticleBlock } from '../_data/articles'
import { getHubTheme, loadTopComps, loadVaults, loadHeroesVillains } from '../_data/fandomHubs'
import FandomHub from '../_components/FandomHub'
import SiteHeader from '@/app/components/SiteHeader'
import AdSlot from '@/app/components/AdSlot'
import LiveMedian from '../_components/LiveMedian'
import CountdownTimer from '../_components/CountdownTimer'
import { fetchPriceSnaps, type PriceSnap } from '../_lib/priceSnaps'
import JsonLd from '@/app/_components/JsonLd'
import { getFigureById, prettyFigureUrl } from '@/data/kb'

// §0 canonical-link fix (2026-07-24): the `href` baked into every comp block in
// bidcheck-articles.ts is the non-canonical /figure/<fid> form. Resolve it from
// the fid at render time rather than regenerating the data — a generated URL
// artifact is exactly what went stale in figureIdToPrettyPath.generated.json.
// Falls back to the authored href if the fid no longer resolves in the KB.
function compHref(fid: string, authored: string | undefined): string | undefined {
  const kb = getFigureById(fid)
  return kb ? prettyFigureUrl(kb) : authored
}
import { buildEbaySearchUrl, EBAY_CAMPAIGN_ID, prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

const BASE = 'https://figurepinner.com'

export const revalidate = 86400 // articles change rarely

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

function getArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return { title: { absolute: 'Guide not found — FigurePinner' } }
  const canonical = `${BASE}/guides/${article.slug}`
  return {
    title: { absolute: article.metaTitle },
    description: article.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: canonical,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: article.metaTitle, description: article.metaDescription },
  }
}

// Inline link syntax: [[label|/path]] — used in article body text and ul items.
// renderText() parses this into styled <a> tags at render time.

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
      </a>
    )
    last = match.index + match[0].length
  }
  if (parts.length === 0) return text
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>)
  return <>{parts}</>
}

function Block({ block, comps, ebayUrls }: { block: ArticleBlock; comps: Map<string, PriceSnap>; ebayUrls: Map<string, string> }) {
  switch (block.type) {
    case 'comp':
      return (
        <LiveMedian
          snap={comps.get(block.fid)}
          label={block.label}
          sublabel={block.sublabel}
          href={compHref(block.fid, block.href)}
          ebayUrl={ebayUrls.get(block.fid)}
          figureId={block.fid}
        />
      )
    case 'h2':
      return (
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em', color: 'var(--fp-text)', margin: '2.5rem 0 1rem' }}>
          {block.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--fp-text)', margin: '1.75rem 0 0.75rem' }}>
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul style={{ margin: '0 0 1.25rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {block.items.map((it, i) => (
            <li key={i} style={{ fontSize: '1.02rem', color: 'var(--fp-muted)', lineHeight: 1.7 }}>{renderText(it)}</li>
          ))}
        </ul>
      )
    case 'countdown':
      return <CountdownTimer label={block.label} targetIso={block.targetIso} />
    case 'callout':
      return (
        <p style={{
          margin: '0 0 1.5rem', padding: '1rem 1.25rem',
          borderLeft: '3px solid var(--fp-accent-warm)', background: 'var(--fp-surface-1)',
          borderRadius: '0 var(--fp-radius) var(--fp-radius) 0',
          fontSize: '1rem', color: 'var(--fp-text)', lineHeight: 1.65, fontStyle: 'italic',
        }}>
          {renderText(block.text)}
        </p>
      )
    case 'p':
    default:
      return (
        <p style={{ fontSize: '1.05rem', color: 'var(--fp-muted)', lineHeight: 1.8, margin: '0 0 1.25rem' }}>
          {renderText(block.text)}
        </p>
      )
  }
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  // Culture-led themed hub for mapped `-hub` slugs; generic article render otherwise.
  const hubTheme = getHubTheme(slug)
  if (hubTheme) {
    const topComps = await loadTopComps(hubTheme.dataKey)
    const vaults = await loadVaults(hubTheme.dataKey)
    const heroesVillains = await loadHeroesVillains(hubTheme.dataKey)
    const moreGuides = ARTICLES
      .filter(a => a.slug !== slug)
      .sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
      .slice(0, 3)
      .map(a => ({ slug: a.slug, title: a.title, readingMinutes: a.readingMinutes }))
    return <FandomHub article={article} theme={hubTheme} topComps={topComps} vaults={vaults} heroesVillains={heroesVillains} moreGuides={moreGuides} />
  }

  // Live sold-median data for any `comp` blocks — one batched ISR-cached fetch.
  const compFids = article.body.flatMap((b) => (b.type === 'comp' ? [b.fid] : []))
  const comps = compFids.length ? await fetchPriceSnaps(compFids) : new Map<string, PriceSnap>()

  // eBay affiliate search URL per comp block — these guide pages had no direct
  // affiliate link before 2026-07-02 (ad units only); this is what a real
  // affiliate-vs-ad comparison needs to start collecting data against.
  const ebayUrls = new Map<string, string>()
  for (const fid of compFids) {
    const kb = getFigureById(fid)
    if (!kb) continue
    ebayUrls.set(fid, buildEbaySearchUrl(
      prettifySlug(kb.character_canonical),
      prettifySlug(kb.fandom),
      kb.manufacturer,
      kb.product_line,
      kb.release_wave,
      EBAY_CAMPAIGN_ID,
    ))
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    dateModified: article.updated,
    author: { '@type': 'Organization', name: 'FigurePinner' },
    publisher: { '@type': 'Organization', name: 'FigurePinner' },
    mainEntityOfPage: `${BASE}/guides/${article.slug}`,
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <JsonLd data={jsonLd} />

      <SiteHeader crumbs={[{ label: 'Guides', href: '/guides' }, { label: article.title }]} />

      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '3.5rem 1.25rem 5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--fp-accent-warm)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Collector Guide · {article.readingMinutes} min read
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', lineHeight: 1.1, letterSpacing: '0.01em', color: 'var(--fp-text)', margin: '0 0 1rem' }}>
          {article.title}
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--fp-muted)', lineHeight: 1.6, margin: '0 0 2.5rem', fontStyle: 'italic' }}>
          {article.dek}
        </p>

        {article.body.map((block, i) => <Block key={i} block={block} comps={comps} ebayUrls={ebayUrls} />)}

        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <AdSlot slot="adsterra-banner" />
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <a href="/search" style={{ display: 'inline-block', background: 'var(--blue)', color: '#fff', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
            Look up a figure&apos;s real value →
          </a>
        </div>

        <MoreGuides current={article.slug} />
      </article>
    </main>
  )
}

// Cross-links to keep readers in the guides funnel instead of dead-ending.
// Sort by most-recently updated so cross-links rotate as new articles ship.
function MoreGuides({ current }: { current: string }) {
  const others = ARTICLES
    .filter(a => a.slug !== current)
    .sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
    .slice(0, 3)
  if (!others.length) return null
  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
        More guides
      </div>
      <div style={{ display: 'grid', gap: '0.625rem' }}>
        {others.map(a => (
          <a key={a.slug} href={`/guides/${a.slug}`} style={{
            display: 'block', padding: '0.875rem 1rem',
            background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px',
            color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
          }}>
            {a.title}
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 400, marginTop: '0.25rem' }}>
              {a.readingMinutes} min read
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
