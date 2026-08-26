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

function bucketFor(width: number): number {
  for (const b of THUMB_BUCKETS) {
    if (width <= b) return b;
  }
  return THUMB_BUCKETS[THUMB_BUCKETS.length - 1];
}

function thumbKeyFor(basePath: string, bucket: number): string {
  return `${LISTING_PREFIX}w${bucket}/${basePath}`;
}

/**
 * Best-effort. Never throws — a resize failure must not affect the upload
 * response, which has already been sent by the time this runs (ctx.waitUntil).
 * GET falls back to the full-res original for any bucket that isn't written.
 */
async function generateThumbs(env: Env, basePath: string, buf: ArrayBuffer): Promise<void> {
  if (buf.byteLength === 0 || buf.byteLength > MAX_RESIZE_INPUT_BYTES) return;
  let input: PhotonImage | undefined;
  try {
    input = PhotonImage.new_from_byteslice(new Uint8Array(buf));
    const srcWidth = input.get_width();
    const srcHeight = input.get_height();
    if (!srcWidth || !srcHeight) return;
    for (const bucket of THUMB_BUCKETS) {
      if (srcWidth <= bucket) continue; // already small enough; GET serves the original for this bucket
      const targetHeight = Math.round(srcHeight * (bucket / srcWidth));
      let output: PhotonImage | undefined;
      try {
        output = photonResize(input, bucket, targetHeight, SamplingFilter.Lanczos3);
        const jpegBytes = output.get_bytes_jpeg(THUMB_QUALITY);
        await env.ASSETS.put(thumbKeyFor(basePath, bucket), jpegBytes, {
          httpMetadata: { contentType: "image/jpeg" },
        });
      } finally {
        output?.free();
      }
    }
  } catch (err) {
    console.error("thumb generation failed", basePath, String(err));
  } finally {
    input?.free();
  }
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
    if (request.method === "GET" && url.pathname.length > 1) {
      const key = url.pathname.slice(1);
      const widthParam = url.searchParams.get("width");
      if (widthParam && key.startsWith(LISTING_PREFIX)) {
        const width = Number(widthParam);
        if (Number.isFinite(width) && width > 0) {
          const basePath = key.slice(LISTING_PREFIX.length);
          const thumbObject = await env.ASSETS.get(thumbKeyFor(basePath, bucketFor(width)));
          if (thumbObject) {
            return new Response(thumbObject.body, {
              headers: {
                ...corsHeaders,
                "Content-Type": thumbObject.httpMetadata?.contentType || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
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
        },
      });
    }
    return Response.json({ error: "not found" }, { status: 404, headers: corsHeaders });
  },
};
