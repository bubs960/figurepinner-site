/**
 * predeploy-clean-check.mjs — REFUSE to deploy from a dirty working tree.
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
 * Pure-stdlib, ASCII-only (PowerShell cp1252-safe). Wired as the first step
 * of the "deploy" script in package.json.
 */

import { execSync } from 'node:child_process'

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
    execSync('git commit -m "chore: auto-sync KB data files (predeploy guard, nightly rehost)"', { stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (err) {
    console.log('[clean-check] Auto-commit FAILED -- falling back to the normal refuse/override path.')
    console.log('              ' + String(err.message || err).split('\n')[0])
    return false
  }
  console.log('[clean-check] Committed. Proceeding with a clean tree.\n')
  return true
}

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
