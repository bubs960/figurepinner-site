/**
 * Thumbnail URL helper.
 *
 * Cards render figure photos at ~40-160px, so serving full-resolution
 * originals wastes 5-100x the bytes on the most timing-critical resources.
 * Two hosts support cheap server-side resizing:
 *
 *  - cdn.shopify.com (WFD wrestling photos): native `width` query param.
 *  - i.ebayimg.com: size is encoded in the filename (s-l225, s-l500,
 *    s-l1600...). eBay serves all standard s-lNNN variants for any image id,
 *    so we rewrite to the smallest bucket >= the requested width. Grid pages
 *    were pulling s-l1600 originals (~200-500KB) into 40px boxes.
 *
 * Other hosts (actionfigure411 thumbs, R2 worker, wixstatic) pass through
 * unchanged — AF411 URLs already point at /images/thumbs/, and the R2 images
 * worker has no resize support yet (rehost campaign in progress).
 */
export function thumb(url: string | null | undefined, width = 160): string | null {
  if (!url) return null

  if (url.includes('cdn.shopify.com')) {
    if (/[?&]width=/.test(url)) return url // already sized
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}width=${width}`
  }

  if (url.includes('i.ebayimg.com')) {
    // Smallest standard eBay size bucket that still covers the box (2x for
    // retina is overkill on dense grids; 1.5x is the sweet spot).
    const target = width <= 96 ? 140 : width <= 256 ? 225 : width <= 400 ? 500 : 1600
    return url.replace(/s-l\d+\./, `s-l${target}.`)
  }

  return url
}
