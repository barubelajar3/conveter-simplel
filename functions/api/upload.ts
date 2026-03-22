interface Env {
  R2_BUCKET: R2Bucket;
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "image/tiff": "tiff",
  "image/avif": "avif",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

function sanitizeExtension(ext: string, mimeType: string): string {
  // Prefer extension from MIME type for security, fallback to file extension
  const mimeExt = ALLOWED_TYPES[mimeType];
  if (mimeExt) return mimeExt;

  // Validate that the file extension is in our allowed list
  const allowedExts = Object.values(ALLOWED_TYPES);
  if (allowedExts.includes(ext)) return ext;

  return "png";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { success: false, error: "No file provided in the request." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!file.type.startsWith("image/")) {
      return Response.json(
        { success: false, error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    if (!(file.type in ALLOWED_TYPES)) {
      return Response.json(
        { success: false, error: `Unsupported image type: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: "File size exceeds the 10 MB limit." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return Response.json(
        { success: false, error: "File is empty." },
        { status: 400 }
      );
    }

    // Generate a unique, safe filename
    const rawExt = getExtension(file.name);
    const ext = sanitizeExtension(rawExt, file.type);
    const uniqueName = `${crypto.randomUUID()}.${ext}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await context.env.R2_BUCKET.put(uniqueName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Build the public URL
    const origin = new URL(context.request.url).origin;
    const imageUrl = `${origin}/api/image/${uniqueName}`;

    return Response.json(
      {
        success: true,
        url: imageUrl,
        filename: uniqueName,
        originalName: file.name,
        size: file.size,
        contentType: file.type,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error during upload.";
    return Response.json(
      { success: false, error: message },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
};
