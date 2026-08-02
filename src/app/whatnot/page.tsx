import type { Metadata } from 'next'
import SiteHeader from '@/app/components/SiteHeader'
import { WHATNOT_SELLERS, WHATNOT_INVITE } from './_data/sellers'

export const metadata: Metadata = {
  title: 'Whatnot Sellers We Trust — Live Action Figure Auctions',
  description: 'A permission-first list of Whatnot sellers FigurePinner collectors watch for live action figure auctions and breaks — plus how to join Whatnot yourself.',
  alternates: { canonical: 'https://figurepinner.com/whatnot' },
  openGraph: {
    title: 'Whatnot Sellers We Trust',
    description: 'Live action figure auctions and breaks, sold by sellers FigurePinner has vetted directly.',
    url: 'https://figurepinner.com/whatnot',
  },
}

export const revalidate = 86400 // static page — emit s-maxage for the colo edge cache

// Every outbound Whatnot link routes through /go/whatnot for tracked, logged
// clicks (src/app/go/[retailer]/route.ts) — Whatnot has no affiliate program
// (confirmed Steve 2026-06-13), so this is click visibility only, not revenue.
function trackedWhatnotUrl(destination: string, ref: string): string {
  return `/go/whatnot?url=${encodeURIComponent(destination)}&ref=${encodeURIComponent(ref)}`
}

export default function WhatnotSellersPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>

      <SiteHeader crumbs={[{ label: 'Whatnot' }]} />

      <main>

        {/* Hero + invite CTA (separate from the seller list below) */}
        <section style={{
          maxWidth: '760px', margin: '0 auto',
          padding: '4rem 1.5rem 3rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.12em',
            color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '1rem',
          }}>
            Whatnot
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            letterSpacing: '0.04em',
            marginBottom: '1.25rem',
            lineHeight: '1.1',
          }}>
            WHATNOT SELLERS<br />WE TRUST.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--muted)', lineHeight: '1.75', maxWidth: '580px', marginBottom: '1.75rem' }}>
            Live auctions and breaks move fast, and not every seller is worth your time.
            Here are the ones FigurePinner has vetted directly — sellers we watch, buy from,
            and are comfortable pointing collectors toward.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={trackedWhatnotUrl(WHATNOT_INVITE.inviteUrl, 'whatnot-page-invite')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              Join Whatnot — my invite link
            </a>
            <a
              href={trackedWhatnotUrl(WHATNOT_INVITE.profileUrl, 'whatnot-page-my-profile')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-lg"
            >
              @{WHATNOT_INVITE.handle} on Whatnot
            </a>
          </div>
        </section>

        {/* Seller list */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            APPROVED SELLERS
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.75', marginBottom: '1.75rem' }}>
            Every seller listed here gave permission to be featured before we linked to them.
            This list grows slowly and on purpose.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem' }}>
            {WHATNOT_SELLERS.map(seller => (
              <a
                key={seller.handle}
                href={trackedWhatnotUrl(seller.profileUrl, 'whatnot-page-seller')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 1.125rem',
                  background: 'var(--s1)', border: '1px solid var(--border)',
                  borderRadius: '10px', textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--s2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--blue)',
                }}>
                  {seller.handle.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--fp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{seller.handle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    View on Whatnot →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

      </main>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}
