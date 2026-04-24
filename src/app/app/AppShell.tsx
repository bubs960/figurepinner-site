'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'

// Nav items
const NAV = [
  { href: '/app', label: 'Search', icon: SearchIcon },
  { href: '/app/wantlist', label: 'Want List', icon: HeartIcon },
  { href: '/app/alerts', label: 'Deal Alerts', icon: BellIcon },
  { href: '/app/vault', label: 'My Collection', icon: BoxIcon },
  { href: '/app/settings', label: 'Settings', icon: GearIcon },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoaded } = useUser()
  const isPro = isLoaded ? ((user?.publicMetadata?.isPro as boolean) ?? false) : false

  // Close sidebar on route change (mobile)
  const pathname = usePathname()
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Close sidebar on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Responsive layout styles */}
      <style>{`
        .fp-shell { display: flex; min-height: 100vh; background: var(--bg); }
        .fp-sidebar {
          width: 220px; min-width: 220px;
          background: var(--s1); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; padding: 1.25rem 0;
          flex-shrink: 0;
        }
        .fp-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .fp-topbar {
          height: 52px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: flex-end;
          padding: 0 1.5rem; background: var(--s1); gap: 1rem;
          position: sticky; top: 0; z-index: 10;
        }
        .fp-content { flex: 1; padding: 1.5rem; overflow-y: auto; }
        .fp-hamburger { display: none; }
        .fp-overlay { display: none; }
        /* Mobile bottom nav */
        .fp-mobile-nav { display: none; }

        @media (max-width: 768px) {
          .fp-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0;
            z-index: 200; transform: translateX(-100%);
            transition: transform 0.25s ease;
            width: 260px; min-width: 260px;
          }
          .fp-sidebar.open { transform: translateX(0); }
          .fp-overlay {
            display: block; position: fixed; inset: 0; z-index: 190;
            background: rgba(0,0,0,0.6); opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease;
          }
          .fp-overlay.open { opacity: 1; pointer-events: auto; }
          .fp-hamburger {
            display: flex; align-items: center; justify-content: center;
            background: none; border: none; color: var(--text); cursor: pointer;
            padding: 4px; border-radius: 6px; margin-right: auto;
          }
          .fp-topbar { justify-content: flex-end; }
          .fp-content { padding: 1rem; padding-bottom: 80px; }
          .fp-mobile-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: var(--s1); border-top: 1px solid var(--border);
            z-index: 50; padding: 0; height: 60px;
          }
        }
      `}</style>

      {/* Overlay for mobile sidebar */}
      <div
        className={`fp-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="fp-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isPro={isPro} />

        <div className="fp-main">
          <TopBar onHamburger={() => setSidebarOpen(o => !o)} isPro={isPro} />
          <main className="fp-content">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileNav />
    </>
  )
}

function Sidebar({ open, onClose, isPro }: { open: boolean; onClose: () => void; isPro: boolean }) {
  const pathname = usePathname()

  return (
    <aside className={`fp-sidebar${open ? ' open' : ''}`}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <a href="/" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          letterSpacing: '0.04em',
          color: 'var(--text)',
          textDecoration: 'none',
        }}>
          FIGURE<span style={{ color: 'var(--blue)' }}>PINNER</span>
        </a>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          style={{
            display: 'none',
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', padding: '4px', borderRadius: '4px',
          }}
          className="fp-sidebar-close"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/app' && pathname.startsWith(href))
          return (
            <a
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                color: active ? 'var(--text)' : 'var(--muted)',
                background: active ? 'var(--s2)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: active ? '500' : '400',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </a>
          )
        })}
      </nav>

      {/* Plan indicator / Pro upsell */}
      {isPro ? (
        <div style={{ padding: '0.75rem 1rem', margin: '0 0.5rem 0.75rem', background: 'var(--s2)', borderRadius: '8px', border: '1px solid rgba(0,102,255,0.3)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--blue)', marginBottom: '0.125rem' }}>✦ PRO</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Unlimited vault, alerts, and history</div>
        </div>
      ) : (
        <div style={{ padding: '0.75rem 1rem', margin: '0 0.5rem 0.75rem', background: 'var(--s2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--blue)', marginBottom: '0.25rem' }}>FREE PLAN</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.625rem' }}>Upgrade for unlimited vault + full price history</div>
          <a href="/pro" style={{
            display: 'block',
            textAlign: 'center',
            padding: '0.375rem',
            background: 'var(--blue)',
            color: '#fff',
            borderRadius: '5px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textDecoration: 'none',
          }}>
            Go Pro — $3.99/mo
          </a>
        </div>
      )}

      {/* We Buy Collections CTA */}
      <a
        href="mailto:bubs960toys@gmail.com?subject=I%20want%20to%20sell%20my%20collection"
        style={{
          display: 'block',
          textAlign: 'center',
          margin: '0 0.5rem 0.75rem',
          padding: '0.5rem 0.75rem',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--muted)',
          textDecoration: 'none',
          fontSize: '0.7rem',
          lineHeight: '1.4',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--blue)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'
        }}
      >
        <span style={{ display: 'block', fontWeight: '600', fontSize: '0.75rem', color: 'var(--text)' }}>
          💰 We Buy Collections
        </span>
        Sell your figures — email us
      </a>

      {/* Mobile: show close X in sidebar header */}
      <style>{`
        @media (max-width: 768px) {
          .fp-sidebar-close { display: flex !important; }
        }
      `}</style>
    </aside>
  )
}

function TopBar({ onHamburger, isPro }: { onHamburger: () => void; isPro: boolean }) {
  return (
    <header className="fp-topbar">
      <button className="fp-hamburger" onClick={onHamburger} aria-label="Open menu">
        <HamburgerIcon />
      </button>
      {!isPro && (
        <a href="/pro" style={{ fontSize: '0.8rem', color: 'var(--blue)', textDecoration: 'none', fontWeight: '500' }}>
          Upgrade to Pro
        </a>
      )}
      <UserButton afterSignOutUrl="/" />
    </header>
  )
}

function MobileNav() {
  const pathname = usePathname()
  const mobileNav = NAV.slice(0, 4) // Search, Want List, Alerts, Collection

  return (
    <nav className="fp-mobile-nav">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/app' && pathname.startsWith(href))
        return (
          <a
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: active ? 'var(--blue)' : 'var(--muted)',
              textDecoration: 'none',
              fontSize: '0.65rem',
              fontWeight: active ? '600' : '400',
              padding: '0.5rem 0',
            }}
          >
            <Icon size={20} />
            {label}
          </a>
        )
      })}
    </nav>
  )
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>
  )
}
function HeartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5S2 9.5 2 5.5a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 8-6 8z" />
    </svg>
  )
}
function BellIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 2a4 4 0 0 1 4 4v3l1 1H3l1-1V6a4 4 0 0 1 4-4z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}
function BoxIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="12" height="9" rx="1" />
      <path d="M5 5V4a3 3 0 0 1 6 0v1" />
    </svg>
  )
}
function GearIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.6 3.6l1 1M11.4 11.4l1 1M12.4 3.6l-1 1M4.6 11.4l-1 1" />
    </svg>
  )
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="15" x2="17" y2="15" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="4" x2="14" y2="14" />
      <line x1="14" y1="4" x2="4" y2="14" />
    </svg>
  )
}
