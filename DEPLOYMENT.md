# FigurePinner — Deployment Reference
## READ THIS FIRST. DO NOT CHANGE THE DEPLOY METHOD WITHOUT STEVE'S EXPLICIT APPROVAL.

---

## How this site deploys — THE ONLY CORRECT METHOD

```powershell
cd "C:\Users\bubs9\figurepinner-site"
npm run deploy
```

That runs: `npx @opennextjs/cloudflare build && wrangler deploy`

This builds the Next.js app via OpenNext for Cloudflare Workers, then deploys it as a **Cloudflare Worker** (not CF Pages) using `wrangler deploy`.

**That's it. One command. Steve runs it.**

---

## What this is NOT

- **NOT CF Pages auto-deploy.** Do not connect this repo to CF Pages. Do not set up GitHub → CF Pages auto-build. The site runs as a Worker, not a Pages project.
- **NOT `next build` alone.** The standard Next.js build does not produce a Cloudflare-compatible output.
- **NOT `npx wrangler pages deploy`.** That's the Pages deploy command. Wrong tool.

---

## Why Worker, not Pages

This site uses OpenNext (`@opennextjs/cloudflare`) which compiles Next.js to a Cloudflare Worker. It needs D1, KV, and R2 bindings that are configured in `wrangler.toml` — these only work in a Worker context. CF Pages has a different binding model and wrangler.toml has keys that CF Pages rejects.

---

## Pre-deploy checklist (run every time before deploying)

```powershell
cd "C:\Users\bubs9\figurepinner-site"
npx tsc --noEmit
```

Zero TypeScript errors required. If there are errors, fix them first. Do not deploy broken code.

---

## Deploy cap

**4 deploys per day maximum** on figurepinner-site. Track usage within a session and stop at 4.

---

## What web chat does NOT do

- Does not change the deploy method
- Does not connect the repo to CF Pages
- Does not add/remove wrangler.toml keys without standalone auth
- Does not run D1/R2/KV operations without standalone auth
- Does not deploy without running `npx tsc --noEmit` first

---

## If deploy fails

Check `wrangler.toml` — CF Pages builds will reject keys like `main`, `account_id`, `triggers`, `queues.consumers`. If someone ran a Pages build, those may have been stripped. Restore from git if needed.

---

*Filed by standalone 2026-06-05 per Steve directive. This file is the deploy canonical. Do not edit without Steve approval.*
