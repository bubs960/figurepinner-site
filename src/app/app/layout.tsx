import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import AppShell from './AppShell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <AppShell>{children}</AppShell>
    </ClerkProvider>
  )
}
