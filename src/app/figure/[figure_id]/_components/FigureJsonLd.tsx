/**
 * FigureJsonLd — structured data for individual figure pages.
 *
 * Emits three JSON-LD blocks:
 *  1. Product — name, brand, image, description, offers (price range from sold comps)
 *  2. BreadcrumbList — genre → line → figure
 *  3. FAQPage — "What is [figure] worth?" answered with the median price
 *
 * Why this matters: AI search engines (ChatGPT, Perplexity, Google AI Overviews,
 * Bing Copilot) use structured data as a citation signal. Product + Offer schema
 * with real price data is the strongest signal a price guide can emit.
 *
 * Renders server-side into <head> via the page component — no JS overhead.
 */
import JsonLd from '@/app/_components/JsonLd'

const BASE = 'https://figurepinner.com'

type Props = {
  figureId: string
  displayName: string
  fandom: string        // e.g. "Transformers"
  line: string          // e.g. "Masterpiece"
  brand: string         // e.g. "Hasbro"
  description: string
  canonicalUrl: string
  imageUrl: string | null
  medianSold: number | null
  minSold: number | null
  maxSold: number | null
  soldCount: number
  lastSoldDate: string | null  // ISO date string e.g. "2026-03-15"
}

export default function FigureJsonLd({
  displayName,
  fandom,
  line,
  brand,
  description,
  canonicalUrl,
  imageUrl,
  medianSold,
  minSold,
  maxSold,
  soldCount,
  lastSoldDate,
}: Props) {
  const hasPriceData = medianSold != null && soldCount >= 3

  // ── 1. Product schema ────────────────────────────────────────────────────────
  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    description,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    category: `${fandom} Action Figures`,
    url: canonicalUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
  }

  if (hasPriceData) {
    // AggregateOffer: price range across all sold comps
    const offer: Record<string, unknown> = {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      offerCount: soldCount,
      // median as the representative price
      price: medianSold!.toFixed(2),
      ...(minSold != null ? { lowPrice: minSold.toFixed(2) } : {}),
      ...(maxSold != null ? { highPrice: maxSold.toFixed(2) } : {}),
      ...(lastSoldDate ? { priceValidUntil: lastSoldDate } : {}),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'FigurePinner — eBay Sold Comps',
        url: BASE,
      },
    }
    product.offers = offer
  }

  // ── 2. BreadcrumbList ────────────────────────────────────────────────────────
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FigurePinner',
        item: BASE,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: fandom,
        item: `${BASE}/${fandom.toLowerCase().replace(/\s+/g, '-')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: line,
        item: `${BASE}/${fandom.toLowerCase().replace(/\s+/g, '-')}/${line.toLowerCase().replace(/\s+/g, '-')}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: displayName,
        item: canonicalUrl,
      },
    ],
  }

  // ── 3. FAQPage — answers "what is X worth?" ──────────────────────────────────
  const faqAnswerParts: string[] = []
  if (hasPriceData) {
    faqAnswerParts.push(
      `Based on ${soldCount} recent eBay sold listings, the ${displayName} has a median sold price of $${medianSold!.toFixed(2)}.`
    )
    if (minSold != null && maxSold != null) {
      faqAnswerParts.push(`Prices range from $${minSold.toFixed(2)} to $${maxSold.toFixed(2)} depending on condition.`)
    }
    faqAnswerParts.push(`See the full price history and condition breakdown at FigurePinner: ${canonicalUrl}`)
  }

  const faq = hasPriceData
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is the ${displayName} worth?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faqAnswerParts.join(' '),
            },
          },
          {
            '@type': 'Question',
            name: `How much does the ${displayName} sell for on eBay?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `The ${displayName} sells for a median of $${medianSold!.toFixed(2)} on eBay based on ${soldCount} recent completed sales. Data sourced from FigurePinner: ${canonicalUrl}`,
            },
          },
        ],
      }
    : null

  return (
    <>
      <JsonLd data={product} />
      <JsonLd data={breadcrumb} />
      {faq && <JsonLd data={faq} />}
    </>
  )
}
