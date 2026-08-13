// GoldenCorpusPassport.tsx — evidence-locked passport section (golden-corpus pilot,
// MATCHER-TO-WEB-GOLDEN-CORPUS-CANDIDATE-CODY-2026-08-12.md). Renders matcher's
// figure-claims-2 doc with per-fact "show source" provenance: every value carries
// its verbatim quote + source URL. Honesty rules, per the relay's design note:
//   - unresolved fields render "Not yet documented" — never papered over
//   - not_applicable renders as such (e.g. BAF on WWE basic figures)
//   - conflict renders BOTH values with both sources — we don't pick a winner
// Server component, no 'use client' — <details>/<summary> gives the disclosure
// interaction natively; no date/Intl formatting anywhere (CLAUDE.md truth #8).

import {
  type FigureClaimsDoc,
  type Claim,
  resolveEvidence,
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

function evidenceBadge(cls: string | undefined): { label: string; color: string } {
  if (cls === 'primary_exact') return { label: 'PRIMARY SOURCE', color: 'var(--dp-green)' }
  if (cls === 'single_secondary') return { label: 'SINGLE SOURCE', color: 'var(--dp-gold)' }
  return { label: 'SOURCED', color: 'var(--dp-cyan)' }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function ShowSource({ doc, quoteIds }: { doc: FigureClaimsDoc; quoteIds: string[] | undefined }) {
  const evidence = resolveEvidence(doc, quoteIds)
  if (evidence.length === 0) return null
  return (
    <details style={{ marginTop: '4px' }}>
      <summary style={{
        cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '.06em',
        color: 'var(--dp-cyan)', listStyle: 'none',
      }}>
        SHOW SOURCE{evidence.length > 1 ? `S (${evidence.length})` : ''}
      </summary>
      <div style={{ marginTop: '6px', display: 'grid', gap: '6px' }}>
        {evidence.map(({ quote, source }) => (
          <div key={quote.quote_id} style={{
            padding: '8px 10px', borderRadius: '8px',
            background: 'rgba(78,205,230,.05)', border: '1px solid rgba(78,205,230,.2)',
            fontSize: '0.72rem', lineHeight: 1.5,
          }}>
            <div style={{ color: 'var(--dp-text)', fontStyle: 'italic' }}>&ldquo;{quote.text}&rdquo;</div>
            {source && (
              <div style={{ marginTop: '4px', color: 'var(--dp-muted)' }}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: 'var(--dp-cyan)', textDecoration: 'underline' }}
                >
                  {hostname(source.url)}
                </a>
                {source.retrieved_at ? ` · retrieved ${source.retrieved_at}` : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

function ClaimRow({ doc, claim }: { doc: FigureClaimsDoc; claim: Claim }) {
  const label = labelFor(claim.field_path)

  let body: React.ReactNode
  if (claim.status === 'resolved') {
    const badge = evidenceBadge(claim.evidence_class)
    body = (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{claim.value}</span>
          <span style={{
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '.05em',
            color: badge.color, border: `1px solid ${badge.color}`,
            borderRadius: '100px', padding: '1px 7px', whiteSpace: 'nowrap',
          }}>
            {badge.label}
          </span>
        </div>
        <ShowSource doc={doc} quoteIds={claim.evidence_quote_ids} />
      </div>
    )
  } else if (claim.status === 'conflict') {
    body = (
      <div>
        <span style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '.05em',
          color: 'var(--dp-pink)', border: '1px solid var(--dp-pink)',
          borderRadius: '100px', padding: '1px 7px', whiteSpace: 'nowrap',
        }}>
          SOURCES DISAGREE
        </span>
        <div style={{ display: 'grid', gap: '4px', marginTop: '6px' }}>
          {(claim.conflicting_values ?? []).map(cv => (
            <div key={cv.value}>
              <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{cv.value}</span>
              <ShowSource doc={doc} quoteIds={cv.evidence_quote_ids} />
            </div>
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

export default function GoldenCorpusPassport({ doc }: { doc: FigureClaimsDoc }) {
  return (
    <div style={{ marginTop: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '.02em',
          fontSize: '1.375rem', margin: 0, color: 'var(--dp-text)',
        }}>
          Documented Facts, With Receipts
        </h2>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '.08em',
          background: 'rgba(78,201,140,.1)', border: '1px solid var(--dp-green)', color: 'var(--dp-green)',
        }}>
          EVIDENCE-LOCKED
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Every fact below is backed by a verbatim quote from a named source — expand any row to see
        exactly where it came from. Fields we couldn&apos;t verify say so.
      </div>
      {GROUPS.map(group => {
        const claims = doc.claims.filter(c => group.prefixes.some(p => c.field_path.startsWith(p)))
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
