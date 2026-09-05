import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  getAllowedImageHosts,
  isAllowedRemoteImageUrl,
} from "@/lib/storage/image-hosts";
import {
  getObjectStore,
  readObjectStoreConfig,
} from "@/lib/storage/object-store";

export { getAllowedImageHosts, isAllowedRemoteImageUrl };
import { imageLogger } from "@/utils/logger";

export const IMAGE_FETCH_TIMEOUT_MS = 15_000;
export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;

const FULL_WIDTH = 1024;
const FULL_QUALITY = 80;
const THUMB_WIDTH = 320;
const THUMB_QUALITY = 60;

export type ImagePipelineFailureReason =
  | "IMAGE_FETCH_FAILED"
  | "IMAGE_PROCESSING_FAILED"
  | "IMAGE_UPLOAD_FAILED";

/**
 * Distinguishes pipeline stages so route handlers can map failures to stable
 * error codes without inspecting messages.
 */
export class ImagePipelineError extends Error {
  readonly reason: ImagePipelineFailureReason;

  constructor(reason: ImagePipelineFailureReason, message: string) {
    super(message);
    this.name = "ImagePipelineError";
    this.reason = reason;
  }
}

export interface StoredImageVariants {
  imageUrl: string;
  thumbnailUrl: string;
}

/**
 * Downloads a generated image with an allowlist check, a timeout, and a size
 * cap. The upstream URL comes from the image provider, never from user input.
 */
export async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (!isAllowedRemoteImageUrl(url)) {
    throw new ImagePipelineError(
      "IMAGE_FETCH_FAILED",
      "Image host is not allowed for server-side fetch.",
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    IMAGE_FETCH_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new ImagePipelineError(
        "IMAGE_FETCH_FAILED",
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    const declaredLength = Number(response.headers.get("content-length") ?? "");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_IMAGE_BYTES) {
      throw new ImagePipelineError(
        "IMAGE_FETCH_FAILED",
        `Generated image exceeds ${MAX_SOURCE_IMAGE_BYTES} bytes.`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SOURCE_IMAGE_BYTES) {
      throw new ImagePipelineError(
        "IMAGE_FETCH_FAILED",
        `Generated image exceeds ${MAX_SOURCE_IMAGE_BYTES} bytes.`,
      );
    }

    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof ImagePipelineError) {
      throw error;
    }

    const detail =
      error instanceof Error && error.name === "AbortError"
        ? `Image download timed out after ${IMAGE_FETCH_TIMEOUT_MS}ms.`
        : error instanceof Error
          ? error.message
          : "Unknown download error";

    throw new ImagePipelineError("IMAGE_FETCH_FAILED", detail);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function toWebp(
  source: Buffer,
  width: number,
  quality: number,
): Promise<Buffer> {
  return sharp(source)
    .rotate()
    .resize({ width, withoutEnlargement: true, fit: "inside" })
    .webp({ quality })
    .toBuffer();
}

/**
 * Content-addressed object key.
 *
 * The digest is part of the key so that regenerating an image yields a new URL.
 * This is what makes the long-lived immutable Cache-Control header on the
 * bucket safe: a refreshed image can never be shadowed by a stale CDN entry.
 */
export function buildImageKey(
  recommendationId: string,
  digest: string,
  variant: "full" | "thumb",
): string {
  return `cocktails/${recommendationId}/${digest}-${variant}.webp`;
}

/**
 * Extracts the object key from a public URL, or null when the URL does not
 * belong to our bucket.
 *
 * Legacy values (base64 data URLs, third-party OSS links) return null so that
 * cleanup never attempts to delete something we do not own.
 */
export function extractOwnedObjectKey(url: string): string | null {
  const config = readObjectStoreConfig();
  if (!config.ok) {
    return null;
  }

  const prefix = `${config.config.publicBaseUrl}/`;
  if (!url.startsWith(prefix)) {
    return null;
  }

  const key = url.slice(prefix.length).split("?")[0];
  return key.length > 0 ? key : null;
}

/**
 * Best-effort removal of superseded objects.
 *
 * Content-addressed keys mean a refreshed image leaves the previous object
 * orphaned. Age-based lifecycle rules cannot be used for this: an image
 * generated a year ago may still be the current one, and a rule would delete it.
 * So cleanup is explicit, and it must run only after the new URLs are committed.
 *
 * Failures are logged and swallowed — a leftover object costs a little storage,
 * whereas a thrown error here would fail a request that already succeeded.
 */
export async function deleteStoredImages(urls: string[]): Promise<void> {
  const keys = Array.from(
    new Set(
      urls
        .map((url) => extractOwnedObjectKey(url))
        .filter((key): key is string => key !== null),
    ),
  );

  if (keys.length === 0) {
    return;
  }

  let store: ReturnType<typeof getObjectStore>;
  try {
    store = getObjectStore();
  } catch {
    return;
  }

  await Promise.all(
    keys.map(async (key) => {
      try {
        await store.delete(key);
      } catch (error) {
        imageLogger.warn("Failed to delete superseded image object", {
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),
  );
}

/**
 * Downloads, transcodes, and uploads both image variants.
 *
 * Any failure throws — the caller must not persist a URL when this rejects.
 * Falling back to the provider's temporary URL would store a link that dies.
 */
export async function storeGeneratedImage(options: {
  recommendationId: string;
  sourceUrl: string;
}): Promise<StoredImageVariants> {
  const { recommendationId, sourceUrl } = options;
  const store = getObjectStore();
  const source = await fetchImageBuffer(sourceUrl);

  let full: Buffer;
  let thumb: Buffer;
  try {
    [full, thumb] = await Promise.all([
      toWebp(source, FULL_WIDTH, FULL_QUALITY),
      toWebp(source, THUMB_WIDTH, THUMB_QUALITY),
    ]);
  } catch (error) {
    throw new ImagePipelineError(
      "IMAGE_PROCESSING_FAILED",
      error instanceof Error ? error.message : "Unknown transcoding error",
    );
  }

  const digest = createHash("sha256").update(full).digest("hex").slice(0, 16);

  try {
    const [fullResult, thumbResult] = await Promise.all([
      store.put(
        buildImageKey(recommendationId, digest, "full"),
        full,
        "image/webp",
      ),
      store.put(
        buildImageKey(recommendationId, digest, "thumb"),
        thumb,
        "image/webp",
      ),
    ]);

    return {
      imageUrl: fullResult.url,
      thumbnailUrl: thumbResult.url,
    };
  } catch (error) {
    throw new ImagePipelineError(
      "IMAGE_UPLOAD_FAILED",
      error instanceof Error ? error.message : "Unknown upload error",
    );
  }
}
