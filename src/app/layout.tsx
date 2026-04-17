import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FigurePinner — Action Figure Price Intelligence',
    template: '%s | FigurePinner',
  },
  description:
    'The action figure collector\'s edge. Real sold prices, series completion tracking, and deal alerts — powered by 700K+ eBay listings across 20K figures.',
  keywords: [
    'action figure prices',
    'WWE figure prices',
    'wrestling figure values',
    'action figure collection tracker',
    'eBay sold prices',
    'figure price guide',
  ],
  authors: [{ name: 'FigurePinner' }],
  creator: 'FigurePinner',
  metadataBase: new URL('https://figurepinner.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://figurepinner.com',
    siteName: 'FigurePinner',
    title: 'FigurePinner — Action Figure Price Intelligence',
    description:
      'Real sold prices, series completion tracking, and deal alerts for action figure collectors.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FigurePinner — Action Figure Price Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FigurePinner — Action Figure Price Intelligence',
    description: 'Real sold prices for 20K+ action figures across 17 genres.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090F',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Google Fonts — preconnect first for perf */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
