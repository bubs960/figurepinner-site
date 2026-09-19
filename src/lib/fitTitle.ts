// SERP <title> length fitting (2026-09-18).
//
// Bing Webmaster Tools flags every title over 70 characters as a High-severity
// SEO error ("might be truncated or ignored"); 13,479 of 23,280 figure titles
// and ~25 guide titles were over, mostly because the root layout appends
// " | FigurePinner" (15 chars) to titles that were already full. The brand is
// the least valuable part of a long title — the domain shows it anyway — so it
// is the first thing to go. Keywords are only touched after that, and only as
// far as needed. Data-free and pure: safe in any runtime.
import type { Metadata } from 'next'

export const TITLE_MAX = 70
export const BRAND_SUFFIX = ' | FigurePinner'

/** For hand-written absolute titles that already end in the brand suffix
 *  (guide metaTitles): drop the suffix when the full string is over the limit. */
export function fitAbsoluteTitle(full: string): string {
  if (full.length <= TITLE_MAX || !full.endsWith(BRAND_SUFFIX)) return full
  return full.slice(0, -BRAND_SUFFIX.length)
}

/** Drops the "· wave/series" tail inside a trailing "(Line · Wave)" parenthetical. */
function dropWave(title: string): string {
  return title.replace(/ · [^()]*\)( Price(?: & Value)?)$/, ')$1')
}

const shortTail = (t: string) => t.replace(/ Price & Value$/, ' Price')

/**
 * For figure-page titles that flow through the root layout's
 * '%s | FigurePinner' template. Shortening ladder, stopping at the first fit:
 *   1. as-is, brand appended by the template
 *   2. brand dropped                          (returned as `absolute`)
 *   3. " Price & Value" -> " Price"           (wave kept — collectors search it)
 *   4. wave dropped, full tail
 *   5. wave dropped, short tail
 *   6. nothing fits (very long names): step 2, never a mid-word cut.
 */
export function fitFigureTitle(base: string): NonNullable<Metadata['title']> {
  if (base.length + BRAND_SUFFIX.length <= TITLE_MAX) return base
  const candidates = [base, shortTail(base), dropWave(base), shortTail(dropWave(base))]
  return { absolute: candidates.find((t) => t.length <= TITLE_MAX) ?? base }
}

/**
 * Price-in-title variant (src/lib/titlePriceTest.ts decides who gets it and
 * what the number is). Same ladder, each rung carrying ": <price>" — the colon
 * reads as the answer to the title ("… Price & Value: $42 Sealed / $18 Loose").
 * The price never survives at the expense of a mid-word cut: if no rung fits
 * with the number, the page gets the ordinary fitted title instead.
 */
export function fitFigureTitleWithPrice(base: string, priceFragment: string | null): NonNullable<Metadata['title']> {
  if (!priceFragment) return fitFigureTitle(base)
  const withPrice = (t: string) => `${t}: ${priceFragment}`
  const full = withPrice(base)
  if (full.length + BRAND_SUFFIX.length <= TITLE_MAX) return full
  const candidates = [full, withPrice(shortTail(base)), withPrice(dropWave(base)), withPrice(shortTail(dropWave(base)))]
  const fit = candidates.find((t) => t.length <= TITLE_MAX)
  return fit ? { absolute: fit } : fitFigureTitle(base)
}
