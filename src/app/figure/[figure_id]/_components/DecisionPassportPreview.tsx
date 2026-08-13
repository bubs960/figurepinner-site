// DecisionPassportPreview.tsx — Figure Page v3 "Decision Passport" visual shell
// (2026-08-08, WEB-FIGURE-PAGE-V3-SCOPE-2026-08-08.md). Visual redesign only —
// renders real KB data where it exists (identity fields, sealed/loose market
// buckets) and an honest "coming soon" state where it doesn't (Complete Check,
// wave/BAF map, version comparison — no per-figure box-contents/BAF/comparison
// data exists in the KB yet, banked by matcher 2026-08-08). Must never render
// the design handoff's SAMPLE numbers as real — that's the exact QA gate this
// component exists to respect (see the golden JSON's `$owner: SAMPLE` fields).
//
// Server component, no 'use client' — this page's date/Intl hydration rule
// (figurepinner-site/CLAUDE.md truth #8) doesn't apply here; nothing here
// formats a date.

import type { CondBucket } from './FigureDetailContent'

export type IdentityRow = { label: string; value: string; badge: string; badgeColor: string }

interface DecisionPassportProps {
  identity: IdentityRow[]
  sealed: CondBucket | null
  loose: CondBucket | null
  /** Evidence-locked golden-corpus section (Hela pilot, 2026-08-13) — rendered
   *  inside the passport card, between market evidence and coming-soon. */
  children?: React.ReactNode
}

function confidenceLabel(count: number): { label: string; color: string } {
  if (count >= 8) return { label: 'HIGH CONFIDENCE', color: 'var(--dp-green)' }
  if (count >= 4) return { label: 'MEDIUM — n<8', color: 'var(--dp-gold)' }
  return { label: 'LOW — thin bucket', color: 'var(--dp-pink)' }
}

function BucketCard({ label, bucket }: { label: string; bucket: CondBucket | null }) {
  const count = bucket?.count ?? 0
  const hasNumber = bucket?.median != null && count >= 1
  const conf = confidenceLabel(count)
  return (
    <div style={{
      padding: '1rem 1.125rem', borderRadius: '12px',
      background: hasNumber ? 'rgba(224,168,62,.06)' : 'rgba(255,255,255,.02)',
      border: `1px solid ${hasNumber ? 'rgba(224,168,62,.35)' : 'rgba(255,255,255,.1)'}`,
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '.1em', color: 'var(--dp-muted)' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '.01em',
        fontSize: '2.1rem', lineHeight: 1.15, color: hasNumber ? 'var(--dp-gold)' : 'var(--dp-text)',
      }}>
        {hasNumber ? `$${bucket!.median!.toFixed(0)}` : '—'}
      </div>
      <div style={{ fontSize: '0.7rem', lineHeight: 1.5, color: 'var(--dp-muted)' }}>
        {count > 0
          ? `${count} comp${count === 1 ? '' : 's'}${bucket?.min != null && bucket?.max != null ? ` · range $${bucket.min.toFixed(0)}–$${bucket.max.toFixed(0)}` : ''}`
          : 'No recent sold comps in this condition yet'}
      </div>
      {count > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <span style={{
            display: 'inline-block', padding: '3px 9px', borderRadius: '100px',
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '.06em',
            background: '#09090F', border: `1px solid ${conf.color}`, color: conf.color,
          }}>
            {conf.label}
          </span>
        </div>
      )}
    </div>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '.02em',
      fontSize: '1.375rem', margin: '0 0 0.6rem', color: 'var(--dp-text)',
    }}>
      {children}
    </h2>
  )
}

function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <section style={{ marginTop: '1.75rem' }}>
      <SectionHeading>{title}</SectionHeading>
      <div style={{
        padding: '1.25rem', borderRadius: '12px', textAlign: 'center',
        border: '1px dashed rgba(255,255,255,.16)', color: 'var(--dp-muted)',
        fontSize: '0.78rem', lineHeight: 1.6,
      }}>
        {note}
      </div>
    </section>
  )
}

export default function DecisionPassportPreview({ identity, sealed, loose, children }: DecisionPassportProps) {
  return (
    <section style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      <style>{`
        .fp-dp {
          --dp-bg: #09090F; --dp-text: #EEEEF5; --dp-muted: rgba(238,238,245,.55);
          --dp-gold: #f5c462; --dp-cyan: #4ecde6; --dp-green: #4ec98c; --dp-pink: #e05a7a;
        }
      `}</style>
      <div className="fp-dp" style={{
        background: 'linear-gradient(160deg, #16131f 0%, #0b0a12 65%)',
        border: '1px solid rgba(224,168,62,.3)', borderRadius: '16px',
        padding: '1.5rem 1.5rem 1.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '.08em',
            background: 'rgba(224,168,62,.12)', border: '1px solid var(--dp-gold)', color: 'var(--dp-gold)',
          }}>
            NEW
          </span>
          <div style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', lineHeight: 1.5 }}>
            We&apos;re building a deeper, source-backed page for this figure. Some sections below are still filling in.
          </div>
        </div>

        {/* Identity */}
        <SectionHeading>How to Identify This Exact Release</SectionHeading>
        <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
          {identity.map(row => (
            <div key={row.label} style={{
              display: 'grid', gridTemplateColumns: 'minmax(100px,150px) 1fr auto', gap: '10px',
              padding: '9px 14px', borderTop: '1px solid rgba(255,255,255,.06)',
              fontSize: '0.8rem', alignItems: 'center',
            }}>
              <span style={{ color: 'var(--dp-muted)' }}>{row.label}</span>
              <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{row.value}</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '.05em',
                color: row.badgeColor, border: `1px solid ${row.badgeColor}`,
                borderRadius: '100px', padding: '2px 8px', whiteSpace: 'nowrap',
              }}>
                {row.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Market evidence */}
        <div style={{ marginTop: '1.75rem' }}>
          <SectionHeading>Sealed vs. Loose Market Value</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <BucketCard label="SEALED / CARDED" bucket={sealed} />
            <BucketCard label="LOOSE" bucket={loose} />
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--dp-muted)', lineHeight: 1.6 }}>
            Based on raw eBay sold listings. We&apos;re building a cleaning step to automatically exclude lots, parts sales
            and wrong-variant listings before this shows a number — until then, treat thin buckets with extra caution.
          </div>
        </div>

        {children}

        <ComingSoon
          title="Complete Check"
          note="Coming soon: check what's in the box against everything that originally shipped with this figure, and see how much a missing piece changes its value."
        />
        <ComingSoon
          title="Wave &amp; Build-a-Figure Map"
          note="Coming soon: which wave this figure belongs to, and what build-a-figure piece it includes."
        />
        <ComingSoon
          title="Compared With Its Closest Prior Release"
          note="Coming soon: a side-by-side against the previous version of this character."
        />
      </div>
    </section>
  )
}
