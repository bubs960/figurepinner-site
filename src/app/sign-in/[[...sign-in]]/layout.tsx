import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'

export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      dynamic
      localization={{
        signIn: {
          start: {
            title: 'Sign in to FigurePinner',
            titleCombined: 'Sign in to FigurePinner',
            subtitle: 'Get back to your vault, wantlist, and deal alerts.',
            subtitleCombined: 'Get back to your vault, wantlist, and deal alerts.',
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
