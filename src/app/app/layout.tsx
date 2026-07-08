import type { ReactNode } from 'react'
import AppShell from './AppShell'

// Was <ClerkProvider dynamic> wrapping AppShell, nested inside root layout's
// own <ClerkProvider> (added S70, 2026-07-07). A live customer report same
// day: sign-up -> email verify -> stuck in a redirect loop back to sign-in.
// Suspect: two nested ClerkProvider instances for the same publishableKey on
// /app, one non-dynamic (root) + one dynamic (here) -- not Clerk's standard
// single-provider pattern, and specifically covers the exact flow (fresh
// session right after verification) that broke. /app is already forced
// dynamic by its own auth()-dependent rendering regardless of this flag, so
// the nested provider was redundant even before the bug. Collapsed back to
// the single root ClerkProvider. UNVERIFIED end-to-end (no test-email access
// this session) -- confirm with a real sign-up cycle before calling this
// closed.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
