/**
 * bubs-inventory.ts
 * Manual seed — Bubs960 Collectibles Shopify listings mapped to FigurePinner figure_ids.
 *
 * HOW TO ADD A LISTING:
 *   1. Find the figure on figurepinner.com — the figure_id is in the URL:
 *      figurepinner.com/figure/[figure_id]
 *   2. Copy your Shopify product URL (the full URL, e.g. bubs960collectibles.com/products/...)
 *   3. Add an entry below under the matching figure_id key.
 *   4. Run `npm run deploy` to push live.
 *
 * When an item sells: set in_stock: false (or remove the entry).
 * One figure_id can have multiple listings (e.g. two copies at different conditions/prices).
 *
 * FINDING FIGURE IDs:
 *   Search figurepinner.com for the figure → click it → copy the ID from the URL.
 *   Example: /figure/wwe-elite-series-91-roman-reigns → figure_id = "wwe-elite-series-91-roman-reigns"
 *
 * eBay listings (below the manual seed) are merged in automatically from
 * shop-listings.json — see the "eBay-sourced listings" section at the
 * bottom of this file. Don't hand-add an eBay listing here; it'll double up.
 */

export interface SellerListing {
  seller_name:  string    // Store display name
  seller_url?:  string    // Store homepage — omit when unknown (e.g. no eBay store slug on file)
  price:        number    // USD, no tax
  condition?:   string    // "New Sealed" | "New Open" | "Used - Like New" | "Used - Good" — omit when unknown, never guess
  title:        string    // Product title (shown in card)
  buy_url:      string    // Direct product URL
  in_stock:     boolean   // Flip to false when sold instead of deleting the entry
  badge?:       string    // Optional short badge text: "Buy 2 Save 10%" | "Last 1" | "Ships Today"
}

// ─── Bubs960 Collectibles inventory ──────────────────────────────────────────
// Replace the placeholder entries below with your real Shopify listings.
// Keep figure_ids exact — they must match the KB URL slug.

const BUBS: Pick<SellerListing, 'seller_name' | 'seller_url'> = {
  seller_name: 'Bubs960 Collectibles',
  seller_url:  'https://bubs960collectibles.myshopify.com',
}

export const SELLER_INVENTORY: Record<string, SellerListing[]> = {

  // ── EXAMPLE ENTRIES — replace with real listings ───────────────────────────
  // Format: 'figure-id-from-url': [{ ...BUBS, price, condition, title, buy_url, in_stock }]

  // 'wwe-elite-series-91-roman-reigns': [
  //   {
  //     ...BUBS,
  //     price:     34.99,
  //     condition: 'New Sealed',
  //     title:     'WWE Elite Series 91 Roman Reigns Figure',
  //     buy_url:   'https://bubs960collectibles.myshopify.com/products/wwe-elite-91-roman-reigns',
  //     in_stock:  true,
  //     badge:     'Ships Today',
  //   },
  // ],

  // ── ADD YOUR REAL LISTINGS BELOW ──────────────────────────────────────────

}

// ─── eBay-sourced listings (ad-revenue plan S5, "From the shop" module) ──────
// Auto-generated static export, NOT hand-edited. Pipeline: lister's
// export-shop-listings.py cross-checks Steve's live eBay listings against
// listings-log.json's captured figure_id (never reverse-engineered from the
// eBay sku, which is a lossy transform for longer fids) and the live KB,
// then writes Bridge/shop-listings-export.json. Web copies that file to
// shop-listings.json here on each refresh — see the TODO below for the
// still-manual step in that chain.
//
// TODO: this copy step isn't automated yet. Until it is, shop-listings.json
// only reflects whatever was live at the last manual refresh — check
// generated_at below before trusting it's current, and re-copy from Bridge
// before the next deploy if it's stale.
//
// No title in the export — derived from the KB's own display name
// (deriveName), never re-typed. Condition is sourced from lister's own
// condition_map.py (pkg_label) — the SAME canonical taxonomy that module's
// docstring says is shared with figurepinner.com's MarketPanel ("Do NOT
// drift these mappings without coordinating with site lane"), so this
// reuses the site's existing packaging/grade vocabulary rather than
// inventing a parallel one. If a future export item ever lacks a condition
// (schema drift, not expected today), SellerCard treats that as "don't
// render the chip," not "assume Used" — never guess.
import shopExport from './shop-listings.json'
import { getFigureById } from './kb'
import { deriveName } from './kbTypes'

// Steve's real eBay storefront (confirmed 2026-07-11) — powers the "Browse
// more at Bubs960 Collectibles" footer link on eBay-sourced SellerCards.
const EBAY_STORE_URL = 'https://www.ebay.com/usr/bubs960'

interface ShopExportItem {
  figure_id: string
  price: number
  quantity: number
  status: string
  condition?: string
  item_url: string
}

const EBAY_LISTINGS_BY_FID = new Map<string, ShopExportItem[]>()
for (const item of (shopExport as { items: ShopExportItem[] }).items) {
  if (item.status !== 'PUBLISHED' || item.quantity < 1) continue
  const bucket = EBAY_LISTINGS_BY_FID.get(item.figure_id)
  if (bucket) bucket.push(item)
  else EBAY_LISTINGS_BY_FID.set(item.figure_id, [item])
}

function ebayListingsFor(figureId: string): SellerListing[] {
  const items = EBAY_LISTINGS_BY_FID.get(figureId)
  if (!items) return []
  const figure = getFigureById(figureId)
  const title = figure ? deriveName(figure) : figureId
  return items.map(item => ({
    seller_name: 'Bubs960 Collectibles',
    seller_url: EBAY_STORE_URL,
    price: item.price,
    condition: item.condition,
    title,
    buy_url: item.item_url,
    in_stock: true,
    badge: item.quantity === 1 ? 'Last 1' : undefined,
  }))
}

// ─── Lookup helper ────────────────────────────────────────────────────────────

/** Returns in-stock listings for a given figure_id, empty array if none.
 *  Merges the hand-maintained Shopify seed with the auto eBay export. */
export function getSellerListings(figureId: string): SellerListing[] {
  const manual = (SELLER_INVENTORY[figureId] ?? []).filter(l => l.in_stock)
  return [...manual, ...ebayListingsFor(figureId)]
}
