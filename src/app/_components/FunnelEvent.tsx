'use client'

import { useEffect } from 'react'
import { trackFunnel, type FunnelEvent } from '@/app/_lib/funnelClient'

type Detail = Record<string, string | number | boolean | null | undefined>

export default function FunnelEvent({ event, detail }: { event: FunnelEvent; detail?: Detail }) {
  useEffect(() => {
    trackFunnel(event, detail)
  }, [event, detail])

  return null
}
