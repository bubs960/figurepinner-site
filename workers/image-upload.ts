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
 * ⚠️ DO NOT DEPLOY casually. No wrangler config for this worker survived either;
 * its live bindings are only known by name from the code:
 *   - env.ASSETS        R2 bucket binding (bucket name unconfirmed — read it from
 *                       the CF dashboard → Workers → figurepinner-images →
 *                       Settings → Bindings before writing a wrangler.toml)
 *   - env.PUBLIC_URL    public base URL var
 *   - env.UPLOAD_SECRET secret (upload auth)
 * A deploy from a guessed config could detach the R2 binding. Confirm bindings
 * first, write the wrangler config, THEN this file is deploy-ready.
 *
 * Behavior (verified against the live bundle):
 *   POST /upload        authed (X-FP-Key or Bearer UPLOAD_SECRET) single-file
 *                       upload → R2 `listing-photos/<path>`
 *   POST /upload-batch  authed multi-file upload → `listing-photos/<prefix>/<i>.jpg`
 *   GET  /<key>         R2 passthrough, immutable 1y cache headers
 *
 * TODO (web's 8/20 asks, low priority, NOT yet implemented — keep this file
 * matching the deployed bundle until a deliberate, binding-verified deploy):
 *   1. `?width=` resize support on GET (CF Image Resizing binding or
 *      pre-generated thumbs) — lets web's thumb() serve real OG photos for the
 *      1.4–1.5MB frame_1.jpg captures instead of the ≤1MB wordmark fallback.
 *   2. HEAD support (currently falls through to 404) — enables cheap
 *      content-length probes.
 */

interface Env {
  ASSETS: R2Bucket;
  PUBLIC_URL: string;
  UPLOAD_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
        const key = `listing-photos/${path}`;
        const buf = await file.arrayBuffer();
        await env.ASSETS.put(key, buf, {
          httpMetadata: { contentType: file.type || "image/jpeg" },
        });
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
          const key = `listing-photos/${prefix}/${idx}.jpg`;
          await env.ASSETS.put(key, await value.arrayBuffer(), {
            httpMetadata: { contentType: value.type || "image/jpeg" },
          });
          urls.push(`${env.PUBLIC_URL}/${key}`);
        }
      }
      return Response.json({ urls, count: urls.length }, { headers: corsHeaders });
    }
    if (request.method === "GET" && url.pathname.length > 1) {
      const key = url.pathname.slice(1);
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
