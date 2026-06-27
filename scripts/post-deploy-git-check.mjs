/**
 * post-deploy-git-check.mjs — deploy-time git hygiene GUARD (not auto-commit)
 *
 * WHY (2026-06-26, web chat): `npm run deploy` builds from the WORKING TREE, so
 * uncommitted code goes live. Across sessions the tree silently drifted to 61
 * uncommitted files — all deployed, none committed. The risk: a later session
 * reads `git status`, assumes the files are unshipped, and `git checkout`s away
 * deployed-only work that exists nowhere else. Catastrophic + irreversible.
 *
 * The root cause was NOT "deploy doesn't commit" — auto-committing every deploy
 * makes junk history, can sweep in secrets/temp files unreviewed, and commits
 * half-finished work. The root cause was that drift was SILENT. So this guard
 * makes it LOUD: after a successful deploy it prints how many uncommitted changes
 * just went live and a one-paste commit command. It does NOT commit for you — you
 * keep judgment over what's keeper work and what the message should say.
 *
 * Pure-stdlib, ASCII-only (PowerShell-safe). Never fails the deploy (always exit 0).
 *
 * Wired as the last step of the "deploy" script in package.json.
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
  console.log('\n[git-check] Working tree is clean. Deploy == committed code. Nice.\n')
  process.exit(0)
}

const changes = porcelain.split(/\r?\n/).filter(Boolean)
const n = changes.length

console.log('\n' + line)
console.log(`[git-check] WARNING: you just deployed ${n} UNCOMMITTED change(s).`)
console.log('            These are now LIVE but exist ONLY in your working tree.')
console.log('            If this is keeper work, commit it so it is not lost and so')
console.log('            the next session can trust `git status`.')
console.log(line)

// Show up to 20 so the output stays readable.
for (const c of changes.slice(0, 20)) console.log('  ' + c)
if (n > 20) console.log(`  ... and ${n - 20} more`)

console.log('\n  To commit everything now (review the list above first):')
console.log('    git add -A')
console.log('    git commit -m "deploy: <what changed>"')
console.log('\n  (Guard only — nothing was committed automatically.)\n')

process.exit(0)
