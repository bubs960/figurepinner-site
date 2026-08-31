// GoldenCorpusPassport.tsx — passport section (golden-corpus pilot,
// MATCHER-TO-WEB-GOLDEN-CORPUS-CANDIDATE-CODY-2026-08-12.md). Renders matcher's
// figure-claims-2 doc as plain stated facts — no verbatim source quotes or
// source links (WEBAUDIT-TO-WEB-SOURCE-DISPLAY-REVIEW-SPEC-2026-08-30, Steve
// 8/30: never republish third-party expressive text on any public surface).
// Sidecars/evidence quotes stay internal — matcher's quality gates still read
// them, this component just doesn't render them (they're still used here,
// read-only, for the verbatim-overlap gate below). Honesty rules, per the
// original relay's design note, still apply:
//   - unresolved fields render "Not yet documented" — never papered over
//   - not_applicable renders as such (e.g. BAF on WWE basic figures)
//   - conflict renders BOTH values plainly — we don't pick a winner
//   - a value that's substantially its own source quote (isVerbatimOverlap,
//     goldenCorpus.ts) renders as "Not yet documented" too — stopgap for the
//     2026-08-30 claim-value audit, see goldenCorpus.ts's module comment
// Server component, no 'use client'; no date/Intl formatting (CLAUDE.md #8).

import {
  type FigureClaimsDoc,
  type Claim,
  isVerbatimOverlap,
} from '../_lib/goldenCorpus'

// field_path → human label. Indexed paths (visual_identifiers[0]…) collapse to
// one label; rows keep their own key via the full path.
const FIELD_LABELS: Array<{ match: RegExp; label: string }> = [
  { match: /^fingerprint\.attire_reference$/, label: 'Attire' },
  { match: /^fingerprint\.gear_colors$/, label: 'Gear colors' },
  { match: /^fingerprint\.head_sculpt$/, label: 'Head sculpt' },
  { match: /^fingerprint\.face_technology$/, label: 'Face technology' },
  { match: /^fingerprint\.articulation_points$/, label: 'Articulation' },
  { match: /^fingerprint\.packaging_style$/, label: 'Packaging' },
  { match: /^fingerprint\.visual_identifiers\[\d+\]$/, label: 'Visual identifier' },
  { match: /^fingerprint\.known_variants(\[\d+\])?$/, label: 'Known variants' },
  { match: /^included_items\[\d+\]$/, label: 'In the box' },
  { match: /^wave_context\.baf_target$/, label: 'Build-a-Figure target' },
  { match: /^wave_context\.baf_piece$/, label: 'Build-a-Figure piece' },
  { match: /^identity_bonus\.manufacturer_sku$/, label: 'Manufacturer SKU' },
  { match: /^identity_bonus\.street_date$/, label: 'Street date' },
  { match: /^identity_bonus\.original_retail_price$/, label: 'Original retail price' },
]

const GROUPS: Array<{ title: string; prefixes: string[] }> = [
  { title: 'Figure Fingerprint', prefixes: ['fingerprint.'] },
  { title: 'In the Box', prefixes: ['included_items'] },
  { title: 'Wave Context', prefixes: ['wave_context.'] },
  { title: 'Release Details', prefixes: ['identity_bonus.'] },
]

function labelFor(fieldPath: string): string {
  return FIELD_LABELS.find(f => f.match.test(fieldPath))?.label ?? fieldPath
}

function ClaimRow({ doc, claim }: { doc: FigureClaimsDoc; claim: Claim }) {
  const label = labelFor(claim.field_path)

  let body: React.ReactNode
  if (claim.status === 'resolved') {
    body = isVerbatimOverlap(doc, claim.evidence_quote_ids, claim.value)
      ? <span style={{ color: 'var(--dp-muted)' }}>Not yet documented</span>
      : <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{claim.value}</span>
  } else if (claim.status === 'conflict') {
    body = (
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--dp-muted)', marginBottom: '4px' }}>Sources disagree:</div>
        <div style={{ display: 'grid', gap: '4px' }}>
          {(claim.conflicting_values ?? []).map(cv => (
            <span key={cv.value} style={{ color: 'var(--dp-text)', fontWeight: 600 }}>
              {isVerbatimOverlap(doc, cv.evidence_quote_ids, cv.value) ? 'Not yet documented' : cv.value}
            </span>
          ))}
        </div>
      </div>
    )
  } else if (claim.status === 'not_applicable') {
    body = <span style={{ color: 'var(--dp-muted)' }}>Not applicable to this line</span>
  } else {
    body = <span style={{ color: 'var(--dp-muted)' }}>Not yet documented</span>
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(100px,160px) 1fr', gap: '10px',
      padding: '9px 14px', borderTop: '1px solid rgba(255,255,255,.06)',
      fontSize: '0.8rem', alignItems: 'start',
    }}>
      <span style={{ color: 'var(--dp-muted)' }}>{label}</span>
      {body}
    </div>
  )
}

// STRETCH fields (8/13 tiering ruling + v4 design pass): unresolved stretch
// rows are OMITTED, not shown as "Not yet documented" — stretch absence is
// noise, core absence is information. packaging_style is dropped ENTIRELY
// (v4 product decision, design-explorations/figure-page-v4/README.md).
const DROP_ENTIRELY = /^fingerprint\.packaging_style$/
const STRETCH_OMIT_WHEN_UNRESOLVED = /^(fingerprint\.known_variants|identity_bonus\.(manufacturer_sku|street_date))/

export default function GoldenCorpusPassport({ doc }: { doc: FigureClaimsDoc }) {
  return (
    <div id="receipts" style={{ marginTop: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '.02em',
          fontSize: '1.375rem', margin: 0, color: 'var(--dp-text)',
        }}>
          Documented Facts
        </h2>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Fields we couldn&apos;t verify say so.
      </div>
      {GROUPS.map(group => {
        const claims = doc.claims
          .filter(c => group.prefixes.some(p => c.field_path.startsWith(p)))
          .filter(c => !DROP_ENTIRELY.test(c.field_path))
          .filter(c => !(c.status === 'unresolved' && STRETCH_OMIT_WHEN_UNRESOLVED.test(c.field_path)))
        if (claims.length === 0) return null
        return (
          <div key={group.title} style={{ marginBottom: '0.9rem' }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '.1em',
              color: 'var(--dp-muted)', marginBottom: '0.35rem',
            }}>
              {group.title.toUpperCase()}
            </div>
            <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
              {claims.map(c => <ClaimRow key={c.field_path} doc={doc} claim={c} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
