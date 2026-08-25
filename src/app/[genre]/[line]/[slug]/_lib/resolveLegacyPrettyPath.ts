import { getFigureById, prettyFigureUrl } from '@/data/kb'
import { PRETTY_PATH_REDIRECTS } from '@/data/pretty-path-redirects'

/**
 * Resolves a (genre, line, slug) triple that matches no live figure to its
 * successor's current canonical URL, via the historical PRETTY_PATH_REDIRECTS
 * ledger — returns null if there's no exact, verified mapping.
 *
 * 2026-08-24 (soft-404 fix): replaces the old behavior of redirecting EVERY
 * unmatched path to the genre hub. Deliberately exact-match only: no fuzzy
 * matching, no partial-key lookup, no "close enough" name similarity — an
 * unmapped path is a real 404, not a guess. Shared by generateMetadata and
 * the page body so both agree on the same outcome for the same URL (see
 * ledger file's own doc comment for the full rationale).
 */
export function resolveLegacyPrettyPath(genre: string, line: string, slug: string): string | null {
  const oldPath = `/${genre}/${line}/${slug}`
  const successorFid = PRETTY_PATH_REDIRECTS[oldPath]
  if (!successorFid) return null
  const successor = getFigureById(successorFid)
  // Ledger entry points at a fid no longer in the KB -- fail safe to 404
  // rather than redirect to a dead target.
  if (!successor) return null
  return prettyFigureUrl(successor)
}
