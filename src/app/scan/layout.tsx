/**
 * /scan layout — exists only to carry metadata: page.tsx is 'use client'
 * (camera + BarcodeDetector state) and client components can't export
 * metadata. Before S52 this fully-working scanner shipped with no title,
 * no description, no canonical, and zero inbound links — a built feature
 * nobody could find.
 */

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  // Root layout title template appends '| FigurePinner' — don't repeat it here.
  title: 'Scan a Figure Barcode — Instant Price Lookup',
  description:
    'Point your camera at the barcode on an action figure box and get its real eBay sold prices instantly. Manual UPC entry supported. Free.',
  alternates: { canonical: 'https://figurepinner.com/scan' },
}

export default function ScanLayout({ children }: { children: ReactNode }) {
  return children
}
