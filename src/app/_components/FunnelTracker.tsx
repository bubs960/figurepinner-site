'use client'

import { useEffect } from 'react'
import { trackFunnel } from '@/app/_lib/funnelClient'

export default function FunnelTracker() {
  useEffect(() => {
    trackFunnel('landing')
  }, [])

  return null
}
