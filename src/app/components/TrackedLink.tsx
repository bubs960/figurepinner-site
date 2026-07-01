'use client'

import type { AnchorHTMLAttributes } from 'react'
import { trackFunnel, type FunnelEvent } from '@/app/_lib/funnelClient'

type Detail = Record<string, string | number | boolean | null | undefined>

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  funnelEvent?: FunnelEvent
  funnelDetail?: Detail
}

export default function TrackedLink({
  funnelEvent,
  funnelDetail,
  onClick,
  ...props
}: Props) {
  return (
    <a
      {...props}
      onClick={event => {
        if (funnelEvent) trackFunnel(funnelEvent, funnelDetail)
        onClick?.(event)
      }}
    />
  )
}
