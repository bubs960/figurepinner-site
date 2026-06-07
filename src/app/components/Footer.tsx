/**
 * Footer — single shared site footer.
 *
 * Mounted globally in the root layout (src/app/layout.tsx) so every page gets
 * an identical footer: standard link row, eBay/affiliate disclaimer, copyright.
 * Replaces 11 divergent inline <footer> blocks (consolidated 2026-06-06, W-footer).
 *
 * Theming: uses global CSS vars (--border, --dim, --text) defined at :root in
 * globals.css. These resolve identically on the dark homepage and every other
 * page, so the footer looks the same everywhere. The legacy --fp-* vars some
 * pages used are themselves aliases to these, so nothing changes visually.
 *
 * Per-page SEO genre links the figure/[genre]/[line] footers used to carry are
 * already present in those pages' breadcrumbs, so consolidating to one footer
 * loses no internal linking.
 */

// /news and /deals are intentionally omitted until they have content (W6):
// /news has no published events yet, /deals populates only when pricing
// coverage surfaces real drops. Both pages stay live at their URLs.
const STANDARD_LINKS: ReadonlyArray<[label: string, href: string]> = [
  ['Price Guide', '/guides'],
  ['About', '/about'],
  ['Methodology', '/methodology'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  // Pro link removed 2026-06-06 (Steve): Pro tier (export + ad-free) is held
  // until GrailPulse has ≥3 verticals — too thin to sell with no ads live and
  // one vertical. Backend/Stripe code kept intact; restore this entry + the
  // CtaRail card + /pro page when the 3rd vertical ships.
]

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
      <nav
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.75rem',
        }}
      >
        {STANDARD_LINKS.map(([label, href]) => (
          <a
            key={href}
            href={href}
            style={{ color: 'var(--dim)', textDecoration: 'none', fontSize: '0.8rem' }}
          >
            {label}
          </a>
        ))}
      </nav>

      <p style={{ fontSize: '0.75rem', color: 'var(--dim)', margin: 0 }}>
        © {new Date().getFullYear()} Bubs960 Collectibles · FigurePinner
      </p>

      <p
        style={{
          fontSize: '0.6875rem',
          color: 'var(--dim)',
          margin: '0.5rem auto 0',
          maxWidth: '600px',
          lineHeight: 1.5,
          opacity: 0.8,
        }}
      >
        Not affiliated with or endorsed by eBay. Price data is sourced from publicly available
        completed sales and is provided for informational purposes only. All trademarks are the
        property of their respective owners.
      </p>
    </footer>
  )
}
