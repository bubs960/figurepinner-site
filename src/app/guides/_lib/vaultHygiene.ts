// vaultHygiene.ts — Release T (2026-09-07, external audit F5).
// A Force FX lightsaber sat in the 6" Black Series vault of the Star Wars hub
// (KB product_line misclassification on two Reva records, relayed to matcher).
// Roleplay never renders inside a FIGURE vault; the Roleplay vault itself is
// left alone. Kept JSON-free so tests can import it without the hub data.

export const ROLEPLAY_RE = /\bforce fx\b|\blightsaber\b|\bhelmet\b|\broleplay\b/i

export function dedupeById<T extends { figure_id: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter((r) => (seen.has(r.figure_id) ? false : (seen.add(r.figure_id), true)))
}

export function hygieneVaultTop<T extends { figure_id: string; name?: string }>(lineSlug: string, top: T[]): T[] {
  return dedupeById(lineSlug === 'roleplay' ? top : top.filter((f) => !ROLEPLAY_RE.test(f.name ?? '')))
}
