/**
 * Shared server-side length caps for free-text fields on the user-data write
 * routes (vault/wantlist/alert create+edit, device push-token registration).
 *
 * Rejects with 400 rather than truncating: a silently shortened figure name
 * or brand is worse than a rejected request, because the client has no way
 * to know its data was cut down, and a truncated `figure_id` would silently
 * corrupt the row's join to the KB catalog. None of these fields are
 * genuinely free-typed by a user (see the per-cap comments below), so a
 * legitimate client can never hit these — they exist to bound what an
 * adversarial or buggy client can push into D1/KV.
 */

export interface FieldCap {
  field: string
  max: number
}

/**
 * Returns the first cap in `caps` whose string field in `body` exceeds it,
 * else null. Generic over `T` (rather than `Record<string, unknown>`) so
 * callers can pass their route's own parsed request-body interface directly,
 * without an intermediate cast.
 */
export function findOversizedField<T extends object>(
  body: T,
  caps: readonly FieldCap[],
): FieldCap | null {
  const record = body as Record<string, unknown>
  for (const cap of caps) {
    const value = record[cap.field]
    if (typeof value === 'string' && value.length > cap.max) {
      return cap
    }
  }
  return null
}

/** `{field} must be {max} characters or fewer` — reused as the `error` value on every route's existing `{ error: string }` 400 shape. */
export function fieldCapMessage(cap: FieldCap): string {
  return `${cap.field} must be ${cap.max} characters or fewer`
}

// ── Cap definitions ──────────────────────────────────────────────────────────
// figure_id/name/brand/line/genre are never free-typed: FigureActions.tsx
// (the only client that POSTs these) always sends the exact strings a figure
// page/search result just rendered — deriveName()/prettifySlug() output off
// KB data, not user input. Caps here are a generous multiple of any real KB
// value, not a fit to observed data.

/** vault/wantlist/alert create — the figure identity fields every one of those routes accepts. */
export const FIGURE_ENTRY_FIELD_CAPS: readonly FieldCap[] = [
  // KB figure IDs are shaped like `<manufacturer>-<line>-<slug>_<6-hex>`;
  // real IDs run well under 100 chars. 200 is 2x headroom.
  { field: 'figure_id', max: 200 },
  // Figure display names (deriveName() output) — the longest real names run
  // to roughly 100-140 chars ("... 6-Inch Scale Action Figure with
  // Collector Card and Accessories" style long lines). 300 is generous.
  { field: 'name', max: 300 },
  // Manufacturer name (e.g. "Hasbro", "Super7 Ultimates") — always short.
  { field: 'brand', max: 150 },
  // Product line name — same shape/length class as brand.
  { field: 'line', max: 150 },
  // Fandom/genre label (e.g. "professional-wrestling") — always a short slug.
  { field: 'genre', max: 100 },
]

/**
 * vault create/edit's `condition` field. The only client (FigureActions.tsx)
 * sends one of a fixed `<select>` list — `['Loose','Near Mint','MOC',
 * 'Opened','Damaged']`, longest 9 chars — the server never validates the
 * value is one of those, so 40 is a generous ceiling rather than an enum
 * check (adding enum validation would be a behavior change beyond this
 * task's length/size-cap scope).
 */
export const CONDITION_FIELD_CAP: FieldCap = { field: 'condition', max: 40 }

/**
 * /api/v1/devices' push `token`. Opaque values issued by Apple/Google/Expo:
 * APNs device tokens are 64 hex chars, FCM registration tokens run
 * 140-200+ chars, Expo push tokens ~40 chars, and web-push endpoint/key
 * blobs can run into the low hundreds. No legitimate provider token is
 * anywhere near 4096 bytes — this is a defensive ceiling against a
 * malformed/garbage payload, not a tight fit to any real token shape.
 */
export const DEVICE_TOKEN_FIELD_CAP: FieldCap = { field: 'token', max: 4096 }
