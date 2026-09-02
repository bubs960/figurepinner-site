/**
 * Pure paging helpers for the line hub (/[genre]/[line] and /[genre]/[line]/page/N).
 * No I/O, no JSX — unit-tested directly in tests/lineHubPagination.test.mjs.
 *
 * Why pagination exists (2026-09-02): /marvel/marvel-legends rendered 1,567 cards
 * in one response. After the markup diet it was still 3.9 MB decoded / 17.8K DOM
 * nodes / 1,567 <img>, and before the diet the cold render outgrew the Worker
 * (Cloudflare Error 1102 on every cold hit for ~1 h). Cutting each response to
 * one page of cards is the last 2x and the durable fix (webaudit omnibus item 5).
 *
 * Ruling (webaudit rec adopted as plan of record, Steve 9/2 "jump right in"):
 *   - path URLs  /[genre]/[line]/page/N   (N >= 2); page 1 IS the bare hub URL
 *   - 96 cards per page (17 pages for marvel-legends; 48 would make 33 thin
 *     near-duplicates — the /character/ pattern August was spent undoing)
 *   - paginate across cards in wave order; a wave may straddle two pages
 *     (whole-wave pages would give 300-card pages for Elite and 6-card pages
 *     for one-offs — exactly the variance being removed)
 *   - sitemap lists page 1 only; pages 2+ are self-canonical, index,follow,
 *     reachable by rel=next / in-page links
 */

export const LINE_HUB_PAGE_SIZE = 96

/** The literal 3rd segment reserved for pagination (/[genre]/[line]/page/N). */
export const RESERVED_PAGE_SEGMENT = 'page'

export function isReservedPageSegment(slug: string): boolean {
  return slug.toLowerCase().trim() === RESERVED_PAGE_SEGMENT
}

/** Only the fields paging needs — keeps the helpers testable with plain objects. */
export type Pageable = { release_wave: string | null; character_canonical: string }

export type WaveGroup<T> = { wave: string; label: string; figures: T[] }

export type PageSection<T> = WaveGroup<T> & {
  /** Whole-wave member count (not just the members on this page). */
  total: number
  /** True when this wave started on an earlier page. */
  continued: boolean
}

export type PagePlan<T> = {
  sections: PageSection<T>[]
  /** 0-based index of the first card on this page within the wave-ordered list. */
  start: number
  /** 0-based exclusive end. `end - start` = cards on this page. */
  end: number
  /** Whole-line card count. */
  total: number
  totalPages: number
  waveCount: number
}

export function waveLabel(wave: string): string {
  return wave === 'Unknown' ? 'Other' : isNaN(parseInt(wave)) ? wave : `Series ${wave}`
}

/**
 * Group figures by release_wave. Returns sorted array of {wave, label, figures}.
 * Numeric waves ascend numerically, then non-numeric waves alphabetically;
 * characters sort alphabetically within a wave. This is the hub's display order
 * and therefore the paging order — unchanged from the pre-pagination hub.
 */
export function groupByWave<T extends Pageable>(figures: T[]): WaveGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const f of figures) {
    const w = f.release_wave || 'Unknown'
    if (!map.has(w)) map.set(w, [])
    map.get(w)!.push(f)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const na = parseInt(a), nb = parseInt(b)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })
    .map(([wave, figs]) => ({
      wave,
      label: waveLabel(wave),
      figures: [...figs].sort((a, b) => a.character_canonical.localeCompare(b.character_canonical)),
    }))
}

export function totalPagesFor(count: number): number {
  return Math.max(1, Math.ceil(count / LINE_HUB_PAGE_SIZE))
}

/**
 * Parse the [n] route segment. Only a canonical positive integer string is a
 * page ("2", not "02", "+2", "2.0", "1e1"); anything else is a 404, never a
 * guess. Callers 308 page 1 to the bare hub URL and 404 pages past the end.
 */
export function parsePageSegment(raw: string): number | null {
  if (!/^[1-9]\d{0,5}$/.test(raw)) return null
  return Number(raw)
}

/** Hub URL for a page: page 1 is the bare hub, pages 2+ get /page/N. */
export function lineHubPath(genre: string, line: string, page: number): string {
  return page <= 1 ? `/${genre}/${line}` : `/${genre}/${line}/page/${page}`
}

/**
 * The wave sections that fall on `page`, given every figure in the line.
 * A wave that straddles the page boundary appears on both pages: the later
 * page's copy carries `continued: true`, and both carry the whole-wave `total`
 * so the section header can say "12 of 40 figures" instead of lying.
 */
export function planPage<T extends Pageable>(all: T[], page: number): PagePlan<T> {
  const groups = groupByWave(all)
  const total = all.length
  const totalPages = totalPagesFor(total)
  const start = (page - 1) * LINE_HUB_PAGE_SIZE
  const end = Math.min(start + LINE_HUB_PAGE_SIZE, total)
  const sections: PageSection<T>[] = []
  let offset = 0
  for (const g of groups) {
    const gStart = offset
    const gEnd = offset + g.figures.length
    offset = gEnd
    const a = Math.max(gStart, start)
    const b = Math.min(gEnd, end)
    if (a >= b) continue
    sections.push({
      wave: g.wave,
      label: g.label,
      figures: g.figures.slice(a - gStart, b - gStart),
      total: g.figures.length,
      continued: a > gStart,
    })
  }
  return { sections, start, end: Math.max(start, end), total, totalPages, waveCount: groups.length }
}

/**
 * Page numbers to show in the nav: first, last, and a window around the
 * current page, with `null` marking an ellipsis. Bounded (<= 9 entries) so a
 * 17-page hub doesn't grow a 17-link nav on every page.
 */
export function pageNavItems(page: number, totalPages: number, radius = 2): Array<number | null> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const set = new Set<number>([1, totalPages])
  for (let p = page - radius; p <= page + radius; p++) if (p >= 1 && p <= totalPages) set.add(p)
  const sorted = [...set].sort((a, b) => a - b)
  const out: Array<number | null> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(null)
    out.push(sorted[i])
  }
  return out
}
