/**
 * image-upload.ts — source for the deployed `figurepinner-images` Worker.
 *
 * RE-MATERIALIZED 2026-08-20 (lister lane) from the live deployed bundle via the
 * Cloudflare MCP (`workers_get_worker_code`, script `figurepinner-images`, id
 * 3f3be7949be34c449d9936c5ef85671e, last modified ~2026-06-01). The original
 * source file was lost in the 8/16 repo consolidation (web's finding,
 * WEB-TO-LISTER-IMAGES-WORKER-SOURCE-MISSING-PLUS-RESIZE-ASK-2026-08-20.md) —
 * this file is a faithful de-bundling of the handler section of that bundle
 * (the unenv polyfill preamble is wrangler build output, not source). Owned by
 * the LISTER lane per the lane table, though it lives in the web repo.
 *
 * ⚠️ Bindings CONFIRMED 2026-08-26 (lister lane) via `npx wrangler versions view
 * <latest-version-id> --name figurepinner-images` — no CF dashboard click-through
 * needed, wrangler is already authenticated to the account. Config lives in
 * `workers/image-upload-wrangler.toml`:
 *   - env.ASSETS        R2 bucket binding "figurepinner-assets" (same bucket
 *                       r2proxy uses)
 *   - env.PUBLIC_URL    "https://figurepinner-images.bubs960.workers.dev"
 *   - env.UPLOAD_SECRET secret (upload auth, live, not read/exported)
 * Still DO NOT DEPLOY casually — this worker serves live eBay listing photos.
 * Deploy only with a deliberate reason and a live GET re-check after (R10).
 *
 * Behavior (verified against the live bundle, resize added 2026-08-26):
 *   POST /upload        authed (X-FP-Key or Bearer UPLOAD_SECRET) single-file
 *                       upload → R2 `listing-photos/<path>`, thumbs generated
 *                       in the background (does not delay the response)
 *   POST /upload-batch  authed multi-file upload → `listing-photos/<prefix>/<i>.jpg`,
 *                       same background thumb generation per file
 *   POST /backfill-thumbs  authed, ONE PAGE per call (cursor-driven) --
 *                       regenerates thumbs for existing pre-deploy photos.
 *                       See BACKFILL below.
 *   GET  /<key>?width=N R2 passthrough; with a `width` param on a
 *                       `listing-photos/` key, serves the smallest
 *                       pre-generated bucket >= N if one exists, else falls
 *                       through to the full-res original (never a 404 just
 *                       because a thumb hasn't landed yet)
 *
 * Resize approach (Steve's call, 2026-08-26 — see
 * `LISTER-TO-STEVE-IMAGE-RESIZE-APPROACH-DECISION-2026-08-26.md`): pre-generate
 * fixed-width JPEG thumbnails at upload time via `@cf-wasm/photon` (Rust
 * `photon_rs` compiled to WASM, `/workerd` entrypoint — no CF Images product,
 * no zone/custom-domain requirement, no per-transform billing). Rejected
 * alternatives: zone-level CF Image Resizing (this worker has no zone, only a
 * workers.dev address — `cf.image` fetch options don't apply there); the
 * Cloudflare Images binding (works fine on workers.dev, but bills per
 * transformation, real ongoing cost for a resize this size/frequency).
 *
 * BACKFILL (added 2026-08-26, web's flag: 17,532 pre-deploy photos have no
 * thumbs and won't get any until re-uploaded). `POST /backfill-thumbs`
 * processes ONE PAGE of `env.ASSETS.list({prefix: "listing-photos/"})` per
 * call (default 20 objects, see the limit comment at the route for the
 * timeout incident that set it), skips keys that are themselves thumb
 * variants, skips originals that already have a `w200` marker (cheap
 * head-only check, makes a full re-run from `cursor=null` safe after an
 * interruption), and returns `{scanned, alreadyThumbed, written, deletedStale,
 * failed, cursor, done}` for the caller to drive in a loop.
 *
 * `GET /debug-list` (authed, list-only, no decode/resize) supports the
 * webaudit-recommended close-out method: don't trust the running counters as
 * proof of coverage (a killed invocation can't report what it didn't finish)
 * -- list `w200/` keys vs originals directly and gap-count for real. Also
 * useful for narrowing a stuck cursor without risking another resource-limit
 * hit, which is what it was built for (2026-08-26 incident, see
 * MAX_RESIZE_PIXELS below).
 *
 * AUDITED 2026-08-29 by webaudit (`WEBAUDIT-TO-LISTER-IMAGE-WORKER-AUDIT-
 * 2026-08-29.md`) after the backfill silently stalled ~40% through for 3 days
 * -- fixed same session: stale-thumb-on-reupload (HIGH: a corrective
 * re-upload smaller than a bucket used to leave the OLD photo's thumb serving
 * forever at that URL, `immutable, 1yr` cached -- see the delete-on-skip in
 * generateThumbs), `bucketFor(>800)` silently served the 800 bucket instead
 * of falling through to the original as documented, reserved-namespace guard
 * on `path`/`prefix` (a collision with `w200|450|800/` was silently
 * clobberable), `X-FP-Thumb` response header for real coverage observability,
 * and honest per-bucket backfill counts instead of a boolean "processed."
 * Noted, not yet built: a separate `BACKFILL_SECRET` (the shared upload
 * secret's blast radius is ~200x larger through this endpoint with no rate
 * limit) -- needs Steve to provision a new secret, flagged as a follow-up.
 *
 * TODO, NOT yet implemented:
 *   1. HEAD support (currently falls through to 404) — enables cheap
 *      content-length probes.
 */

