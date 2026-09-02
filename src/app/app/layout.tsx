import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import AppShell from './AppShell'

// 2026-09-03: the root layout no longer mounts ClerkProvider (Clerk off
// public pages — see src/app/layout.tsx + src/app/_lib/sessionHint.ts), so
// /app carries its own, SINGLE provider again. `dynamic` is correct here:
// /app is per-request auth()-rendered and clerkMiddleware() covers it
// (needsClerkPipeline in routeClassification.ts). The 2026-07-07 redirect-
// loop concern was about TWO nested providers for one publishableKey; with
// the root one gone this is Clerk's standard single-provider shape.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <AppShell>{children}</AppShell>
    </ClerkProvider>
  )
}
