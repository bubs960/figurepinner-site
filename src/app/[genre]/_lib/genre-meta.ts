export const GENRE_META: Record<string, {
  label: string
  description: string
  accent: string
  highlights: string[]
  ticketCta?: { label: string; href: string; badge?: string; cta?: string } | null
}> = {
  'wrestling': { label: 'Wrestling', description: 'WWE, AEW, and wrestling action figure prices. Track Mattel Elite, Hasbro, Jakks, and Entrance Greats values across 5,000+ figures.', accent: '#e53238', highlights: ['Mattel Elite', 'Jakks Pacific', 'Hasbro WWF'] },
  'marvel': { label: 'Marvel', description: 'Marvel Legends, Spider-Man, and Marvel action figure prices. Track Hasbro and ToyBiz values across your collection.', accent: '#e23636', highlights: ['Marvel Legends', 'ToyBiz Classics', 'Spider-Man'] },
  'star-wars': { label: 'Star Wars', description: 'Star Wars action figure prices. Black Series, Vintage Collection, Power of the Force values with real eBay sold data.', accent: '#3d7bca', highlights: ['Black Series', 'Vintage Collection', 'Power of the Force'] },
  'dc': { label: 'DC', description: 'DC action figure prices. McFarlane, DC Direct, DC Universe Classics values with real eBay sold data.', accent: '#3a6fbf', highlights: ['McFarlane Toys', 'DC Universe Classics', 'DC Direct'] },
  'transformers': { label: 'Transformers', description: 'Transformers action figure prices. Masterpiece, Studio Series, Generations values with real eBay sold data.', accent: '#c44f0e', highlights: ['Masterpiece', 'Studio Series', 'Generations'] },
  'gijoe': { label: 'G.I. Joe', description: 'G.I. Joe action figure prices. Classified Series, vintage values with real eBay sold data.', accent: '#2e7d32', highlights: ['Classified Series', 'A Real American Hero', 'Sigma 6'] },
  'masters-of-the-universe': { label: 'Masters of the Universe', description: 'Masters of the Universe action figure prices. Origins, Masterverse, vintage MOTU values.', accent: '#b8860b', highlights: ['Masterverse', 'Origins', 'Vintage MOTU'] },
  'teenage-mutant-ninja-turtles': { label: 'TMNT', description: 'Teenage Mutant Ninja Turtles action figure prices. NECA, Playmates, Super7 values with real eBay sold data.', accent: '#2e7d32', highlights: ['NECA Ultimate', 'Playmates Vintage', 'Super7 ReAction'] },
  'power-rangers': { label: 'Power Rangers', description: 'Power Rangers action figure prices. Lightning Collection, vintage values with real eBay sold data.', accent: '#d32f2f', highlights: ['Lightning Collection', 'Vintage Bandai', 'Legacy'] },
  'indiana-jones': { label: 'Indiana Jones', description: 'Indiana Jones action figure prices. Adventure Series values with real eBay sold data.', accent: '#8d6e63', highlights: ['Adventure Series', 'Vintage Kenner'] },
  'ghostbusters': { label: 'Ghostbusters', description: 'Ghostbusters action figure prices. Plasma Series, vintage values with real eBay sold data.', accent: '#5e35b1', highlights: ['Plasma Series', 'Kenner Real Ghostbusters', 'Afterlife'] },
  'mythic-legions': { label: 'Mythic Legions', description: 'Mythic Legions action figure prices. Four Horsemen values with real eBay sold data.', accent: '#7b5e3a', highlights: ['Four Horsemen', 'Advent of Decay', 'Necronominus'] },
  'thundercats': { label: 'Thundercats', description: 'Thundercats action figure prices. Super7, LJN vintage values with real eBay sold data.', accent: '#f57c00', highlights: ['Super7 Ultimates', 'LJN Vintage', 'Bandai'] },
  'action-force': { label: 'Action Force', description: 'Action Force action figure prices. Values with real eBay sold data.', accent: '#455a64', highlights: ['Action Force'] },
  'dungeons-and-dragons': { label: 'Dungeons & Dragons', description: 'Dungeons & Dragons action figure prices. Values with real eBay sold data.', accent: '#6a0dad', highlights: ['LJN Vintage', 'Hasbro'] },
}
