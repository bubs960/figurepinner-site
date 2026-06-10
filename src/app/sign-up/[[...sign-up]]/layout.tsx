import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      dynamic
      localization={{
        signUp: {
          start: {
            title: 'Create your FigurePinner account',
            titleCombined: 'Create your FigurePinner account',
            subtitle: 'Start your vault, pin grails, and track price moves.',
            subtitleCombined: 'Start your vault, pin grails, and track price moves.',
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
