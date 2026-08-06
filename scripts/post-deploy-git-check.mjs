/**
 * post-deploy-git-check.mjs -- deploy-time git hygiene guard.
 * Section 1 (uncommitted changes): LOUD WARNING ONLY, never auto-commits.
 * Section 2 (unpushed commits): AUTO-PUSHES, per Steve's explicit 2026-08-06
 * standing instruction (this exact gap recurred twice in one week -- 47
 * unpushed commits 8/3, 4 more 8/6 -- because a warning nobody reads doesn't
 * fix a silent-drift problem, only a loud one does).
 *
 * WHY section 1 stays manual (2026-06-26, web chat): `npm run deploy` builds
 * from the WORKING TREE, so uncommitted code goes live. Across sessions the
 * tree silently drifted to 61 uncommitted files -- all deployed, none
 * committed. The risk: a later session reads `git status`, assumes the files
 * are unshipped, and `git checkout`s away deployed-only work that exists
 * nowhere else. Catastrophic + irreversible. The root cause was NOT "deploy
 * doesn't commit" -- auto-committing every deploy makes junk history, can
 * sweep in secrets/temp files unreviewed, and commits half-finished work.
 * The fix is making the drift LOUD (print what just went live + a one-paste
 * commit command), not auto-committing it -- a human keeps judgment over
 * what's keeper work and what the message should say.
 *
 * WHY section 2 is different, and safe to automate (2026-08-06): by the time
 * commits reach this check, they already exist with real messages a human
 * already wrote, and they've already passed predeploy-clean-check.mjs + the
 * test suite + an actual live deploy. Pushing them to origin adds no new
 * risk beyond what's already shipped -- it's a backup/sync of history
 * already vetted twice over (a human committed it, the deploy pipeline
 * gated it). The risk this guard exists to catch (solo-disk-only copy of
 * real shipped work, lost to a disk failure or a bad `git reset`) is
 * strictly worse than any risk auto-pushing introduces. Added 2026-08-03,
 * auto-push added 2026-08-06 after the warn-only version let the gap
 * recur (47 unpushed 8/3, 4 more 8/6, same session that first added this
 * check) -- a guard nobody reads until the nightly watcher catches it isn't
 * actually closing the gap it was built for.
 *
 * Pure-stdlib, ASCII-only (PowerShell-safe). Never fails the deploy (always exit 0)
 * -- a push failure here is reported loudly but does not undo or block the deploy
 * that already happened.
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
    console.log(`[git-check] ${ahead} commit(s) on '${branch}' are deployed but not yet on origin.`)
    console.log('            Auto-pushing now (Steve, 2026-08-06 standing instruction --')
    console.log('            these commits already passed predeploy checks + tests + a live')
    console.log('            deploy, so pushing adds no new risk, only closes the backup gap).')
    console.log(line)

    // git push writes its "To <remote> / <sha>..<sha> branch -> branch" summary
    // to STDERR even on success -- `2>&1` folds it into the captured stdout so
    // the success-path log line below actually has something to show, not just
    // silently-discarded stderr (execSync's return value is stdout-only).
    let pushOk = false
    let pushOutput = ''
    try {
      pushOutput = execSync(`git push origin ${branch} 2>&1`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      pushOk = true
    } catch (err) {
      pushOutput = String(err.stdout || '') + String(err.stderr || err.message || err)
    }

    if (pushOk) {
      console.log(`[git-check] Pushed. origin/${branch} is now up to date.`)
      if (pushOutput.trim()) console.log('  ' + pushOutput.trim().split('\n').join('\n  '))
    } else {
      console.log('[git-check] AUTO-PUSH FAILED -- falling back to a manual warning, nothing lost:')
      console.log('  ' + pushOutput.trim().split('\n').join('\n  '))
      console.log(`\n  To push by hand:\n    git push origin ${branch}\n`)
      console.log('  Common cause: origin has commits this machine does not (someone pushed')
      console.log('  from elsewhere) -- pull/rebase before retrying, don\'t force push.\n')
    }
    console.log('')
  } else {
    console.log('[git-check] Up to date with origin. Nothing unpushed.\n')
  }
} else {
  console.log('[git-check] No upstream configured for this branch -- skipped unpushed-commit check.\n')
}

process.exit(0)
