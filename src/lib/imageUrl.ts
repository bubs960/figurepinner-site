/**
 * Thumbnail URL helper.
 *
 * Figure photos are served full-resolution from the Shopify CDN
 * (cdn.shopify.com). Cards render them at ~40–88px, so loading the full
 * original is ~50–100× more bytes than needed — that's what made grid pages
 * (genre / line / search) load dozens of slow images and appear blank.
 *
 * Shopify's CDN resizes natively via a `width` query param. This appends it
 * so cards request a small image. Non-Shopify URLs (e.g. actionfigure411) and
 * empty values pass through unchanged.
 */
export function thumb(url: string | null | undefined, width = 160): string | null {
  if (!url) return null
  if (!url.includes('cdn.shopify.com')) return url
  if (/[?&]width=/.test(url)) return url // already sized
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}width=${width}`
}
