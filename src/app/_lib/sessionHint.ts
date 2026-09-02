'use client'

// sessionHint — "is this visitor probably signed in?" WITHOUT loading Clerk.
//
// Why (2026-09-03, webaudit "Clerk on anonymous pages" finding, speed
// scorecard 9/2): the root layout used to wrap every public page in
// <ClerkProvider>, which hot-loads clerk.browser.js (~314 KB transfer,
// ~705 KB decoded) plus /v1/environment + /v1/client round-trips to
// clerk.figurepinner.com on EVERY page view — for a visitor who is not
// signed in and will not sign in (~99% of figure/hub traffic). Public pages
// now have NO ClerkProvider at all. The only thing they need from auth is a
// boolean, and Clerk already leaves that on the domain for free:
//
//   `__client_uat` — a non-HttpOnly cookie clerk-js maintains on the site's
//   root domain. Value is the unix time the client session was last updated,
//   or "0" once signed out. Present-and-nonzero => there is (probably) a live
//   session; absent/"0" => anonymous. It is a HINT, not authorization — every
//   server route still verifies the HttpOnly `__session` cookie via
//   clerkMiddleware()/auth(); a stale hint just means one 401 from /api/vault,
//   which vaultAdd/useOwnershipStatus already handle.
//
// Consumers on public pages (SiteHeader account block, useOwnershipStatus)
// read this instead of Clerk's useUser(). Visitors WITH a hint get the real
// Clerk widget mounted as a lazy island (ClerkAccountIsland) — so signed-in
// users still see their avatar/menu; anonymous visitors never load clerk-js.
//
// Hydration: public pages are static/ISR — the server cannot know the cookie,
// so the hint is ALWAYS false during SSR and React's first client render, and
// flips in an effect. Same post-hydration idiom as SiteHeader's useMounted()
// (2026-08-05 React #418 fix) — do not read document.cookie in render.

import { useEffect, useState } from 'react'

const CLERK_UAT_COOKIE = '__client_uat'

export function readSessionHint(): boolean {
  if (typeof document === 'undefined') return false
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const eq = part.indexOf('=')
    const name = (eq === -1 ? part : part.slice(0, eq)).trim()
    if (name !== CLERK_UAT_COOKIE) continue
    const value = eq === -1 ? '' : part.slice(eq + 1).trim()
    return value !== '' && value !== '0'
  }
  return false
}

// false on the server and on the first client render; true after the
// post-hydration effect iff the Clerk session-hint cookie is set.
export function useSessionHint(): boolean {
  const [hinted, setHinted] = useState(false)
  useEffect(() => {
    setHinted(readSessionHint())
  }, [])
  return hinted
}
