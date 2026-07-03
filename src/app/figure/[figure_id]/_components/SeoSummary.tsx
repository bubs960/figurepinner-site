/**
 * SeoSummary — natural language price summary paragraph.
 *
 * Target: Google featured snippets for "[figure name] worth" / "[figure name] value" queries.
 * Every figure page gets 40–80 words of unique crawlable text.
 *
 * Placement: Between MarketPanel and the Zone 6 RelatedRow.
 * Server component — zero JS shipped.
 */

import { formatCurrency } from '../_lib/figureFormatters'

/** Line-level retail price defaults (Option B: hardcoded until KB carries retail_price). */
export const LINE_RETAIL_PRICE: Record<string, number> = {
  // Mattel WWE
  'elite':                    34.99,
  'basic':                    19.99,
  'ultimate-edition':         49.99,
  'defining-moments':         34.99,
  'entrance-greats':          24.99,
  'legends':                  34.99,
  'retro':                    24.99,
  'wwe-hall-of-fame':         34.99,
  'wwe-championship-showdown': 39.99,
  // Jakks
  'deluxe-aggression':        19.99,
  'ruthless-aggression':      12.99,
  'classic-superstars':       14.99,
  'best-of-the-best':         14.99,
  'pay-per-view':             19.99,
  'survivor-series':          19.99,
  'summer-slam':              19.99,
  'wrestlemania':             19.99,
  'two-tuff':                 14.99,
  'off-the-ropes':            12.99,
  // Hasbro
  'hasbro-wwf':               9.99,
  'wwf-hasbro':               9.99,
  // AEW
  'aew-unrivaled':            22.99,
  // Marvel Legends
  'marvel-legends':           24.99,
  'toybiz-marvel-legends':    19.99,
  // Star Wars
  'black-series':             24.99,
  'vintage-collection':       16.99,
  'power-of-the-force':       9.99,
  // Transformers
  'masterpiece':              99.99,
  'studio-series':            34.99,
  'generations':              24.99,
  // G.I. Joe
  'classified-series':        24.99,
  'a-real-american-hero':     7.99,
  // MOTU
  'masterverse':              22.99,
  'origins':                  17.99,
  'masters-of-the-universe-classics': 29.99,
  // TMNT
  'ultimates':                54.99,
  'classic-collection':       24.99,
  // MAFEX / McFarlane
  'mafex':                    89.99,
  'mcfarlane-dc':             19.99,
  'mcfarlane-wwe':            19.99,
  // Generic fallback keys
  'dc-multiverse':            19.99,
  'spawn':                    14.99,
}

/**
 * Compute sales velocity from soldHistory dates.
 * Returns null when there are fewer than 3 comps or less than 7 days of range.
 */
function salesVelocity(
  soldHistory: Array<{ sold_date: string }>
): string | null {
  if (!soldHistory?.length || soldHistory.length < 3) return null
  const dates = soldHistory
    .map(s => new Date(s.sold_date).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b)
  if (dates.length < 3) return null
  const rangeMs = dates[dates.length - 1] - dates[0]
  const rangeDays = rangeMs / (1000 * 60 * 60 * 24)
  if (rangeDays < 7) return null
  const salesPerDay = soldHistory.length / rangeDays
  if (salesPerDay >= 1) return `~${Math.round(salesPerDay)} sale${Math.round(salesPerDay) === 1 ? '' : 's'}/day`
  if (salesPerDay >= 0.14) return `~${Math.round(salesPerDay * 7)} sale${Math.round(salesPerDay * 7) === 1 ? '' : 's'}/week`
  const perMonth = Math.round(salesPerDay * 30)
  if (perMonth < 1) return null
  return `~${perMonth} sale${perMonth === 1 ? '' : 's'}/month`
}

interface SeoSummaryProps {
  displayName:  string
  brand:        string
  line:         string
  productLine:  string   // raw slug for retail price lookup
  seriesNum:    number | null
  scale:        string | null
  exclusiveTo:  string | null
  soldCount:    number
  median:       number | null
  /** True when `median` is actually the average (snapshot had no median_sold). */
  medianIsAvg?: boolean
  trendPct:     number | null
  soldHistory:  Array<{ sold_date: string }>
}