import { PhotonImage, SamplingFilter, resize as photonResize } from "@cf-wasm/photon/workerd";

interface Env {
  ASSETS: R2Bucket;
  PUBLIC_URL: string;
  UPLOAD_SECRET: string;
}

const LISTING_PREFIX = "listing-photos/";
// Covers every width thumb() actually requests site-wide (96-800px, see
// src/lib/imageUrl.ts call sites) with 3 buckets, same "smallest bucket >=
// requested" shape as thumb()'s own i.ebayimg.com bucket rewrite.
const THUMB_BUCKETS = [200, 450, 800] as const;
const THUMB_QUALITY = 82;
// photon's own caveat: Workers have a ~128MB memory cap. Stay well under it
// for the resize path; the original upload itself has no such limit.
const MAX_RESIZE_INPUT_BYTES = 20 * 1024 * 1024;
// Found 2026-08-26 during the backfill sweep: a 4.1MB/24.5MP (4284x5712) test
// photo hit Cloudflare's CPU/memory limit (error 1102) on Lanczos3 resize
// despite being well under MAX_RESIZE_INPUT_BYTES -- decoded pixel count, not
// file size, is what's actually expensive.
// CORRECTED 2026-08-29: the original 12MP cutoff was wrong, not just
// conservative -- it sits BELOW the single most common real capture
// resolution. The backfill's first real completion left 356 failures, every
// one a `frame_N.jpg` raw upload capture at the standard iPhone 3024x4032 =
// 12,192,768px, ~1.4-1.9MB. That's normal, current, real listing-photo
// content (some ARE the canonical_image_url for their figure -- confirmed via
// the KB, not assumed), not an outlier -- the guard was silently regressing
// exactly the photos this whole project exists to fix. Raised to 20MP: real
// margin above every standard phone resolution (12MP included), still well
// under the 24.5MP file that actually crashed the worker. Live-tested against
// a real 12MP frame_1.jpg before trusting this broadly (see the fix relay).
// KNOWN GAP unchanged: this check runs AFTER PhotonImage.new_from_byteslice()
// decodes the full image, so it protects the resize step but not decode
// itself. Still judged disproportionate to build a pre-decode JPEG-header
// parser for one confirmed outlier file (now deleted) -- revisit if a genuine
// listing photo trips 1102 again, this time above the 20MP line.
const MAX_RESIZE_PIXELS = 20_000_000;

// Reserved so an uploaded `path`/`prefix` can never collide with the thumb
// namespace (webaudit 2026-08-29 medium finding): a colliding upload would be
// silently clobbered by unrelated thumb writes and permanently invisible to
// the backfill skip-marker check.
const RESERVED_THUMB_SEGMENT = /^w(200|450|800)$/;

// null = wider than the largest bucket -- per the documented contract, GET
// falls through to the full-res original rather than serving an
// undersized-relative-to-request 800 bucket (webaudit 2026-08-29: the
// original version silently served w800 here, contradicting its own doc
// comment; dormant today since the site never requests >800, but wrong).
function bucketFor(width: number): number | null {
  for (const b of THUMB_BUCKETS) {
    if (width <= b) return b;
  }
  return null;
}

