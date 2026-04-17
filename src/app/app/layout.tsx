// Server component — sets edge runtime for the entire /app route tree
export const runtime = 'edge'

import type { ReactNode } from 'react'
import AppShell from './AppShell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