export default function SeoSummary({
  displayName,
  brand,
  line,
  productLine,
  seriesNum,
  scale,
  exclusiveTo,
  soldCount,
  median,
  medianIsAvg,
  trendPct,
  soldHistory,
}: SeoSummaryProps) {
  const retailPrice = LINE_RETAIL_PRICE[productLine] ?? null
  const velocity    = salesVelocity(soldHistory)

  // Build sentence fragments
  const scaleStr   = scale ? `${scale} ` : ''
  const seriesStr  = seriesNum ? `, Series ${seriesNum}` : ''

  // Price sentence
  let priceSentence: string
  if (soldCount >= 3 && median != null) {
    priceSentence = `Based on ${soldCount} recent eBay sold listings, it currently sells for ${medianIsAvg ? 'an average' : 'a median'} of ${formatCurrency(median)}.`
  } else if (soldCount > 0) {
    priceSentence = `Pricing data is limited (${soldCount} comp${soldCount === 1 ? '' : 's'}) — check eBay for the most current market value.`
  } else {
    priceSentence = 'No recent eBay sales data is available — check eBay for current pricing.'
  }

  // Trend sentence
  let trendSentence = ''
  if (trendPct != null && Math.abs(trendPct) >= 5) {
    if (trendPct > 0) {
      trendSentence = ` Values have been trending up ${Math.round(trendPct)}% recently.`
    } else {
      trendSentence = ` Values have declined ${Math.round(Math.abs(trendPct))}% recently.`
    }
  }

  // Exclusive sentence
  const exclusiveSentence = exclusiveTo
    ? ` This figure is a ${exclusiveTo} exclusive, which may affect availability and market price.`
    : ''

  const summaryText =
    `The ${displayName} is a ${scaleStr}action figure by ${brand} in the ${line} line${seriesStr}. ` +
    priceSentence +
    trendSentence +
    exclusiveSentence

  // Internal-link blitz (2026-06-27, Traffic Offensive Front 1): descriptive
  // anchors into pages that already rank on Bing for "eBay sold" / "before you
  // bid" / "most valuable" queries. Flooding crawl equity at these from every
  // figure page is the documented move to convert Bing wins -> Google. Slugs are
  // verified real in src/app/guides/_data/articles.ts. Contextual + useful.
  const relatedGuides: Array<{ href: string; anchor: string }> = [
    { href: '/guides/read-ebay-sold-listings', anchor: 'how to read eBay sold listings' },
    { href: '/guides/how-to-price-wrestling-figures', anchor: 'how to price a figure before you buy' },
    { href: '/guides/most-valuable-vintage-wrestling-figures', anchor: 'the most valuable vintage wrestling figures' },
  ]

  // Retail comparison (only when we have a retail price AND median)
  const retailMarkup = (() => {
    if (retailPrice == null || median == null || soldCount < 3) return null
    const pct = Math.round(((median - retailPrice) / retailPrice) * 100)
    const absPct = Math.abs(pct)
    if (absPct < 5) return null // not meaningful if within 5%
    const direction = pct > 0 ? '↑' : '↓'
    const label     = pct > 0 ? 'above retail' : 'below retail'
    return { retailPrice, median, direction, absPct, label }
  })()

  return (
    <div
      style={{
        padding: '1rem 0',
        borderTop: '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
        borderBottom: '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
        marginBottom: '1.5rem',
      }}
    >
      {/* Natural language paragraph — primary featured snippet target */}
      <p
        style={{
          fontSize: '0.9rem',
          lineHeight: 1.65,
          color: 'var(--fp-text)',
          margin: 0,
          marginBottom: retailMarkup || velocity ? '0.75rem' : 0,
        }}
      >
        {summaryText}
      </p>

      {/* Retail vs market + velocity row */}
      {(retailMarkup || velocity) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          {retailMarkup && (
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--fp-muted)',
                background: 'var(--shelf-line, rgba(242,232,213,0.08))',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
              }}
            >
              Retail: {formatCurrency(retailMarkup.retailPrice)}{' '}
              <span style={{ marginLeft: '0.25rem' }}>→</span>{' '}
              Market: {formatCurrency(retailMarkup.median)}{' '}
              <span
                style={{
                  color: retailMarkup.direction === '↑' ? 'var(--fp-accent-warm, #e0a83e)' : 'var(--fp-muted)',
                  fontWeight: 600,
                }}
              >
                ({retailMarkup.direction}{retailMarkup.absPct}% {retailMarkup.label})
              </span>
            </span>
          )}

          {velocity && (
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--fp-muted)',
                background: 'var(--shelf-line, rgba(242,232,213,0.08))',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
              }}
            >
              📦 Sells {velocity} on eBay
            </span>
          )}
        </div>
      )}

      {/* Internal-link blitz (Traffic Offensive Front 1) — crawlable descriptive
          anchors into the Bing-ranking guide pages. Server-rendered, zero JS. */}
      <p
        style={{
          fontSize: '0.82rem',
          lineHeight: 1.6,
          color: 'var(--fp-muted)',
          margin: 0,
          marginTop: '0.85rem',
        }}
      >
        New to pricing? Learn{' '}
        {relatedGuides.map((g, i) => (
          <span key={g.href}>
            <a href={g.href} style={{ color: 'var(--fp-accent-warm, #e0a83e)', textDecoration: 'underline' }}>
              {g.anchor}
            </a>
            {i < relatedGuides.length - 1 ? (i === relatedGuides.length - 2 ? ', and ' : ', ') : '.'}
          </span>
        ))}
      </p>
    </div>
  )
}
