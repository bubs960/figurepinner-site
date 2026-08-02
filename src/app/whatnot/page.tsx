import type { Metadata } from 'next'
import SiteHeader from '@/app/components/SiteHeader'
import { WHATNOT_SELLERS, WHATNOT_INVITE } from './_data/sellers'

export const metadata: Metadata = {
  title: 'Whatnot Sellers We Trust — Live Action Figure Auctions',
  description: 'Whatnot sellers worth watching for live action figure auctions and breaks — plus how to join Whatnot yourself.',
  alternates: { canonical: 'https://figurepinner.com/whatnot' },
  openGraph: {
    title: 'Whatnot Sellers We Trust',
    description: 'Live action figure auctions and breaks — a few sellers worth watching.',
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
            WHATNOT SELLERS
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--muted)', lineHeight: '1.75', maxWidth: '580px', marginBottom: '1.75rem' }}>
            Live action figure auctions and breaks — a few sellers worth watching.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- raw <img> throughout this app, unoptimized:true in next.config.ts */}
            <img
              src={WHATNOT_INVITE.photoUrl}
              alt={WHATNOT_INVITE.handle}
              width={40}
              height={40}
              style={{
                flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%',
                objectFit: 'cover', background: 'var(--s2)', border: '1px solid var(--border)',
              }}
            />
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '1.75rem' }}>
            FEATURED SELLERS
          </h2>
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
                {/* eslint-disable-next-line @next/next/no-img-element -- raw <img> throughout this app, unoptimized:true in next.config.ts. No onError fallback: this is a Server Component and event handlers can't cross to client-rendered img props here. */}
                <img
                  src={seller.photoUrl}
                  alt={seller.handle}
                  width={36}
                  height={36}
                  style={{
                    flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
                    objectFit: 'cover', background: 'var(--s2)', border: '1px solid var(--border)',
                  }}
                />
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