function thumbKeyFor(basePath: string, bucket: number): string {
  return `${LISTING_PREFIX}w${bucket}/${basePath}`;
}

/**
 * Best-effort. Never throws — a resize failure must not affect the upload
 * response, which has already been sent by the time this runs (ctx.waitUntil).
 * GET falls back to the full-res original for any bucket key that doesn't
 * exist. Returns honest per-bucket counts (webaudit 2026-08-29: the caller
 * used to just increment "processed" whenever the original's bytes were
 * readable, which can't tell a real success from a silently-skipped bucket).
 * `skipped` covers every bucket the source was already small enough to not
 * need, INCLUDING the stale-thumb delete attempt below -- R2's delete()
 * doesn't report whether a key actually existed, so a separate "deleted N
 * real stale thumbs" count isn't obtainable without an extra head() per
 * bucket, and wasn't worth adding for a number nothing downstream consumes.
 */
async function generateThumbs(
  env: Env,
  basePath: string,
  buf: ArrayBuffer,
): Promise<{ written: number; skipped: number; failed: number }> {
  const result = { written: 0, skipped: 0, failed: 0 };
  if (buf.byteLength === 0 || buf.byteLength > MAX_RESIZE_INPUT_BYTES) {
    result.failed = THUMB_BUCKETS.length;
    return result;
  }
  let input: PhotonImage | undefined;
  try {
    input = PhotonImage.new_from_byteslice(new Uint8Array(buf));
    const srcWidth = input.get_width();
    const srcHeight = input.get_height();
    if (!srcWidth || !srcHeight || srcWidth * srcHeight > MAX_RESIZE_PIXELS) {
      result.failed = THUMB_BUCKETS.length;
      return result;
    }
    for (const bucket of THUMB_BUCKETS) {
      const thumbKey = thumbKeyFor(basePath, bucket);
      if (srcWidth <= bucket) {
        // Source is already smaller than this bucket -- no thumb needed.
        // HIGH-severity fix (webaudit 2026-08-29): a PREVIOUS, larger version
        // of this same path may have left a real thumb at this exact key. A
        // corrective re-upload with a smaller image used to leave that stale
        // thumb serving forever (wrong image, Cache-Control: immutable,
        // 1yr) -- delete is idempotent on a missing key, so this is safe to
        // run unconditionally on every skip, not just on a real re-upload.
        try {
          await env.ASSETS.delete(thumbKey);
        } catch {
          // best-effort; a delete failure here just means a stale thumb
          // persists one more cycle, not a new correctness regression.
        }
        result.skipped++;
        continue;
      }
      const targetHeight = Math.round(srcHeight * (bucket / srcWidth));
      let output: PhotonImage | undefined;
      try {
        output = photonResize(input, bucket, targetHeight, SamplingFilter.Lanczos3);
        const jpegBytes = output.get_bytes_jpeg(THUMB_QUALITY);
        await env.ASSETS.put(thumbKey, jpegBytes, {
          httpMetadata: { contentType: "image/jpeg" },
        });
        result.written++;
      } catch (err) {
        result.failed++;
        console.error("thumb write failed", basePath, bucket, String(err));
      } finally {
        output?.free();
      }
    }
  } catch (err) {
    console.error("thumb generation failed", basePath, String(err));
    result.failed = THUMB_BUCKETS.length;
  } finally {
    input?.free();
  }
  return result;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-FP-Key",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method === "POST" && url.pathname === "/upload") {
      try {
        const fpKey = request.headers.get("X-FP-Key") || "";
        const auth = request.headers.get("Authorization") || "";
        const validKey = fpKey === env.UPLOAD_SECRET || auth === `Bearer ${env.UPLOAD_SECRET}`;
        if (!validKey) {
          return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
        }
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const path = formData.get("path");
        if (!file || !path) {
          return Response.json(
            { error: "missing file or path", file: !!file, path: !!path },
            { status: 400, headers: corsHeaders },
          );
        }
        const basePath = String(path);
        if (RESERVED_THUMB_SEGMENT.test(basePath.split("/")[0])) {
          return Response.json(
            { error: "path collides with the reserved thumb namespace (w200/w450/w800)" },
            { status: 400, headers: corsHeaders },
          );
        }
        const key = `listing-photos/${basePath}`;
        const buf = await file.arrayBuffer();
        await env.ASSETS.put(key, buf, {
          httpMetadata: { contentType: file.type || "image/jpeg" },
        });
        ctx.waitUntil(generateThumbs(env, basePath, buf));
        const publicUrl = `${env.PUBLIC_URL}/${key}`;
        return Response.json({ url: publicUrl, key }, { headers: corsHeaders });
      } catch (err: any) {
        return Response.json(
          { error: "upload failed", detail: String(err), stack: err?.stack },
          { status: 500, headers: corsHeaders },
        );
      }
    }
    if (request.method === "POST" && url.pathname === "/upload-batch") {
      const fpKey = request.headers.get("X-FP-Key") || "";
      const auth = request.headers.get("Authorization") || "";
      const validKey = fpKey === env.UPLOAD_SECRET || auth === `Bearer ${env.UPLOAD_SECRET}`;
      if (!validKey) {
        return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
      }
      const formData = await request.formData();
      const prefix = formData.get("prefix") || "unknown";
      if (RESERVED_THUMB_SEGMENT.test(String(prefix).split("/")[0])) {
        return Response.json(
          { error: "prefix collides with the reserved thumb namespace (w200/w450/w800)" },
          { status: 400, headers: corsHeaders },
        );
      }
      const urls: string[] = [];
      for (const [name, value] of formData.entries()) {
        if (name.startsWith("file") && value instanceof File) {
          const idx = name.replace("file", "") || urls.length.toString();
          const basePath = `${prefix}/${idx}.jpg`;
          const key = `listing-photos/${basePath}`;
          const buf = await value.arrayBuffer();
          await env.ASSETS.put(key, buf, {
            httpMetadata: { contentType: value.type || "image/jpeg" },
          });
          ctx.waitUntil(generateThumbs(env, basePath, buf));
          urls.push(`${env.PUBLIC_URL}/${key}`);
        }
      }
      return Response.json({ urls, count: urls.length }, { headers: corsHeaders });
    }
    if (request.method === "GET" && url.pathname === "/debug-list") {
      // List-only, no decode/resize -- can't itself hit a resource limit.
      // Built 2026-08-26 to isolate a stuck backfill cursor; kept as a
      // supported reconciliation tool per webaudit's 2026-08-29 review (list
      // w200/ keys vs originals for a real gap-count, not the running
      // counters, to close out a sweep -- see the doc block above).
      const fpKey = request.headers.get("X-FP-Key") || "";
      const auth = request.headers.get("Authorization") || "";
      const validKey = fpKey === env.UPLOAD_SECRET || auth === `Bearer ${env.UPLOAD_SECRET}`;
      if (!validKey) {
        return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
      }
      const cursor = url.searchParams.get("cursor") || undefined;
      const limitParam = Number(url.searchParams.get("limit"));
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 1000) : 20;
      const listing = await env.ASSETS.list({ prefix: LISTING_PREFIX, cursor, limit });
      const objects = await Promise.all(
        listing.objects.map(async (o) => ({ key: o.key, size: o.size, uploaded: o.uploaded })),
      );
      return Response.json(
        { objects, cursor: listing.truncated ? listing.cursor : null, done: !listing.truncated },
        { headers: corsHeaders },
      );
    }
    if (request.method === "POST" && url.pathname === "/debug-delete") {
      // Delete through env.ASSETS -- the EXACT binding this worker reads from
      // -- because `wrangler r2 object delete` reported success twice on
      // fp_test/frame_1.jpg and frame_2.jpg (2026-08-29) while this worker's
      // own env.ASSETS.list()/get() kept showing them present. Root cause
      // unconfirmed (account/context mismatch between the CLI's auth and this
      // deployment's binding is the leading theory), but this endpoint
      // sidesteps it entirely by using the same binding as everything else
      // here. Single key only, no bulk delete surface.
      const fpKey = request.headers.get("X-FP-Key") || "";
      const auth = request.headers.get("Authorization") || "";
      const validKey = fpKey === env.UPLOAD_SECRET || auth === `Bearer ${env.UPLOAD_SECRET}`;
      if (!validKey) {
        return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
      }
      const key = url.searchParams.get("key");
      if (!key) {
        return Response.json({ error: "missing key" }, { status: 400, headers: corsHeaders });
      }
      const before = await env.ASSETS.head(key);
      await env.ASSETS.delete(key);
      const after = await env.ASSETS.head(key);
      return Response.json(
        { key, existedBefore: !!before, existsAfter: !!after },
        { headers: corsHeaders },
      );
    }
    if (request.method === "POST" && url.pathname === "/backfill-thumbs") {
      const fpKey = request.headers.get("X-FP-Key") || "";
      const auth = request.headers.get("Authorization") || "";
      const validKey = fpKey === env.UPLOAD_SECRET || auth === `Bearer ${env.UPLOAD_SECRET}`;
      if (!validKey) {
        return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
      }
      const cursor = url.searchParams.get("cursor") || undefined;
      const limitParam = Number(url.searchParams.get("limit"));
      // Default lowered 50 -> 20 (2026-08-26, mid-sweep): a batch containing
      // several large originals pushed cumulative resize time past Cloudflare's
      // edge gateway timeout (524, non-JSON response, broke 2 consecutive
      // calls at ~15,800/17,532 processed). Smaller batches bound worst-case
      // per-call time; the skip-if-already-thumbed check below (same fix)
      // makes it cheap to just restart the whole sweep from cursor=null
      // instead of needing to locate/resume the exact stuck cursor.
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 20;

      const listing = await env.ASSETS.list({ prefix: LISTING_PREFIX, cursor, limit });
      const originals = listing.objects
        .map((o) => o.key)
        .filter((key) => {
          const rest = key.slice(LISTING_PREFIX.length);
          return !THUMB_BUCKETS.some((b) => rest.startsWith(`w${b}/`));
        });

      // Honest per-object counts (webaudit 2026-08-29 finding: the old
      // `processed++` fired whenever the original's bytes were readable --
      // decode failures, per-bucket put failures, and a missing object were
      // all invisible to it, so "0 failed" only ever meant "0 unreadable
      // originals," nothing about whether thumbs actually landed).
      let alreadyThumbed = 0;
      let written = 0;
      const failed: string[] = [];
      for (const key of originals) {
        const basePath = key.slice(LISTING_PREFIX.length);
        try {
          // Cheap head-only marker check: the smallest bucket exists for any
          // original wider than 200px (the overwhelming majority of real
          // photos), so its presence means this object was already
          // backfilled -- skip without a decode/resize/encode. Makes the
          // whole sweep safely re-runnable from scratch after an interruption
          // instead of needing an exact resume cursor.
          const marker = await env.ASSETS.head(thumbKeyFor(basePath, THUMB_BUCKETS[0]));
          if (marker) {
            alreadyThumbed++;
            continue;
          }
          const object = await env.ASSETS.get(key);
          if (!object) {
            failed.push(basePath); // listed but unreadable -- a real gap, not a silent no-op
            continue;
          }
          const buf = await object.arrayBuffer();
          const r = await generateThumbs(env, basePath, buf);
          written += r.written;
          if (r.failed > 0) failed.push(basePath);
        } catch (err) {
          failed.push(basePath);
          console.error("backfill failed", basePath, String(err));
        }
      }

      return Response.json(
        {
          scanned: listing.objects.length,
          alreadyThumbed,
          written,
          failed,
          cursor: listing.truncated ? listing.cursor : null,
          done: !listing.truncated,
        },
        { headers: corsHeaders },
      );
    }
    if (request.method === "GET" && url.pathname.length > 1) {
      const key = url.pathname.slice(1);
      const widthParam = url.searchParams.get("width");
      if (widthParam && key.startsWith(LISTING_PREFIX)) {
        const width = Number(widthParam);
        const bucket = Number.isFinite(width) && width > 0 ? bucketFor(width) : null;
        if (bucket !== null) {
          const basePath = key.slice(LISTING_PREFIX.length);
          const thumbObject = await env.ASSETS.get(thumbKeyFor(basePath, bucket));
          if (thumbObject) {
            return new Response(thumbObject.body, {
              headers: {
                ...corsHeaders,
                "Content-Type": thumbObject.httpMetadata?.contentType || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
                // Coverage observability (webaudit 2026-08-29): a bare passthrough
                // gave no way to tell "thumb served" from "fell through to
                // full-res" without a separate probe -- this is what let the
                // backfill's 3-day stall go unnoticed.
                "X-FP-Thumb": `w${bucket}`,
              },
            });
          }
          // No pre-generated bucket yet (still processing, resize was
          // skipped, or the original is already small) -- fall through.
        }
      }
      const object = await env.ASSETS.get(key);
      if (!object) {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }
      return new Response(object.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-FP-Thumb": "original",
        },
      });
    }
    return Response.json({ error: "not found" }, { status: 404, headers: corsHeaders });
  },
};
