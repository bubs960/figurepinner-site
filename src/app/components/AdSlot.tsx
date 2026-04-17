'use client'

/**
 * AdSlot — placeholder for Google AdSense units.
 *
 * Usage:
 *   <AdSlot slot="leaderboard" />   // 728×90 top banner
 *   <AdSlot slot="rectangle" />     // 300×250 inline
 *   <AdSlot slot="wide-skyscraper" /> // 160×600 sidebar
 *
 * Before AdSense approval: renders a dimmed placeholder box.
 * After approval: swap `ADSENSE_CLIENT` env var and uncomment the <ins> tag.
 *
 * To enable:
 *   1. Set NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-XXXXXXXXXX" in Cloudflare env vars
 *   2. Add the AdSense <script> tag to src/app/layout.tsx
 *   3. Uncomment the <ins> block below and remove the placeholder div
 */

type SlotConfig = {
  width: number
  height: number
  adSlotId: string  // from AdSense dashboard once approved
  label: string
}

const SLOT_CONFIG: Record<string, SlotConfig> = {
  'leaderboard':    { width: 728, height: 90,  adSlotId: 'TODO', label: 'Leaderboard (728×90)' },
  'rectangle':      { width: 300, height: 250, adSlotId: 'TODO', label: 'Rectangle (300×250)' },
  'wide-skyscraper': { width: 160, height: 600, adSlotId: 'TODO', label: 'Wide Skyscraper (160×600)' },
  'mobile-banner':  { width: 320, height: 50,  adSlotId: 'TODO', label: 'Mobile Banner (320×50)' },
}

type Props = {
  slot: keyof typeof SLOT_CONFIG
  className?: string
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ''

export default function AdSlot({ slot, className }: Props) {
  const config = SLOT_CONFIG[slot]
  if (!config) return null

  // AdSense not yet configured — show placeholder
  if (!ADSENSE_CLIENT || ADSENSE_CLIENT === '') {
    if (process.env.NODE_ENV === 'production') return null  // hide in prod until approved
    return (
      <div
        className={className}
        style={{
          width: config.width,
          height: config.height,
          maxWidth: '100%',
          background: 'var(--s2)',
          border: '1px dashed var(--border)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          color: 'var(--dim)',
          fontSize: '10px',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span>AD SLOT</span>
        <span>{config.label}</span>
      </div>
    )
  }

  // AdSense approved — render real unit
  // Uncomment after adding your AdSense pub ID and slot IDs above
  /*
  return (
    <ins
      className={`adsbygoogle${className ? ` ${className}` : ''}`}
      style={{ display: 'inline-block', width: config.width, height: config.height }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={config.adSlotId}
    />
  )
  */

  return null
}
