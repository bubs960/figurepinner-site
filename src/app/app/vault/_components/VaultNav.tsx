'use client'
// VaultNav — the signed-in slim nav from the vault-shelf mockup. Same visual
// system as the shelf pages' nav but with Clerk's UserButton + a gold
// "Your Vault" active label instead of Log in / Sign up.

import { UserButton } from '@clerk/nextjs'

const LINKS = [
  { label: 'Search', href: '/search' },
  { label: 'Guides', href: '/guides' },
  { label: 'The Hunt', href: '#hunt' },
  { label: 'Wantlist', href: '/app/wantlist' },
]

export default function VaultNav() {
  return (
    <header className="vlt-nav">
      <div className="vlt-nav-in">
        <a className="vlt-logo" href="/">
          <span className="vlt-pin-dot" />FIGURE<em>PINNER</em>
        </a>
        <nav className="vlt-nav-links">
          {LINKS.map(l => <a key={l.label} href={l.href}>{l.label}</a>)}
        </nav>
        <span className="vlt-nav-me">
          <span className="vlt-me-label" aria-current="page">Your Vault</span>
          <UserButton afterSignOutUrl="/" />
        </span>
      </div>
    </header>
  )
}
