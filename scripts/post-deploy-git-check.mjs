/**
 * post-deploy-git-check.mjs -- deploy-time git hygiene GUARD (not auto-commit, not auto-push)
 *
 * WHY (2026-06-26, web chat): `npm run deploy` builds from the WORKING TREE, so
 * uncommitted code goes live. Across sessions the tree silently drifted to 61
 * uncommitted files -- all deployed, none committed. The risk: a later session
 * reads `git status`, assumes the files are unshipped, and `git checkout`s away
 * deployed-only work that exists nowhere else. Catastrophic + irreversible.
 *
 * The root cause was NOT "deploy doesn't commit" -- auto-committing every deploy
 * makes junk history, can sweep in secrets/temp files unreviewed, and commits
 * half-finished work. The root cause was that drift was SILENT. So this guard
 * makes it LOUD: after a successful deploy it prints how many uncommitted changes
 * just went live and a one-paste commit command. It does NOT commit for you -- you
 * keep judgment over what's keeper work and what the message should say.
 *
 * ADDED (2026-08-03, standalone): same silent-drift shape, one layer up -- commits
 * can pile up LOCALLY, deployed and safe, but never reach `origin`. Nothing here
 * broke (deploy != push), but a solo-disk copy of real shipped history is exactly
 * the kind of thing a bad "git checkout ." or a disk failure turns catastrophic.
 * Surfaced 2026-08-03 at 47 unpushed commits, only caught by the nightly git-health
 * watcher -- this guard now catches it at the moment it happens instead, same
 * loud-warning-never-auto-push philosophy as the uncommitted-changes check above.
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

const line = '='.repeat(66)

// ---- 1. uncommitted working-tree changes ----
const porcelain = git('status --porcelain')

if (!porcelain) {
  console.log('\n[git-check] Working tree is clean. Deploy == committed code.\n')
} else {
  const changes = porcelain.split(/\r?\n/).filter(Boolean)
  const n = changes.length

  console.log('\n' + line)
  console.log(`[git-check] WARNING: you just deployed ${n} UNCOMMITTED change(s).`)
  console.log('            These are now LIVE but exist ONLY in your working tree.')
  console.log('            If this is keeper work, commit it so it is not lost and so')
  console.log('            the next session can trust `git status`.')
  console.log(line)

  for (const c of changes.slice(0, 20)) console.log('  ' + c)
  if (n > 20) console.log(`  ... and ${n - 20} more`)

  console.log('\n  To commit everything now (review the list above first):')
  console.log('    git add -A')
  console.log('    git commit -m "deploy: <what changed>"')
  console.log('\n  (Guard only -- nothing was committed automatically.)\n')
}

// ---- 2. commits ahead of origin (committed, deployed, but unpushed) ----
const branch = git('rev-parse --abbrev-ref HEAD')
const hasUpstream = branch && git(`rev-parse --abbrev-ref ${branch}@{upstream}`)

if (branch && hasUpstream) {
  const aheadCount = git(`rev-list --count origin/${branch}..HEAD`)
  const ahead = parseInt(aheadCount, 10) || 0

  if (ahead > 0) {
    console.log('\n' + line)
    console.log(`[git-check] WARNING: ${ahead} commit(s) on '${branch}' are deployed but NOT pushed to origin.`)
    console.log('            This history exists on this machine only -- a disk loss or a bad')
    console.log('            `git reset`/`checkout` from someone assuming it is backed up would')
    console.log('            lose real, already-live work.')
    console.log(line)
    console.log(`\n  To push now:\n    git push origin ${branch}\n`)
    console.log('  (Guard only -- nothing was pushed automatically.)\n')
  } else {
    console.log('[git-check] Up to date with origin. Nothing unpushed.\n')
  }
} else {
  console.log('[git-check] No upstream configured for this branch -- skipped unpushed-commit check.\n')
}

process.exit(0)
