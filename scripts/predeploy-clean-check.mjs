/**
 * predeploy-clean-check.mjs — REFUSE to deploy from a dirty working tree,
 * or from an environment where a NEXT_PUBLIC_* var will drift between what
 * SSR sees and what the client bundle gets built with.
 *
 * WHY (2026-07-03, web S52): `npm run deploy` builds from the WORKING TREE,
 * not from git. On 7/3 a deploy shipped modified-but-uncommitted KB data files
 * nobody had reviewed — no commit records what went live, so there is nothing
 * to diff or roll back to. post-deploy-git-check.mjs makes that drift LOUD
 * after the fact; this guard makes it a DECISION before the fact.
 *
 * Behavior:
 *   - clean tree                          -> pass silently
 *   - dirty tree, ONLY known KB-sync files -> auto-commit them, then pass
 *     (2026-07-10: nightly-photo-hydration.cmd syncs rehosted image URLs into
 *     these exact files and deliberately does NOT commit — "sits in the
 *     bundle until a Steve npm run deploy" by design. That made this guard
 *     trip on every deploy touching a day PhotoHydration ran, forcing
 *     FP_ALLOW_DIRTY as a routine step instead of a rare deliberate one —
 *     the opposite of this file's own stated intent. Auto-committing this
 *     SPECIFIC, narrow, known-safe allowlist restores the exact traceability
 *     the guard exists to protect — a real, diffable, revertable commit —
 *     without weakening the check for anything else: one unexpected dirty
 *     file anywhere else still refuses exactly as before.)
 *   - dirty tree, anything else            -> print every dirty path, refuse (exit 1)
 *   - FP_ALLOW_DIRTY set                   -> print the dirty list, deploy anyway (exit 0)
 *
 * The override still exists for the genuinely unusual case — but the common,
 * expected KB-sync case no longer needs it.
 *
 * SECOND, UNRELATED CHECK (2026-08-06, standalone ruling on
 * WEB-TO-STANDALONE-HYDRATION-ALERT-CLASS-QUESTION-2026-08-05.md): NEXT_PUBLIC_*
 * env-var drift between wrangler.toml's [vars] (RUNTIME value, what SSR sees
 * inside the deployed Worker) and .env.local (BUILD-TIME value, what Next.js
 * actually inlines into the CLIENT bundle). These are two unrelated
 * mechanisms that only coexist on the machine running `npm run deploy` — a
 * key can be "1" at runtime and simultaneously absent at build time with no
 * error anywhere, no diff, nothing to catch it, because .env.local is
 * gitignored and invisible to any Bridge-side or git-based check. That's
 * exactly how NEXT_PUBLIC_MOBILE_ACTION_BAR drifted for 5 weeks
 * (2026-07-01 to 2026-08-06) and threw React error #418 on every figure page
 * in production the whole time (see MobileActionBar.tsx, project_web_status_log.md
 * 2026-08-05 entry) — a console error, not a visible break, so nothing forced
 * anyone to notice. This is the mechanism-correct place for the check per
 * standalone's ruling: it runs on every deploy, on the one machine where both
 * files exist, before the build step that would bake the drift in.
 *   - every NEXT_PUBLIC_* key in wrangler.toml's [vars] is present in the
 *     build env (.env.local or already-exported shell env) -> pass silently
 *   - any is missing                       -> print the missing keys, refuse (exit 1)
 *   - no built-in override. The fix is one line in .env.local; if this ever
 *     needs bypassing, that's a sign the check itself needs revisiting, not
 *     a routine escape hatch like FP_ALLOW_DIRTY above.
 *
 * Pure-stdlib, ASCII-only (PowerShell cp1252-safe). Wired as the first step
 * of the "deploy" script in package.json.
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

// ── NEXT_PUBLIC_* build-time vs runtime drift check ─────────────────────────

/** Extract KEY = "value" (or bare KEY = value) entries from wrangler.toml's
 *  [vars] table only -- stops at the next [section] header so a same-named
 *  key under a different table (e.g. an env-specific override block) never
 *  gets mixed in. Deliberately line-based, not a real TOML parser: this repo
 *  has no TOML dependency and the [vars] shape here is simple enough that a
 *  full parser would be pure weight for zero extra correctness. */
