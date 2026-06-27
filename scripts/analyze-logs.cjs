// Analyze a Cloudflare Workers Logs CSV export (1h sample) — human vs bot, top IPs,
// top paths, price-endpoint scrape signal, and whether the new guide pages got traffic.
// Read-only. Run: node scripts/analyze-logs.cjs "<path-to-csv>"
const fs = require('fs')
const file = process.argv[2]
const raw = fs.readFileSync(file, 'utf8')
const lines = raw.split(/\r?\n/).filter((l) => l.length)

function parseLine(line) {
  const out = []; let cur = ''; let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

const header = parseLine(lines[0])
const idx = (name) => header.indexOf(name)
const C = {
  ua: idx('$workers.event.request.headers.user-agent'),
  ip: idx('$workers.event.request.headers.cf-connecting-ip'),
  path: idx('$workers.event.request.path'),
  url: idx('$workers.event.request.url'),
  status: idx('$workers.event.response.status'),
  org: idx('$workers.event.request.cf.asOrganization'),
  botcat: idx('$workers.event.request.cf.verifiedBotCategory'),
  country: idx('$workers.event.request.cf.country'),
  asn: idx('$workers.event.request.cf.asn'),
  script: idx('$workers.scriptName'),
}

const rows = lines.slice(1).map(parseLine).filter((r) => r.length > 5)

const BOT_UA = /bot|spider|crawl|slurp|bingpreview|googlebot|bingbot|gptbot|claudebot|claude-web|ccbot|bytespider|ahrefs|semrush|mj12|dotbot|petalbot|amazonbot|applebot|yandex|facebookexternalhit|headless|python-requests|python-httpx|go-http|curl|wget|axios|node-fetch|scrapy|httpclient/i
const DATACENTER = /amazon|aws|google\b|google cloud|microsoft|azure|ovh|hetzner|digitalocean|linode|vultr|oracle|alibaba|tencent|cloudflare|leaseweb|contabo|choopa|gcore|scaleway|datacamp|m247|cogent/i

const ipCount = {}, orgCount = {}, botcatCount = {}, statusCount = {}, pathBucket = {}, uaTop = {}
let verifiedBot = 0, uaBot = 0, datacenter = 0, likelyHuman = 0
const priceHits = [], guideHits = {}, humanIPs = new Set()
const ipMeta = {}

function bucket(p) {
  if (!p) return '(none)'
  if (p.startsWith('/figure/')) return '/figure/*'
  if (p.startsWith('/guides/')) return '/guides/*'
  if (p.startsWith('/api/')) return p.split('?')[0]
  if (p.match(/^\/[^/]+\/character\//)) return '/{genre}/character/*'
  if (p.match(/^\/[^/]+\/[^/]+\/[^/]+$/)) return '/{genre}/{line}/{fig}'
  if (p.match(/^\/[^/]+\/[^/]+$/)) return '/{genre}/{line}'
  if (p.match(/^\/[^/]+$/)) return p
  return p.slice(0, 40)
}

for (const r of rows) {
  const ua = r[C.ua] || '', ip = r[C.ip] || '?', path = r[C.path] || '', org = r[C.org] || '(unknown)'
  const status = r[C.status] || '?', botcat = r[C.botcat] || '', country = r[C.country] || '?'
  ipCount[ip] = (ipCount[ip] || 0) + 1
  orgCount[org] = (orgCount[org] || 0) + 1
  statusCount[status] = (statusCount[status] || 0) + 1
  botcatCount[botcat || '(none)'] = (botcatCount[botcat || '(none)'] || 0) + 1
  pathBucket[bucket(path)] = (pathBucket[bucket(path)] || 0) + 1
  if (!ipMeta[ip]) ipMeta[ip] = { org, country, ua: ua.slice(0, 60), n: 0 }
  ipMeta[ip].n++

  const isVerified = botcat && botcat !== '' && botcat !== 'Unknown'
  const isUaBot = BOT_UA.test(ua) || ua === '' || ua === '-'
  const isDC = DATACENTER.test(org)
  if (isVerified) verifiedBot++
  if (isUaBot) uaBot++
  if (isDC) datacenter++
  const human = !isVerified && !isUaBot && !isDC && /mozilla/i.test(ua)
  if (human) { likelyHuman++; humanIPs.add(ip) }

  if (/price-check|price-summaries/.test(path)) priceHits.push({ ip, path: (r[C.url] || path).slice(0, 70), ua: ua.slice(0, 40), human })
  if (path.startsWith('/guides/')) { const g = path.replace(/\/$/, ''); guideHits[g] = (guideHits[g] || 0) + 1 }
  if (BOT_UA.test(ua)) { const m = ua.match(/([A-Za-z0-9_-]*bot[A-Za-z0-9_-]*|[A-Za-z]+spider|GPTBot|CCBot|Bytespider|Googlebot|bingbot|ClaudeBot|Amazonbot|Applebot|YandexBot|AhrefsBot|SemrushBot)/i); const k = (m ? m[1] : 'other-bot').toLowerCase(); uaTop[k] = (uaTop[k] || 0) + 1 }
}

const sort = (o, n = 15) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)
const total = rows.length

console.log('=== TOTAL requests in sample:', total, '| unique IPs:', Object.keys(ipCount).length, '===')
console.log('\n=== TRAFFIC COMPOSITION (estimate) ===')
console.log('verified good bots (CF botcat):', verifiedBot, `(${(verifiedBot/total*100).toFixed(0)}%)`)
console.log('bot-like UA (incl. empty UA): ', uaBot, `(${(uaBot/total*100).toFixed(0)}%)`)
console.log('datacenter ASN:               ', datacenter, `(${(datacenter/total*100).toFixed(0)}%)`)
console.log('LIKELY HUMAN (browser UA, non-bot, non-DC):', likelyHuman, `(${(likelyHuman/total*100).toFixed(0)}%)  across`, humanIPs.size, 'unique IPs')

console.log('\n=== STATUS CODES ===')
for (const [k, v] of sort(statusCount)) console.log(`  ${k}: ${v}`)

console.log('\n=== verifiedBotCategory ===')
for (const [k, v] of sort(botcatCount)) console.log(`  ${k}: ${v}`)

console.log('\n=== TOP BOTS (by UA) ===')
for (const [k, v] of sort(uaTop, 12)) console.log(`  ${k}: ${v}`)

console.log('\n=== TOP ASN / ORG ===')
for (const [k, v] of sort(orgCount, 12)) console.log(`  ${v}\t${k}`)

console.log('\n=== TOP IPs (scrape-watch) ===')
for (const [ip, n] of sort(ipCount, 15)) { const m = ipMeta[ip]; console.log(`  ${n}\t${ip}\t${m.country}\t${m.org.slice(0,28)}\t${m.ua}`) }

console.log('\n=== TOP PATH BUCKETS ===')
for (const [k, v] of sort(pathBucket, 18)) console.log(`  ${v}\t${k}`)

console.log('\n=== PRICE-ENDPOINT HITS (site only; r2proxy is separate worker) ===')
console.log('count:', priceHits.length, '| human:', priceHits.filter(h => h.human).length)
priceHits.slice(0, 10).forEach(h => console.log(`  ${h.human ? 'HUMAN' : 'bot  '} ${h.ip}  ${h.path}`))

console.log('\n=== GUIDE PAGE HITS (did the new Bid Check pages get traffic?) ===')
for (const [k, v] of sort(guideHits, 20)) console.log(`  ${v}\t${k}`)
