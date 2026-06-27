// Hunt the 1h log for ANY human-shaped request: real browser UA (not a bot),
// and any hit to human-intent pages (homepage, guides, search, about).
// Run: node scripts/find-humans.cjs "<csv>"
const fs = require('fs')
const raw = fs.readFileSync(process.argv[2], 'utf8')
const lines = raw.split(/\r?\n/).filter(Boolean)
function parseLine(line){const o=[];let c='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'){if(line[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else{if(ch==='"')q=true;else if(ch===','){o.push(c);c=''}else c+=ch}}o.push(c);return o}
const H=parseLine(lines[0]); const ix=n=>H.indexOf(n)
const C={ua:ix('$workers.event.request.headers.user-agent'),ip:ix('$workers.event.request.headers.cf-connecting-ip'),path:ix('$workers.event.request.path'),url:ix('$workers.event.request.url'),org:ix('$workers.event.request.cf.asOrganization'),country:ix('$workers.event.request.cf.country'),botcat:ix('$workers.event.request.cf.verifiedBotCategory')}
const rows=lines.slice(1).map(parseLine).filter(r=>r.length>5)

const BOT=/bot|spider|crawl|slurp|gptbot|claudebot|claude-|ccbot|bytespider|ahrefs|semrush|mj12|dotbot|petalbot|amazonbot|applebot|yandex|facebookexternal|headless|python-|go-http|curl|wget|axios|node-fetch|scrapy|amzn|searchbot|monitoring|uptime|fp-sentinel/i
const REALBROWSER=/Mozilla\/5\.0.*(Chrome\/\d|Firefox\/\d|Version\/\d+.*Safari|Edg\/\d|CriOS\/\d|FxiOS\/\d)/
// real browser UA, NOT a bot
const humans=rows.filter(r=>{const ua=r[C.ua]||'';return REALBROWSER.test(ua)&&!BOT.test(ua)})
console.log('=== requests with a REAL non-bot browser UA:', humans.length, 'of', rows.length, '===')
const byIp={}
humans.forEach(r=>{const ip=r[C.ip]||'?';(byIp[ip]=byIp[ip]||{n:0,org:r[C.org],country:r[C.country],ua:(r[C.ua]||'').slice(0,90),paths:new Set()}).n++;byIp[ip].paths.add((r[C.path]||'').slice(0,50))})
Object.entries(byIp).sort((a,b)=>b[1].n-a[1].n).forEach(([ip,m])=>{console.log(`\n  ${m.n} req  ${ip}  ${m.country}  ${m.org}`);console.log('    UA:',m.ua);console.log('    paths:',[...m.paths].slice(0,8).join(' , '))})

console.log('\n\n=== ALL hits to HUMAN-INTENT paths (not /figure/*, not assets) ===')
const intent=rows.filter(r=>{const p=r[C.path]||'';return p && !p.startsWith('/figure/') && !p.startsWith('/_next') && !p.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|xml|txt)$/) && p!=='/robots.txt'})
console.log('count:', intent.length)
intent.slice(0,40).forEach(r=>{const ua=(r[C.ua]||'').slice(0,55);const isBot=BOT.test(ua)||!REALBROWSER.test(ua);console.log(`  ${isBot?'bot ':'HUMAN'} ${(r[C.path]||'').slice(0,40).padEnd(40)} ${r[C.country]} ${(r[C.org]||'').slice(0,22).padEnd(22)} ${ua}`)})
