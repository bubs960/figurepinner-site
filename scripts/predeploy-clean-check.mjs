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
 *   - clean tree           -> pass silently
 *   - dirty tree           -> print every dirty path, refuse (exit 1)
 *   - FP_ALLOW_DIRTY set   -> print the dirty list, deploy anyway (exit 0)
 *
 * The override exists because shipping uncommitted work is sometimes the
 * right call (e.g. a fresh KB sync you intend to commit right after) — but it
 * must be a choice someone makes looking at the file list, never a default.
 *
 * Pure-stdlib, ASCII-only (PowerShell cp1252-safe). Wired as the first step
 * of the "deploy" script in package.json.
 */

import { execSync } from 'node:child_process'

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const porcelain = git('status --porcelain')
const line = '='.repeat(66)

if (!porcelain) {
  console.log('[clean-check] Working tree clean. Deploying committed code only.')
  process.exit(0)
}

const changes = porcelain.split(/\r?\n/).filter(Boolean)
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
