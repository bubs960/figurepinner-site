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
 */

export interface SellerListing {
  seller_name:  string    // Store display name
  seller_url:   string    // Store homepage
  price:        number    // USD, no tax
  condition:    string    // "New Sealed" | "New Open" | "Used - Like New" | "Used - Good"
  title:        string    // Your Shopify product title (shown in card)
  buy_url:      string    // Direct Shopify product URL
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

// ─── Lookup helper ────────────────────────────────────────────────────────────

/** Returns in-stock listings for a given figure_id, empty array if none. */
export function getSellerListings(figureId: string): SellerListing[] {
  return (SELLER_INVENTORY[figureId] ?? []).filter(l => l.in_stock)
}
