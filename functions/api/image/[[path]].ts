interface Env {
  R2_BUCKET: R2Bucket;
}

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  tif: "image/tiff",
  avif: "image/avif",
};

function getMimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return MIME_TYPES[ext] || "application/octet-stream";
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { path } = context.params;
    const key = Array.isArray(path) ? path.join("/") : (path as string);

    if (!key) {
      return Response.json(
        { error: "No image path specified." },
        { status: 400 }
      );
    }

    // Security: reject path traversal attempts
    if (key.includes("..") || key.startsWith("/")) {
      return Response.json(
        { error: "Invalid image path." },
        { status: 400 }
      );
    }

    const object = await context.env.R2_BUCKET.get(key);

    if (!object) {
      return Response.json(
        { error: "Image not found." },
        { status: 404 }
      );
    }

    const contentType =
      object.httpMetadata?.contentType || getMimeFromKey(key);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("ETag", object.httpEtag);

    // Support conditional requests for 304 Not Modified
    const ifNoneMatch = context.request.headers.get("If-None-Match");
    if (ifNoneMatch === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve image.";
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
};