function readWranglerVars(path) {
  if (!existsSync(path)) return {}
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  const vars = {}
  let inVars = false
  for (const raw of lines) {
    const line = raw.trim()
    if (/^\[.*\]$/.test(line)) { inVars = (line === '[vars]'); continue }
    if (!inVars || !line || line.startsWith('#')) continue
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/.exec(line)
    if (m) vars[m[1]] = m[2]
  }
  return vars
}

/** Parse KEY=value lines from a dotenv-style file. No quoting/escaping
 *  support beyond simple double-quote stripping -- matches this repo's own
 *  .env.local, which only ever holds plain URLs/ids/flags (see its own
 *  header: "Never put live secret keys in env files"). */
function readDotEnv(path) {
  if (!existsSync(path)) return {}
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  const vars = {}
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/.exec(line)
    if (m) vars[m[1]] = m[2]
  }
  return vars
}

function checkNextPublicDrift() {
  const wranglerVars = readWranglerVars('wrangler.toml')
  const buildEnv = { ...readDotEnv('.env.local'), ...process.env }
  const nextPublicKeys = Object.keys(wranglerVars).filter(k => k.startsWith('NEXT_PUBLIC_'))
  const missing = nextPublicKeys.filter(k => buildEnv[k] === undefined || buildEnv[k] === '')

  if (missing.length === 0) return true

  console.log('\n' + line)
  console.log(`[clean-check] ${missing.length} NEXT_PUBLIC_* var(s) set in wrangler.toml's [vars]`)
  console.log('              (the RUNTIME value SSR sees) but missing from the BUILD env')
  console.log('              (.env.local -- what Next.js inlines into the CLIENT bundle).')
  console.log('              Server and client will disagree on every render, throwing a')
  console.log('              React hydration error (#418) in production -- exactly how')
  console.log('              NEXT_PUBLIC_MOBILE_ACTION_BAR drifted for 5 weeks, 2026-07-01')
  console.log('              to 2026-08-06 (see project_web_status_log.md).')
  console.log(line)
  for (const k of missing) console.log(`  ${k} = "${wranglerVars[k]}"  (wrangler.toml)  ->  missing from .env.local`)
  console.log(line)
  console.log('[clean-check] REFUSING to deploy. Add the missing key(s) above to .env.local')
  console.log('              (same value as wrangler.toml), then rerun: npm run deploy')
  console.log('')
  return false
}

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd()
  } catch {
    return ''
  }
}

// Exact paths only (no globs) — deliberately narrow. Only a plain
// modification (" M") counts; an unexpected untracked/deleted/staged state
// on these paths is NOT auto-committed, it falls through to the normal
// refuse-and-decide path like anything else.
// figures-reference-v2.js.backup-pre-sync removed 2026-07-29 (Phase 4
// follow-up to d9d7840, 7/27): that file is untracked + gitignored now, so
// it can never appear as a tracked " M " change again and this entry could
// never match anything — dead, not just redundant.
const KB_SYNC_AUTOCOMMIT_PATHS = new Set([
  'src/data/figures-reference-v2.js',
  'src/data/figures-reference-v2.slim.js',
])

const line = '='.repeat(66)

