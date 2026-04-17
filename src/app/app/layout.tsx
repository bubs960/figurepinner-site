'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

// Nav items
const NAV = [
  { href: '/app', label: 'Search', icon: SearchIcon },
  { href: '/app/wantlist', label: 'Want List', icon: HeartIcon },
  { href: '/app/alerts', label: 'Deal Alerts', icon: BellIcon },
  { href: '/app/vault', label: 'My Collection', icon: BoxIcon },
  { href: '/app/settings', label: 'Settings', icon: GearIcon },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      background: 'var(--s1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0',
      gap: '0',
    }}>
      {/* Wordmark */}
      <a href="/" style={{
        display: 'block',
        fontFamily: 'var(--font-display)',
        fontSize: '1.25rem',
        letterSpacing: '0.04em',
        color: 'var(--text)',
        textDecoration: 'none',
        padding: '0 1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
      }}>
        FIGURE<span style={{ color: 'var(--blue)' }}>PINNER</span>
      </a>

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

      {/* Pro upsell */}
      <div style={{ padding: '0.75rem 1rem', margin: '0 0.5rem 0.75rem', background: 'var(--s2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--blue)', marginBottom: '0.25rem' }}>FREE PLAN</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.625rem' }}>Upgrade for deal alerts + price history</div>
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
          Go Pro — $6.99/mo
        </a>
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <header style={{
      height: '52px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 1.5rem',
      background: 'var(--s1)',
      gap: '1rem',
    }}>
      <a href="/pro" style={{ fontSize: '0.8rem', color: 'var(--blue)', textDecoration: 'none', fontWeight: '500' }}>
        Upgrade to Pro
      </a>
      <UserButton afterSignOutUrl="/" />
    </header>
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
