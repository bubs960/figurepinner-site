'use client'

// The ONLY place a public page mounts Clerk (2026-09-03, Clerk-off-public-
// pages). Rendered by ClerkAccountIsland via next/dynamic({ ssr:false }) and
// only for visitors whose session-hint cookie is set (see sessionHint.ts), so
// clerk.browser.js is fetched by signed-in visitors alone. Wrapping just this
// widget in its own <ClerkProvider> keeps the page tree stable — no remount of
// the page when the hint resolves, because nothing outside this island is a
// Clerk descendant. /app, /sign-in and /sign-up keep their own providers.

import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs'

export default function ClerkAccountIslandInner() {
  return (
    <ClerkProvider>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </ClerkProvider>
  )
}