// Matcher relay 2026-07-31 (470b230 close-out): the generic auto-sync commit
// message hid a 3-figure duplicate merge for 4 days. Name the fid delta in the
// commit body so a removal/add is visible in `git log` without diffing an 18MB
// file. Computed here (HEAD vs working tree) rather than read from the
// extension repo's sync log — self-contained, works even if that log moves.
function kbFidDelta() {
  const FID_RE = /"figure_id"\s*:\s*"([^"]+)"/g
  const extract = (text) => {
    const ids = new Set()
    for (const m of text.matchAll(FID_RE)) ids.add(m[1])
    return ids
  }
  const path = 'src/data/figures-reference-v2.slim.js'
  // NOT the git() helper: execSync's default 1MB maxBuffer throws ENOBUFS on
  // this 18MB file, and git() swallows that into '' — which silently disabled
  // the delta on its first live run (8b69e82, 2026-07-31). Errors here
  // propagate to the caller's catch, which logs the failure visibly.
  const before = extract(execSync(`git show HEAD:${path}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 128 * 1024 * 1024 }))
  const after = extract(readFileSync(path, 'utf8'))
  if (before.size === 0 || after.size === 0) return null // parse failure — don't report a bogus wipe
  const added = [...after].filter(id => !before.has(id))
  const removed = [...before].filter(id => !after.has(id))
  const list = (ids) => ids.slice(0, 20).join('\n  ') + (ids.length > 20 ? `\n  ... and ${ids.length - 20} more` : '')
  let body = `KB fid delta vs previous commit: +${added.length} / -${removed.length} (${after.size} total)`
  if (added.length) body += `\nAdded:\n  ${list(added)}`
  if (removed.length) body += `\nRemoved:\n  ${list(removed)}`
  return body
}

function tryAutoCommitKbSync(changes) {
  const onlyKbSyncMods = changes.every(c => {
    const m = /^ M (.+)$/.exec(c)
    return m && KB_SYNC_AUTOCOMMIT_PATHS.has(m[1].trim())
  })
  if (!onlyKbSyncMods) return false

  console.log('[clean-check] Only known KB-sync files are dirty (nightly-photo-hydration')
  console.log('              rehost -> sync_kb, expected). Auto-committing for a clean,')
  console.log('              diffable record instead of asking for FP_ALLOW_DIRTY:')
  for (const c of changes) console.log('  ' + c)
  try {
    execSync(`git add -- ${[...KB_SYNC_AUTOCOMMIT_PATHS].map(p => `"${p}"`).join(' ')}`, { stdio: ['ignore', 'pipe', 'pipe'] })
    let delta = null
    try { delta = kbFidDelta() } catch (e) {
      // Best-effort: never block the commit, but never fail silently either.
      console.log('[clean-check] fid-delta computation failed (commit proceeds with plain message): ' + String(e.message || e).split('\n')[0])
    }
    if (delta === null) console.log('[clean-check] NOTE: auto-sync commit will have NO fid-delta body this run.')
    if (delta) {
      // Body via a temp -F file would be overkill; -m accepts multiline but
      // shell-quoting ids is fragile — write through git's message file instead.
      writeFileSync('.git/FP_AUTOSYNC_MSG', `chore: auto-sync KB data files (predeploy guard, nightly rehost)\n\n${delta}\n`)
      execSync('git commit -F .git/FP_AUTOSYNC_MSG', { stdio: ['ignore', 'pipe', 'pipe'] })
    } else {
      execSync('git commit -m "chore: auto-sync KB data files (predeploy guard, nightly rehost)"', { stdio: ['ignore', 'pipe', 'pipe'] })
    }
  } catch (err) {
    console.log('[clean-check] Auto-commit FAILED -- falling back to the normal refuse/override path.')
    console.log('              ' + String(err.message || err).split('\n')[0])
    return false
  }
  console.log('[clean-check] Committed. Proceeding with a clean tree.\n')
  return true
}

// Independent of tree cleanliness -- runs first so a drift failure is never
// masked by an unrelated dirty-tree pass/refuse decision below.
if (!checkNextPublicDrift()) process.exit(1)

const porcelain = git('status --porcelain')

if (!porcelain) {
  console.log('[clean-check] Working tree clean. Deploying committed code only.')
  process.exit(0)
}

const changes = porcelain.split(/\r?\n/).filter(Boolean)

if (tryAutoCommitKbSync(changes)) process.exit(0)

const n = changes.length
const shown = changes.slice(0, 25)

console.log('\n' + line)
console.log(`[clean-check] ${n} uncommitted change(s) in the working tree.`)
console.log('              npm run deploy ships the WORKING TREE, not git HEAD --')
console.log('              these files would go live unreviewed and unrecorded:')
console.log(line)
for (const c of shown) console.log('  ' + c)
if (n > shown.length) console.log(`  ... and ${n - shown.length} more (git status for the full list)`)
console.log(line)

if (process.env.FP_ALLOW_DIRTY) {
  console.log('[clean-check] FP_ALLOW_DIRTY is set -- deploying dirty tree BY CHOICE.')
  console.log('              Commit or restore these files right after the deploy.\n')
  process.exit(0)
}

console.log('[clean-check] REFUSING to deploy. Two ways forward:')
console.log('  1) Commit (or git restore) the files above, then rerun:  npm run deploy')
console.log('  2) Ship the dirty tree deliberately (PowerShell):')
console.log("       $env:FP_ALLOW_DIRTY='1'; npm run deploy; Remove-Item Env:\\FP_ALLOW_DIRTY")
console.log('')
process.exit(1)
